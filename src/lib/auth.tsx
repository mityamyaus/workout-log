"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, NetworkError } from "./api";
import { loadQueue, saveQueue, newOpId } from "./offlineQueue";
import { todayStr } from "./date";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  age: number | null;
  weight: number | null;
  weightLog: { date: string; weight: number }[];
  shareWeights: boolean;
}

interface ProfileFields {
  name: string;
  age: number | null;
  weight: number | null;
  weightLog: { date: string; weight: number }[];
  shareWeights: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: { name?: string; age?: number | null; shareWeights?: boolean }) => Promise<void>;
  logWeight: (weight: number) => Promise<void>;
}

const AuthContext = createContext<AuthStore | null>(null);

const AUTH_CACHE_KEY = "wa_auth_cache_v1";

function loadCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: AuthUser | null) {
  if (user) localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_CACHE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>("/api/auth/me");
      setUser(me);
      cacheUser(me);
    } catch (err) {
      if (err instanceof NetworkError) {
        // Offline: keep whatever we have cached rather than bouncing to /login.
      } else {
        setUser(null);
        cacheUser(null);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const cached = loadCachedUser();
    if (cached) setUser(cached);
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const me = await api.post<AuthUser>("/api/auth/login", { email, password });
    setUser(me);
    cacheUser(me);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const me = await api.post<AuthUser>("/api/auth/register", { email, password, name });
    setUser(me);
    cacheUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {}
    setUser(null);
    cacheUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: { name?: string; age?: number | null; shareWeights?: boolean }) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      cacheUser(next);
      return next;
    });
    try {
      const updated = await api.patch<ProfileFields>("/api/profile", patch);
      setUser((prev) => {
        const next = prev ? { ...prev, ...updated } : prev;
        cacheUser(next);
        return next;
      });
    } catch (err) {
      if (!(err instanceof NetworkError)) throw err;
      const queue = loadQueue();
      queue.push({ id: newOpId(), kind: "updateProfile", payload: patch, createdAt: Date.now() });
      saveQueue(queue);
    }
  }, []);

  const logWeight = useCallback(async (weight: number) => {
    const date = todayStr();
    setUser((prev) => {
      if (!prev) return prev;
      const weightLog = [...prev.weightLog.filter((e) => e.date !== date), { date, weight }].sort((a, b) =>
        a.date < b.date ? -1 : 1
      );
      const next = { ...prev, weight, weightLog };
      cacheUser(next);
      return next;
    });
    try {
      const updated = await api.patch<ProfileFields>("/api/profile", { weight });
      setUser((prev) => {
        const next = prev ? { ...prev, ...updated } : prev;
        cacheUser(next);
        return next;
      });
    } catch (err) {
      if (!(err instanceof NetworkError)) throw err;
      const queue = loadQueue();
      queue.push({ id: newOpId(), kind: "updateProfile", payload: { weight, date }, createdAt: Date.now() });
      saveQueue(queue);
    }
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
