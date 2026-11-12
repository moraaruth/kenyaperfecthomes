import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ADMIN_EMAILS, normalizeEmail, isAdminEmail } from './adminAccess';

export { ADMIN_EMAILS, normalizeEmail, isAdminEmail };

export const SESSION_COOKIE_NAME = 'ph_admin_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminSession {
  email: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

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
export function createAdminSessionToken(email: string, name?: string): string {
  const normalized = normalizeEmail(email);
  if (!isAdminEmail(normalized)) {
    throw new Error(`Unauthorized email address: ${normalized}`);
  }

  const session: AdminSession = {
    email: normalized,
    name: name || (normalized === 'iammoraaruth@gmail.com' ? 'Ruth Moraa' : 'Josiah M.'),
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

/**
 * Verifies a signed session token. Returns the AdminSession if valid and authorized, or null.
 */
export function verifyAdminSessionToken(token: string | null | undefined): AdminSession | null {
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

    // Verify against strict allowlist
    if (!isAdminEmail(session.email)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Server-Side Express Middleware: requireAdminAuth
 * Enforces both authentication AND authorization against the strict two-email allowlist.
 */
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Extract token from HTTP-only cookie or Authorization header
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to the Perfect Homes Admin Portal.',
      code: 'UNAUTHENTICATED',
    });
  }

  const session = verifyAdminSessionToken(token);
  if (!session) {
    return res.status(403).json({
      error: 'Access denied: You are not authorized to access administrative operations.',
      code: 'FORBIDDEN',
    });
  }

  req.adminUser = session;
  next();
}
