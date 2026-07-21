'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ApiError,
  CurrentUser,
  getCurrentUser,
  login as apiLogin,
} from '../lib/api';
import { clearSession, getToken, saveSession } from '../lib/auth';

type AuthContextValue = {
  user: CurrentUser | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasRole: (...roles: CurrentUser['role'][]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  const logout = useCallback(() => {
    clearSession();
    if (isMountedRef.current) {
      setUser(null);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!getToken()) {
      if (isMountedRef.current) {
        setUser(null);
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await getCurrentUser();
      if (isMountedRef.current) {
        setUser(response.user);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
      } else {
        throw error;
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    isMountedRef.current = true;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshCurrentUser();
      }
    });

    window.addEventListener('auth:unauthorized', logout);

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      window.removeEventListener('auth:unauthorized', logout);
    };
  }, [logout, refreshCurrentUser]);

  const login = useCallback(
    async (phone: string, password: string) => {
      const response = await apiLogin(phone, password);
      saveSession(response.accessToken, response.user);

      if (isMountedRef.current) {
        setIsLoading(true);
      }

      await refreshCurrentUser();
    },
    [refreshCurrentUser],
  );

  const value: AuthContextValue = {
    user,
    permissions: user?.permissions ?? [],
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshCurrentUser,
    hasPermission: (permission) => Boolean(user?.permissions.includes(permission)),
    hasAnyPermission: (...permissions) =>
      permissions.some((permission) => user?.permissions.includes(permission)),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('AuthProvider is required');
  }

  return context;
}
