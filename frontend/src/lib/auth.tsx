import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAuthToken } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { AuthSession, PublicUser } from '@/types';

const TOKEN_KEY = 'ct-token';

interface AuthContextValue {
  user: PublicUser | null;
  profile: Record<string, any> | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<PublicUser | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const applySession = useCallback((session: AuthSession) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
    setProfile(session.profile ?? null);
    setStatus('authenticated');
    connectSocket(session.token);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
    disconnectSocket();
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api<AuthSession>('/auth/login', { method: 'POST', body: { email, password } });
      applySession(session);
    },
    [applySession],
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const session = await api<AuthSession>('/auth/me');
    setUser(session.user);
    setProfile(session.profile ?? null);
    setStatus('authenticated');
  }, [token]);

  // Validate the stored token on first load
  useEffect(() => {
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    setAuthToken(token);
    api<AuthSession>('/auth/me')
      .then((session) => {
        setUser(session.user);
        setProfile(session.profile ?? null);
        setStatus('authenticated');
        connectSocket(token);
      })
      .catch(() => {
        clearSession();
      });
  }, [token, clearSession]);

  // Global: session expired anywhere
  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener('ct:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ct:unauthorized', onUnauthorized);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, token, status, login, logout, refreshProfile, updateUser: setUser }),
    [user, profile, token, status, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
