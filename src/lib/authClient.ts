export type StaffRole = 'admin' | 'agent' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'disabled';

export interface AdminUser {
  email: string;
  name: string;
  role: StaffRole;
  issuedAt?: number;
  expiresAt?: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: AccountStatus;
  lastLogin?: string | null;
  createdAt?: string;
}

export const canManageProperties = (user: AdminUser | null | undefined): boolean =>
  user?.role === 'admin' || user?.role === 'agent';

export const isFullAdmin = (user: AdminUser | null | undefined): boolean => user?.role === 'admin';

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || 'Request failed. Please try again.' };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }
}

export interface AuthStatus {
  authenticated: boolean;
  authorized: boolean;
  user: AdminUser | null;
}

const LEGACY_TOKEN_KEY = 'ph_admin_token';

// Sessions live only in the HttpOnly cookie. Remove any token left by older builds.
function clearLegacyToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

/**
 * Checks current session with the server
 */
export async function checkAdminSession(): Promise<AuthStatus> {
  clearLegacyToken();

  try {
    const res = await fetch('/api/auth/me', {
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
  } catch {
    // silent — session check failure is not an error worth logging
  }

  return { authenticated: false, authorized: false, user: null };
}

export interface LoginResult {
  success: boolean;
  authorized: boolean;
  user?: AdminUser;
  error?: string;
}

/**
 * Signs in with email and password. Every account, including administrators, requires a password.
 */
export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  const result = await apiRequest<{ authorized: boolean; user: AdminUser }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );

  if (!result.ok) {
    return { success: false, authorized: false, error: result.error };
  }

  clearLegacyToken();

  return {
    success: true,
    authorized: Boolean(result.data.authorized),
    user: result.data.user,
  };
}

/**
 * Creates a standard (non-staff) account. The user can sign in immediately.
 */
export async function registerAccount(name: string, email: string, password: string): Promise<LoginResult> {
  const result = await apiRequest<{ user: AdminUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  if (!result.ok) {
    return { success: false, authorized: false, error: result.error };
  }

  clearLegacyToken();

  return { success: true, authorized: false, user: result.data.user };
}

/**
 * Always resolves with the same message, whether or not the account exists.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  const result = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!result.ok) return { ok: false, message: result.error };
  return { ok: true, message: result.data.message };
}

export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; message: string }> {
  const result = await apiRequest<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
  if (!result.ok) return { ok: false, message: result.error };
  return { ok: true, message: result.data.message };
}

export async function listManagedUsers(params: { search?: string; role?: string; status?: string } = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== 'all') as [string, string][]
  ).toString();
  return apiRequest<ManagedUser[]>(`/api/admin/users${query ? `?${query}` : ''}`);
}

export async function createManagedUser(input: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  status: AccountStatus;
}) {
  return apiRequest<ManagedUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateManagedUser(
  id: string,
  input: { name?: string; role?: StaffRole; status?: AccountStatus; password?: string }
) {
  return apiRequest<ManagedUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteManagedUser(id: string) {
  return apiRequest<{ success: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' });
}

export async function createManagedUserResetLink(id: string) {
  return apiRequest<{ resetUrl: string; expiresAt: string }>(`/api/admin/users/${id}/reset-link`, {
    method: 'POST',
  });
}

/**
 * Logs out the administrator
 */
export async function logoutAdmin(): Promise<void> {
  clearLegacyToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}
