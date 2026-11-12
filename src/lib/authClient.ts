export interface AdminUser {
  email: string;
  name: string;
  issuedAt?: number;
  expiresAt?: number;
}

export interface AuthStatus {
  authenticated: boolean;
  authorized: boolean;
  user: AdminUser | null;
}

const TOKEN_KEY = 'ph_admin_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Checks current session with the server
 */
export async function checkAdminSession(): Promise<AuthStatus> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers,
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      return {
        authenticated: Boolean(data.authenticated),
        authorized: Boolean(data.authorized),
        user: data.user || null,
      };
    }
  } catch (err) {
    console.error('Session check error:', err);
  }

  return { authenticated: false, authorized: false, user: null };
}

/**
 * Attempts to log in to the Admin Portal with an email
 */
export async function loginAdmin(email: string, name?: string): Promise<{
  success: boolean;
  authorized: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, name }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        authorized: false,
        error: data.error || 'Login authorization failed.',
      };
    }

    if (data.token) {
      saveStoredToken(data.token);
    }

    return {
      success: true,
      authorized: true,
      user: data.user,
    };
  } catch (err: any) {
    return {
      success: false,
      authorized: false,
      error: 'Network error connecting to authentication service.',
    };
  }
}

/**
 * Logs out the administrator
 */
export async function logoutAdmin(): Promise<void> {
  saveStoredToken(null);
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}
