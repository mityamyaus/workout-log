"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DraftExercise, PlannedWorkout, Program, ProgramExercise, WorkoutSession } from "./types";
import { DEFAULT_PROGRAM_COLOR } from "./colors";
import type { Exercise, MuscleGroup, Equipment } from "./exercises";

const SESSIONS_KEY = "wa_sessions_v1";
const DRAFT_KEY = "wa_draft_v1";
const PROGRAMS_KEY = "wa_programs_v1";
const PLANS_KEY = "wa_plans_v1";
const CUSTOM_EXERCISES_KEY = "wa_custom_exercises_v1";

interface DraftSession {
  title: string;
  startedAt: number;
  exercises: DraftExercise[];
  programId: string | null;
  color: string;
}

interface StartDraftOptions {
  title?: string;
  programId?: string | null;
  color?: string;
  exercises?: DraftExercise[];
}

interface Store {
  sessions: WorkoutSession[];
  programs: Program[];
  plans: PlannedWorkout[];
  customExercises: Exercise[];
  ready: boolean;
  draft: DraftSession | null;
  startDraft: (options?: StartDraftOptions) => void;
  startProgram: (programId: string) => void;
  discardDraft: () => void;
  addExerciseToDraft: (exerciseId: string, name: string, category: string) => void;
  removeExerciseFromDraft: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, index: number, patch: Partial<{ weight: number; reps: number; completed: boolean }>) => void;
  removeSet: (exerciseId: string, index: number) => void;
  finishDraft: () => void;
  deleteSession: (id: string) => void;
  saveProgram: (program: { id?: string; name: string; color: string; exercises: ProgramExercise[] }) => void;
  deleteProgram: (id: string) => void;
  addPlan: (date: string, programId: string | null, title: string, color: string) => void;
  removePlan: (id: string) => void;
  addCustomExercise: (name: string, category: MuscleGroup, equipment: Equipment) => Exercise;
}

const StoreContext = createContext<Store | null>(null);

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<PlannedWorkout[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSessions(load(SESSIONS_KEY, []));
    setPrograms(load(PROGRAMS_KEY, []));
    setPlans(load(PLANS_KEY, []));
    setCustomExercises(load(CUSTOM_EXERCISES_KEY, []));
    setDraft(load(DRAFT_KEY, null));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
  }, [programs, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
  }, [customExercises, ready]);

  useEffect(() => {
    if (!ready) return;
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  }, [draft, ready]);

  const startDraft = useCallback((options?: StartDraftOptions) => {
    setDraft({
      title: options?.title || "Тренировка",
      startedAt: Date.now(),
      exercises: options?.exercises ?? [],
      programId: options?.programId ?? null,
      color: options?.color ?? DEFAULT_PROGRAM_COLOR,
    });
  }, []);

  const startProgram = useCallback(
    (programId: string) => {
      const p = programs.find((pr) => pr.id === programId);
      if (!p) {
        startDraft();
        return;
      }
      startDraft({
        title: p.name,
        programId: p.id,
        color: p.color,
        exercises: p.exercises.map((pe) => ({
          exerciseId: pe.exerciseId,
          name: pe.name,
          category: pe.category,
          sets: Array.from({ length: pe.sets }, () => ({ weight: 0, reps: pe.reps, completed: false })),
        })),
      });
    },
    [programs, startDraft]
  );

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
      programId: draft.programId,
      color: draft.color,
    };
    setSessions((sPrev) => [session, ...sPrev]);
    setDraft(null);
  }, [draft]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const saveProgram = useCallback(
    (program: { id?: string; name: string; color: string; exercises: ProgramExercise[] }) => {
      setPrograms((prev) => {
        if (program.id) {
          return prev.map((p) => (p.id === program.id ? { ...p, ...program, id: program.id } : p));
        }
        const created: Program = {
          id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: program.name,
          color: program.color,
          exercises: program.exercises,
          createdAt: Date.now(),
        };
        return [...prev, created];
      });
    },
    []
  );

  const deleteProgram = useCallback((id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    setPlans((prev) => prev.filter((p) => p.programId !== id));
  }, []);

  const addPlan = useCallback((date: string, programId: string | null, title: string, color: string) => {
    setPlans((prev) => [
      ...prev,
      { id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, date, programId, title, color },
    ]);
  }, []);

  const removePlan = useCallback((id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addCustomExercise = useCallback((name: string, category: MuscleGroup, equipment: Equipment): Exercise => {
    const exercise: Exercise = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      category,
      equipment,
    };
    setCustomExercises((prev) => [...prev, exercise]);
    return exercise;
  }, []);

  const value = useMemo<Store>(
    () => ({
      sessions,
      programs,
      plans,
      customExercises,
      ready,
      draft,
      startDraft,
      startProgram,
      discardDraft,
      addExerciseToDraft,
      removeExerciseFromDraft,
      addSet,
      updateSet,
      removeSet,
      finishDraft,
      deleteSession,
      saveProgram,
      deleteProgram,
      addPlan,
      removePlan,
      addCustomExercise,
    }),
    [
      sessions,
      programs,
      plans,
      customExercises,
      ready,
      draft,
      startDraft,
      startProgram,
      discardDraft,
      addExerciseToDraft,
      removeExerciseFromDraft,
      addSet,
      updateSet,
      removeSet,
      finishDraft,
      deleteSession,
      saveProgram,
      deleteProgram,
      addPlan,
      removePlan,
      addCustomExercise,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
