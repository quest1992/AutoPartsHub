export type AuthUser = { id: string; phone: string; firstName: string; lastName: string | null; role: string; shopId: string | null };
const tokenKey = 'autostock.accessToken'; const userKey = 'autostock.user';
export function saveSession(token: string, user: AuthUser) { localStorage.setItem(tokenKey, token); localStorage.setItem(userKey, JSON.stringify(user)); }
export function getToken() { return typeof window === 'undefined' ? null : localStorage.getItem(tokenKey); }
export function getUser(): AuthUser | null { if (typeof window === 'undefined') return null; const value = localStorage.getItem(userKey); try { return value ? JSON.parse(value) as AuthUser : null; } catch { return null; } }
export function clearSession() { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); }
