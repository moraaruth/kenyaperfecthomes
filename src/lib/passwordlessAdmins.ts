// Admin emails that sign in without a password. Server-side only; never sent to the browser.
const PASSWORDLESS_ADMIN_EMAILS = new Set(['mnjosiah@gmail.com', 'iammoraaruth@gmail.com']);

export function isPasswordlessAdminEmail(normalizedEmail: string): boolean {
  return PASSWORDLESS_ADMIN_EMAILS.has(normalizedEmail);
}
