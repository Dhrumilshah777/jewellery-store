'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api';

type User = {
  _id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
};

const STORAGE_ACCESS = 'jewellery_access';
const STORAGE_REFRESH = 'jewellery_refresh';

const AuthContext = createContext<{
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
} | null>(null);

function getStoredTokens() {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  return {
    access: localStorage.getItem(STORAGE_ACCESS),
    refresh: localStorage.getItem(STORAGE_REFRESH),
  };
}

function setStoredTokens(access: string | null, refresh: string | null) {
  if (typeof window === 'undefined') return;
  if (access) localStorage.setItem(STORAGE_ACCESS, access);
  else localStorage.removeItem(STORAGE_ACCESS);
  if (refresh) localStorage.setItem(STORAGE_REFRESH, refresh);
  else localStorage.removeItem(STORAGE_REFRESH);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    loading: true,
    isAuthenticated: false,
  });

  const refreshAuth = useCallback(async () => {
    const { access, refresh } = getStoredTokens();
    if (access) {
      const res = await authApi.me(access);
      if (res.success && res.user) {
        setState({
          user: res.user as User,
          accessToken: access,
          loading: false,
          isAuthenticated: true,
        });
        return;
      }
    }
    if (refresh) {
      const res = await authApi.refresh(refresh);
      if (res.success && res.accessToken && res.refreshToken && res.user) {
        setStoredTokens(res.accessToken, res.refreshToken);
        setState({
          user: res.user as User,
          accessToken: res.accessToken,
          loading: false,
          isAuthenticated: true,
        });
        return;
      }
    }
    setStoredTokens(null, null);
    setState({ user: null, accessToken: null, loading: false, isAuthenticated: false });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (!res.success) return { success: false, message: res.message || 'Login failed' };
    if (!res.accessToken || !res.refreshToken || !res.user) return { success: false, message: 'Invalid response' };
    setStoredTokens(res.accessToken, res.refreshToken);
    setState({
      user: res.user as User,
      accessToken: res.accessToken,
      loading: false,
      isAuthenticated: true,
    });
    return { success: true };
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; name: string; phone?: string }) => {
      const res = await authApi.register(data);
      if (!res.success) return { success: false, message: res.message || 'Registration failed' };
      if (!res.accessToken || !res.refreshToken || !res.user) return { success: false, message: 'Invalid response' };
      setStoredTokens(res.accessToken, res.refreshToken);
      setState({
        user: res.user as User,
        accessToken: res.accessToken,
        loading: false,
        isAuthenticated: true,
      });
      return { success: true };
    },
    []
  );

  const logout = useCallback(async () => {
    const { access } = getStoredTokens();
    if (access) await authApi.logout(access);
    setStoredTokens(null, null);
    setState({ user: null, accessToken: null, loading: false, isAuthenticated: false });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshAuth,
    }),
    [state, login, register, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
