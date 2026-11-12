const PASSWORDLESS_ADMIN_EMAILS = new Set(['mnjosiah@gmail.com', 'iammoraaruth@gmail.com']);

export function isPasswordlessAdminEmail(email: string): boolean {
  return PASSWORDLESS_ADMIN_EMAILS.has(email);
}
