"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DraftExercise, WorkoutSession } from "./types";

const SESSIONS_KEY = "wa_sessions_v1";
const DRAFT_KEY = "wa_draft_v1";

interface DraftSession {
  title: string;
  startedAt: number;
  exercises: DraftExercise[];
}

interface Store {
  sessions: WorkoutSession[];
  ready: boolean;
  draft: DraftSession | null;
  startDraft: () => void;
  discardDraft: () => void;
  addExerciseToDraft: (exerciseId: string, name: string, category: string) => void;
  removeExerciseFromDraft: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, index: number, patch: Partial<{ weight: number; reps: number; completed: boolean }>) => void;
  removeSet: (exerciseId: string, index: number) => void;
  finishDraft: () => void;
  deleteSession: (id: string) => void;
}

const StoreContext = createContext<Store | null>(null);

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSIONS_KEY);
      if (s) setSessions(JSON.parse(s));
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setDraft(JSON.parse(d));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions, ready]);

  useEffect(() => {
    if (!ready) return;
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  }, [draft, ready]);

  const startDraft = useCallback(() => {
    setDraft({ title: "Тренировка", startedAt: Date.now(), exercises: [] });
  }, []);

  const discardDraft = useCallback(() => setDraft(null), []);

  const addExerciseToDraft = useCallback((exerciseId: string, name: string, category: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (prev.exercises.some((e) => e.exerciseId === exerciseId)) return prev;
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          { exerciseId, name, category, sets: [{ weight: 0, reps: 10, completed: false }] },
        ],
      };
    });
  }, []);

  const removeExerciseFromDraft = useCallback((exerciseId: string) => {
    setDraft((prev) =>
      prev ? { ...prev, exercises: prev.exercises.filter((e) => e.exerciseId !== exerciseId) } : prev
    );
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) => {
          if (e.exerciseId !== exerciseId) return e;
          const last = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 10, completed: false }],
          };
        }),
      };
    });
  }, []);

  const updateSet = useCallback(
    (exerciseId: string, index: number, patch: Partial<{ weight: number; reps: number; completed: boolean }>) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((e) => {
            if (e.exerciseId !== exerciseId) return e;
            return {
              ...e,
              sets: e.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)),
            };
          }),
        };
      });
    },
    []
  );

  const removeSet = useCallback((exerciseId: string, index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) =>
          e.exerciseId !== exerciseId ? e : { ...e, sets: e.sets.filter((_, i) => i !== index) }
        ),
      };
    });
  }, []);

  const finishDraft = useCallback(() => {
    if (!draft) return;
    const exercises = draft.exercises.filter((e) => e.sets.length > 0);
    if (exercises.length === 0) {
      setDraft(null);
      return;
    }
    const session: WorkoutSession = {
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: todayStr(),
      title: draft.title || "Тренировка",
      startedAt: draft.startedAt,
      finishedAt: Date.now(),
      exercises,
    };
    setSessions((sPrev) => [session, ...sPrev]);
    setDraft(null);
  }, [draft]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo<Store>(
    () => ({
      sessions,
      ready,
      draft,
      startDraft,
      discardDraft,
      addExerciseToDraft,
      removeExerciseFromDraft,
      addSet,
      updateSet,
      removeSet,
      finishDraft,
      deleteSession,
    }),
    [sessions, ready, draft, startDraft, discardDraft, addExerciseToDraft, removeExerciseFromDraft, addSet, updateSet, removeSet, finishDraft, deleteSession]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
