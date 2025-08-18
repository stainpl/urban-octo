'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = { id: string; email: string; role: string } | null;

type AuthContextValue = {
  user: User;
  accessToken?: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // try refresh on mount (credentials include cookie)
    (async () => {
      try {
        const res = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) throw new Error('no session');
        const json = await res.json();
        setUser(json.user);
        setAccessToken(json.accessToken);
      } catch {
        setUser(null);
        setAccessToken(undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || 'Login failed');
    }
    const j = await res.json();
    setUser(j.user);
    setAccessToken(j.accessToken);
  }

  async function register(email: string, password: string, role?: string) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, role })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || 'Register failed');
    }
    const j = await res.json();
    setUser(j.user);
    setAccessToken(j.accessToken);
  }

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setAccessToken(undefined);
    router.push('/');
  }

  async function requestPasswordReset(email: string) {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || 'Request failed');
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}