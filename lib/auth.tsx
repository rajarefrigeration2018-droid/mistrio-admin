// lib/auth.tsx — session state shared by every screen.
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken, getToken, setToken } from './api';

export type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
};

type Ctx = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
};

const AuthCtx = createContext<Ctx>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  can: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) {
        if (alive) setLoading(false);
        return;
      }
      try {
        const me = await api<Admin>('/auth/admin/me');
        if (alive) setAdmin(me);
      } catch {
        clearToken();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ token: string; admin: Admin }>('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(res.token);
    setAdmin(res.admin);
    router.push('/dashboard');
  }

  function logout() {
    clearToken();
    setAdmin(null);
    router.push('/login');
  }

  function can(permission: string) {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    if (admin.permissions?.all) return true;
    return Boolean(admin.permissions?.[permission]);
  }

  return (
    <AuthCtx.Provider value={{ admin, loading, login, logout, can }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
