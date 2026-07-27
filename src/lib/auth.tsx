"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  age: number | null;
  weight: number | null;
  weightLog: { date: string; weight: number }[];
}

interface ProfileFields {
  name: string;
  age: number | null;
  weight: number | null;
  weightLog: { date: string; weight: number }[];
}

interface AuthStore {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: { name?: string; age?: number | null }) => Promise<void>;
  logWeight: (weight: number) => Promise<void>;
}

const AuthContext = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await api.post<AuthUser>("/api/auth/login", { email, password });
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const me = await api.post<AuthUser>("/api/auth/register", { email, password, name });
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: { name?: string; age?: number | null }) => {
    const updated = await api.patch<ProfileFields>("/api/profile", patch);
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  const logWeight = useCallback(async (weight: number) => {
    const updated = await api.patch<ProfileFields>("/api/profile", { weight });
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refresh, updateProfile, logWeight }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
