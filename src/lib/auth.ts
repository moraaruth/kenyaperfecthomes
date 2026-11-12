import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAILS, normalizeEmail, isAdminEmail } from './adminAccess';
import { UserModel } from '../models/User.ts';

export { ADMIN_EMAILS, normalizeEmail, isAdminEmail };

export const SESSION_COOKIE_NAME = 'ph_admin_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type UserRole = 'admin' | 'agent' | 'user';

export interface AdminSession {
  email: string;
  name: string;
  role: UserRole;
  // Present only for database accounts. Allowlisted admins have no uid.
  uid?: string;
  tokenVersion?: number;
  issuedAt: number;
  expiresAt: number;
}

type SessionPayload = Omit<AdminSession, 'issuedAt' | 'expiresAt'>;

// Extends Express Request to attach adminUser
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminSession;
}

const getSecretKey = (): string => {
  return process.env.ADMIN_SESSION_SECRET || 'perfect-homes-secure-admin-secret-2025';
};

/**
 * Creates a cryptographically signed session token:
 * payload.signature (HMAC SHA-256)
 */
export function signSessionToken(payload: SessionPayload): string {
  const session: AdminSession = {
    ...payload,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/** Token for an allowlisted administrator (email-only sign-in, no database account). */
export function createAdminSessionToken(email: string, name?: string): string {
  const normalized = normalizeEmail(email);
  if (!isAdminEmail(normalized)) {
    throw new Error(`Unauthorized email address: ${normalized}`);
  }

  return signSessionToken({
    email: normalized,
    name: name || (normalized === 'iammoraaruth@gmail.com' ? 'Ruth Moraa' : 'Josiah M.'),
    role: 'admin',
  });
}

/** Token for a database account. Role and status are re-checked on every request. */
export function createUserSessionToken(user: { id: string; email: string; name: string; tokenVersion: number }): string {
  return signSessionToken({
    email: user.email,
    name: user.name,
    role: 'user',
    uid: user.id,
    tokenVersion: user.tokenVersion,
  });
}

/**
 * Verifies the signature and expiry only. Use resolveSession for authorization.
 */
export function verifySessionSignature(token: string | null | undefined): AdminSession | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSecretKey())
    .update(payloadStr)
    .digest('base64url');

  // Timing safe comparison to protect against timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const session: AdminSession = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (!session || !session.email || !session.expiresAt) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Authorizes a session against current server state.
 * - Allowlisted admins (no uid): must still be on the allowlist.
 * - Database accounts: must exist, be active, and have a matching tokenVersion.
 *   The role comes from the database, so role changes apply immediately.
 */
export async function resolveSession(token: string | null | undefined): Promise<AdminSession | null> {
  const session = verifySessionSignature(token);
  if (!session) return null;

  if (!session.uid) {
    if (!isAdminEmail(session.email)) return null;
    return { ...session, role: 'admin' };
  }

  try {
    const user = await UserModel.findById(session.uid).select('email name role status tokenVersion').lean();
    if (!user || user.status !== 'active' || user.tokenVersion !== session.tokenVersion) {
      return null;
    }
    return {
      ...session,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | undefined {
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }
  return token;
}

/**
 * Express middleware factory: authenticates the request and checks its role.
 */
export function requireRoles(...roles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in to the Perfect Homes Admin Portal.',
        code: 'UNAUTHENTICATED',
      });
    }

    const session = await resolveSession(token);
    if (!session) {
      return res.status(401).json({
        error: 'Your session has expired or the account is no longer active. Please sign in again.',
        code: 'SESSION_INVALID',
      });
    }

    if (!roles.includes(session.role)) {
      return res.status(403).json({
        error: 'Access denied: your account does not have permission for this action.',
        code: 'FORBIDDEN',
      });
    }

    req.adminUser = session;
    next();
  };
}

/** Staff access: administrators and agents. */
export const requireAdminAuth = requireRoles('admin', 'agent');

/** Administrator-only access, e.g. user management. */
export const requireAdminOnly = requireRoles('admin');
