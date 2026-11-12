/**
 * Single source of truth for administrator authorization.
 * Safe to import from both the browser bundle and the server (no Node/Express dependencies).
 */
export const ADMIN_EMAILS: readonly string[] = [
  'mnjosiah@gmail.com',
  'iammoraaruth@gmail.com',
] as const;

// Case-insensitive and whitespace-safe
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

// Returns true only for the strict two-email allowlist
export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized !== '' && ADMIN_EMAILS.includes(normalized);
}
