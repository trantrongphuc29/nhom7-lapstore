import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'lapstore_auth_token';
const USER_KEY = 'lapstore_auth_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_ME, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) return null;
      const payload = data?.data || data;
      if (payload?.id != null && payload?.email) {
        setUser((prev) => ({
          ...prev,
          id: payload.id,
          email: payload.email,
          fullName: payload.fullName ?? null,
          phone: payload.phone ?? null,
          role: payload.role,
          permissions: payload.permissions,
        }));
      }
      return payload;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const ac = new AbortController();
    fetch(API_ENDPOINTS.AUTH_ME, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ac.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const payload = data?.data || data;
        if (payload?.id != null && payload?.email) {
          setUser((prev) => ({
            ...prev,
            id: payload.id,
            email: payload.email,
            fullName: payload.fullName ?? null,
            phone: payload.phone ?? null,
            role: payload.role,
            permissions: payload.permissions,
          }));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
      });
    return () => ac.abort();
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      const payload = data?.data || data;
      setToken(payload.token);
      setUser(payload.user);
      return payload.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, confirmPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Register failed');
      }
      return data?.data || data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [token, user, isLoading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
