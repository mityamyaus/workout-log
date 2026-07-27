"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PROFILE_KEY = "wa_profile_v1";

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface Profile {
  name: string;
  age: number | null;
  weight: number | null;
  weightLog: WeightEntry[];
}

const EMPTY_PROFILE: Profile = { name: "", age: null, weight: null, weightLog: [] };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface ProfileStore {
  profile: Profile;
  ready: boolean;
  updateProfile: (patch: Partial<Pick<Profile, "name" | "age">>) => void;
  logWeight: (weight: number, date?: string) => void;
}

const ProfileContext = createContext<ProfileStore | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile, ready]);

  const updateProfile = useCallback((patch: Partial<Pick<Profile, "name" | "age">>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const logWeight = useCallback((weight: number, date = todayStr()) => {
    setProfile((prev) => {
      const rest = prev.weightLog.filter((e) => e.date !== date);
      const weightLog = [...rest, { date, weight }].sort((a, b) => (a.date < b.date ? -1 : 1));
      return { ...prev, weight, weightLog };
    });
  }, []);

  const value = useMemo<ProfileStore>(
    () => ({ profile, ready, updateProfile, logWeight }),
    [profile, ready, updateProfile, logWeight]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
