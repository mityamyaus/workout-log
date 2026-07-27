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
import { api } from "./api";
import { useAuth } from "./auth";

const DRAFT_KEY = "wa_draft_v1";

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
  finishDraft: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  saveProgram: (program: { id?: string; name: string; color: string; exercises: ProgramExercise[] }) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  addPlan: (date: string, programId: string | null, title: string, color: string) => Promise<void>;
  removePlan: (id: string) => Promise<void>;
  addCustomExercise: (name: string, category: MuscleGroup, equipment: Equipment) => Promise<Exercise>;
}

const StoreContext = createContext<Store | null>(null);

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<PlannedWorkout[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setDraft(JSON.parse(d));
    } catch {}
  }, []);

  useEffect(() => {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  }, [draft]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setPrograms([]);
      setPlans([]);
      setCustomExercises([]);
      setReady(true);
      return;
    }
    setReady(false);
    api
      .get<{ sessions: WorkoutSession[]; programs: Program[]; plans: PlannedWorkout[]; customExercises: Exercise[] }>(
        "/api/bootstrap"
      )
      .then(({ sessions: s, programs: p, plans: pl, customExercises: ce }) => {
        setSessions(s);
        setPrograms(p);
        setPlans(pl);
        setCustomExercises(ce);
      })
      .finally(() => setReady(true));
  }, [user]);

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

  const finishDraft = useCallback(async () => {
    if (!draft) return;
    const exercises = draft.exercises.filter((e) => e.sets.length > 0);
    if (exercises.length === 0) {
      setDraft(null);
      return;
    }
    const session = await api.post<WorkoutSession>("/api/workouts", {
      date: todayStr(),
      title: draft.title || "Тренировка",
      startedAt: draft.startedAt,
      finishedAt: Date.now(),
      exercises,
      programId: draft.programId,
      color: draft.color,
    });
    setSessions((prev) => [session, ...prev]);
    setDraft(null);
  }, [draft]);

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await api.delete(`/api/workouts/${id}`);
  }, []);

  const saveProgram = useCallback(
    async (program: { id?: string; name: string; color: string; exercises: ProgramExercise[] }) => {
      const saved = await api.post<Program>("/api/programs", program);
      setPrograms((prev) =>
        program.id ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]
      );
    },
    []
  );

  const deleteProgram = useCallback(async (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    setPlans((prev) => prev.filter((p) => p.programId !== id));
    await api.delete(`/api/programs/${id}`);
  }, []);

  const addPlan = useCallback(async (date: string, programId: string | null, title: string, color: string) => {
    const plan = await api.post<PlannedWorkout>("/api/plans", { date, programId, title, color });
    setPlans((prev) => [...prev, plan]);
  }, []);

  const removePlan = useCallback(async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await api.delete(`/api/plans/${id}`);
  }, []);

  const addCustomExercise = useCallback(
    async (name: string, category: MuscleGroup, equipment: Equipment): Promise<Exercise> => {
      const exercise = await api.post<Exercise>("/api/custom-exercises", { name, category, equipment });
      setCustomExercises((prev) => [...prev, exercise]);
      return exercise;
    },
    []
  );

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
