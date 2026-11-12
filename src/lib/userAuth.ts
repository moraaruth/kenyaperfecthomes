import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 128) {
    return 'Password must be 128 characters or fewer.';
  }
  return null;
}

export function validateName(name: unknown): string | null {
  if (typeof name !== 'string' || name.trim().length < 2) {
    return 'Please enter a full name (at least 2 characters).';
  }
  if (name.trim().length > 120) {
    return 'Name must be 120 characters or fewer.';
  }
  return null;
}

export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

/** Creates a random reset token; only the SHA-256 hash is stored in the database. */
export function createResetToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = crypto.randomBytes(32).toString('base64url');
  return {
    raw,
    hash: hashResetToken(raw),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

export function hashResetToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function sanitizeUser(user: any) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin ?? null,
    createdAt: user.createdAt ?? null,
    resetRequestedAt: user.resetRequestedAt ?? null,
  };
}

/**
 * Simple fixed-window rate limiter keyed by client IP.
 * State is per process, so it is a basic brute-force brake, not a hard global limit.
 */
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    return next();
  };
}
