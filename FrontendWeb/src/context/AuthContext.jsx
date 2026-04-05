import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { AUTH_UNAUTHORIZED_EVENT, sanitizeStoredToken } from '../utils/authSession';

const AuthContext = createContext(null);
const TOKEN_KEY = 'lapstore_auth_token';
const USER_KEY = 'lapstore_auth_user';

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sanitizeStoredToken(localStorage.getItem(TOKEN_KEY)));
  const [user, setUser] = useState(() => {
    const clean = sanitizeStoredToken(localStorage.getItem(TOKEN_KEY));
    if (!clean) return null;
    return readStoredUser();
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw && !sanitizeStoredToken(raw)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

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
    const t = sanitizeStoredToken(token);
    if (!t) return null;
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_ME, { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 401) {
        setToken('');
        setUser(null);
        return null;
      }
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
    const t = sanitizeStoredToken(token);
    if (!t) return undefined;
    const ac = new AbortController();
    fetch(API_ENDPOINTS.AUTH_ME, {
      headers: { Authorization: `Bearer ${t}` },
      signal: ac.signal,
    })
      .then((res) => {
        if (res.status === 401) {
          setToken('');
          setUser(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
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

  useEffect(() => {
    const clearSession = () => {
      setToken('');
      setUser(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearSession);
  }, []);

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
      const nextToken = payload?.token;
      if (!nextToken || typeof nextToken !== 'string') {
        throw new Error('Phản hồi đăng nhập không hợp lệ (thiếu token). Kiểm tra API backend.');
      }
      setToken(sanitizeStoredToken(nextToken));
      setUser(payload.user ?? null);
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
