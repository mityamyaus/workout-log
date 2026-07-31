"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DraftExercise, Goal, PlannedWorkout, Program, ProgramExercise, WorkoutSession } from "./types";
import { DEFAULT_PROGRAM_COLOR } from "./colors";
import type { Exercise, MuscleGroup, Equipment } from "./exercises";
import { api, NetworkError } from "./api";
import { useAuth } from "./auth";
import { loadQueue, saveQueue, newOpId, newTempId, isTempId, resolveId, type QueueOp } from "./offlineQueue";
import { todayStr } from "./date";

const DRAFT_KEY = "wa_draft_v1";
const CACHE_KEY = "wa_data_cache_v1";

interface Cache {
  sessions: WorkoutSession[];
  programs: Program[];
  plans: PlannedWorkout[];
  customExercises: Exercise[];
  goals: Goal[];
}

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
  online: boolean;
  pendingCount: number;
  draft: DraftSession | null;
  startDraft: (options?: StartDraftOptions) => void;
  startProgram: (programId: string) => void;
  discardDraft: () => void;
  addExerciseToDraft: (exerciseId: string, name: string, category: string) => void;
  removeExerciseFromDraft: (exerciseId: string) => void;
  reorderDraftExercises: (fromExerciseId: string, toExerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, index: number, patch: Partial<{ weight: number; reps: number; completed: boolean }>) => void;
  removeSet: (exerciseId: string, index: number) => void;
  finishDraft: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  saveProgram: (program: { id?: string; name: string; color: string; exercises: ProgramExercise[] }) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  addPlan: (input: {
    date: string;
    time: string | null;
    programId: string | null;
    title: string;
    color: string;
    reminderMinutesBefore: number | null;
  }) => Promise<void>;
  updatePlan: (
    id: string,
    input: {
      date: string;
      time: string | null;
      programId: string | null;
      title: string;
      color: string;
      reminderMinutesBefore: number | null;
    }
  ) => Promise<void>;
  removePlan: (id: string) => Promise<void>;
  addCustomExercise: (name: string, category: MuscleGroup, equipment: Equipment) => Promise<Exercise>;
  goals: Goal[];
  addGoal: (goal: {
    exerciseId: string;
    exerciseName: string;
    targetType: Goal["targetType"];
    targetValue: number;
    targetReps: number | null;
    startValue: number;
    startDate: string;
    deadline: string | null;
  }) => Promise<void>;
  archiveGoal: (id: string, archived: boolean) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

/** Computed in the device's local timezone so the server only ever deals with an absolute instant. */
function computeRemindAt(date: string, time: string | null, reminderMinutesBefore: number | null): number | null {
  if (!time || reminderMinutesBefore === null) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const workoutAt = new Date(year, month - 1, day, hour, minute);
  return workoutAt.getTime() - reminderMinutesBefore * 60_000;
}

function loadCache(): Cache {
  const empty: Cache = { sessions: [], programs: [], plans: [], customExercises: [], goals: [] };
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch {}
  return empty;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plans, setPlans] = useState<PlannedWorkout[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const flushing = useRef(false);

  // Keep latest state in refs so the queue flush (which runs outside React's
  // render cycle) always mutates from current values, not a stale closure.
  const stateRef = useRef({ sessions, programs, plans, customExercises, goals });
  stateRef.current = { sessions, programs, plans, customExercises, goals };

  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setDraft(JSON.parse(d));
    } catch {}
    setOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  }, [draft]);

  const persistCache = useCallback((patch: Partial<Cache>) => {
    const current = loadCache();
    const next = { ...current, ...patch };
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  }, []);

  const updatePendingCount = useCallback(() => {
    setPendingCount(loadQueue().length);
  }, []);

  const runOp = useCallback(async (kind: QueueOp["kind"], payload: Record<string, unknown>): Promise<unknown> => {
    switch (kind) {
      case "createWorkout": {
        const { tempId: _tempId, ...body } = payload;
        return api.post("/api/workouts", body);
      }
      case "deleteWorkout":
        return api.delete(`/api/workouts/${payload.id}`);
      case "saveProgram": {
        const { tempId: _tempId, ...body } = payload;
        return api.post("/api/programs", body);
      }
      case "deleteProgram":
        return api.delete(`/api/programs/${payload.id}`);
      case "addPlan": {
        const { tempId: _tempId, ...body } = payload;
        return api.post("/api/plans", body);
      }
      case "updatePlan": {
        const { id, ...body } = payload;
        return api.patch(`/api/plans/${id}`, body);
      }
      case "removePlan":
        return api.delete(`/api/plans/${payload.id}`);
      case "addCustomExercise": {
        const { tempId: _tempId, ...body } = payload;
        return api.post("/api/custom-exercises", body);
      }
      case "updateProfile":
        return api.patch("/api/profile", payload);
      case "addGoal": {
        const { tempId: _tempId, ...body } = payload;
        return api.post("/api/goals", body);
      }
      case "archiveGoal": {
        const { id, archived } = payload;
        return api.patch(`/api/goals/${id}`, { archived });
      }
      case "deleteGoal":
        return api.delete(`/api/goals/${payload.id}`);
      default:
        return undefined;
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const idMap: Record<string, string> = {};
      let queue = loadQueue();
      while (queue.length > 0) {
        const op = queue[0];
        const resolvedPayload: Record<string, unknown> = { ...op.payload };
        for (const key of ["programId", "id"]) {
          if (typeof resolvedPayload[key] === "string") {
            resolvedPayload[key] = resolveId(resolvedPayload[key] as string, idMap);
          }
        }
        try {
          const result = await runOp(op.kind, resolvedPayload);
          if (result && typeof result === "object" && "id" in result && typeof op.payload.tempId === "string") {
            const realId = (result as { id: string }).id;
            idMap[op.payload.tempId] = realId;
            reconcileTempId(op.kind, op.payload.tempId, result as never);
          }
          queue = queue.slice(1);
          saveQueue(queue);
          updatePendingCount();
        } catch (err) {
          if (err instanceof NetworkError) {
            setOnline(false);
            break;
          }
          // Non-network failure (validation/404/etc): drop the op, it can't succeed on retry.
          queue = queue.slice(1);
          saveQueue(queue);
          updatePendingCount();
        }
      }
    } finally {
      flushing.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runOp, updatePendingCount]);

  const reconcileTempId = useCallback((kind: QueueOp["kind"], tempId: string, result: WorkoutSession | Program | PlannedWorkout | Exercise | Goal) => {
    if (kind === "createWorkout") {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === tempId ? (result as WorkoutSession) : s));
        persistCache({ sessions: next });
        return next;
      });
    } else if (kind === "saveProgram") {
      setPrograms((prev) => {
        const next = prev.map((p) => (p.id === tempId ? (result as Program) : p));
        persistCache({ programs: next });
        return next;
      });
      setPlans((prev) => {
        const next = prev.map((pl) => (pl.programId === tempId ? { ...pl, programId: (result as Program).id } : pl));
        persistCache({ plans: next });
        return next;
      });
    } else if (kind === "addPlan") {
      setPlans((prev) => {
        const next = prev.map((p) => (p.id === tempId ? (result as PlannedWorkout) : p));
        persistCache({ plans: next });
        return next;
      });
    } else if (kind === "addCustomExercise") {
      setCustomExercises((prev) => {
        const next = prev.map((e) => (e.id === tempId ? (result as Exercise) : e));
        persistCache({ customExercises: next });
        return next;
      });
    } else if (kind === "addGoal") {
      setGoals((prev) => {
        const next = prev.map((g) => (g.id === tempId ? (result as Goal) : g));
        persistCache({ goals: next });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistCache]);

  const enqueue = useCallback(
    (kind: QueueOp["kind"], payload: Record<string, unknown>) => {
      const queue = loadQueue();
      queue.push({ id: newOpId(), kind, payload, createdAt: Date.now() });
      saveQueue(queue);
      updatePendingCount();
    },
    [updatePendingCount]
  );

  /** If `id` is a still-unsynced temp id, remove its pending create op instead of queueing a delete. Returns true if cancelled. */
  const cancelPendingCreate = useCallback((tempId: string, createKind: QueueOp["kind"]): boolean => {
    const queue = loadQueue();
    const idx = queue.findIndex((op) => op.kind === createKind && op.payload.tempId === tempId);
    if (idx === -1) return false;
    queue.splice(idx, 1);
    saveQueue(queue);
    updatePendingCount();
    return true;
  }, [updatePendingCount]);

  // Bootstrap: load local cache immediately (works offline), then reconcile with server.
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setPrograms([]);
      setPlans([]);
      setCustomExercises([]);
      setGoals([]);
      setReady(true);
      return;
    }
    const cache = loadCache();
    setSessions(cache.sessions);
    setPrograms(cache.programs);
    setPlans(cache.plans);
    setCustomExercises(cache.customExercises);
    setGoals(cache.goals);
    setReady(true);

    api
      .get<{
        sessions: WorkoutSession[];
        programs: Program[];
        plans: PlannedWorkout[];
        customExercises: Exercise[];
        goals: Goal[];
      }>("/api/bootstrap")
      .then(({ sessions: s, programs: p, plans: pl, customExercises: ce, goals: g }) => {
        setOnline(true);
        const pendingIds = new Set(loadQueue().map((op) => op.payload.tempId).filter(Boolean));
        const keepPending = <T extends { id: string }>(local: T[], server: T[]) => [
          ...server,
          ...local.filter((item) => isTempId(item.id) && pendingIds.has(item.id)),
        ];
        const mergedSessions = keepPending(stateRef.current.sessions, s);
        const mergedPrograms = keepPending(stateRef.current.programs, p);
        const mergedPlans = keepPending(stateRef.current.plans, pl);
        const mergedCustom = keepPending(stateRef.current.customExercises, ce);
        const mergedGoals = keepPending(stateRef.current.goals, g);
        setSessions(mergedSessions);
        setPrograms(mergedPrograms);
        setPlans(mergedPlans);
        setCustomExercises(mergedCustom);
        setGoals(mergedGoals);
        persistCache({
          sessions: mergedSessions,
          programs: mergedPrograms,
          plans: mergedPlans,
          customExercises: mergedCustom,
          goals: mergedGoals,
        });
        flushQueue();
      })
      .catch((err) => {
        if (err instanceof NetworkError) setOnline(false);
      });

    updatePendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      flushQueue();
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueue]);

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

  const reorderDraftExercises = useCallback((fromExerciseId: string, toExerciseId: string) => {
    setDraft((prev) => {
      if (!prev || fromExerciseId === toExerciseId) return prev;
      const exercises = [...prev.exercises];
      const fromIndex = exercises.findIndex((e) => e.exerciseId === fromExerciseId);
      const toIndex = exercises.findIndex((e) => e.exerciseId === toExerciseId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);
      return { ...prev, exercises };
    });
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
    const tempId = newTempId("s");
    const optimistic: WorkoutSession = {
      id: tempId,
      date: todayStr(),
      title: draft.title || "Тренировка",
      startedAt: draft.startedAt,
      finishedAt: Date.now(),
      exercises,
      programId: draft.programId,
      color: draft.color,
    };
    setSessions((prev) => {
      const next = [optimistic, ...prev];
      persistCache({ sessions: next });
      return next;
    });
    setDraft(null);

    try {
      const session = await api.post<WorkoutSession>("/api/workouts", {
        date: optimistic.date,
        title: optimistic.title,
        startedAt: optimistic.startedAt,
        finishedAt: optimistic.finishedAt,
        exercises: optimistic.exercises,
        programId: optimistic.programId,
        color: optimistic.color,
      });
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === tempId ? session : s));
        persistCache({ sessions: next });
        return next;
      });
    } catch (err) {
      if (!(err instanceof NetworkError)) throw err;
      setOnline(false);
      enqueue("createWorkout", {
        tempId,
        date: optimistic.date,
        title: optimistic.title,
        startedAt: optimistic.startedAt,
        finishedAt: optimistic.finishedAt,
        exercises: optimistic.exercises,
        programId: optimistic.programId,
        color: optimistic.color,
      });
    }
  }, [draft, persistCache, enqueue]);

  const deleteSession = useCallback(
    async (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistCache({ sessions: next });
        return next;
      });
      if (isTempId(id)) {
        cancelPendingCreate(id, "createWorkout");
        return;
      }
      try {
        await api.delete(`/api/workouts/${id}`);
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("deleteWorkout", { id });
      }
    },
    [persistCache, enqueue, cancelPendingCreate]
  );

  const saveProgram = useCallback(
    async (program: { id?: string; name: string; color: string; exercises: ProgramExercise[] }) => {
      if (program.id && isTempId(program.id)) {
        // Still-unsynced program: patch the pending create op in place.
        const queue = loadQueue();
        const idx = queue.findIndex((op) => op.kind === "saveProgram" && op.payload.tempId === program.id);
        if (idx !== -1) {
          queue[idx].payload = { ...queue[idx].payload, name: program.name, color: program.color, exercises: program.exercises };
          saveQueue(queue);
        }
        setPrograms((prev) => {
          const next = prev.map((p) => (p.id === program.id ? { ...p, ...program, id: program.id! } : p));
          persistCache({ programs: next });
          return next;
        });
        return;
      }

      if (program.id) {
        setPrograms((prev) => {
          const next = prev.map((p) => (p.id === program.id ? { ...p, ...program, id: program.id! } : p));
          persistCache({ programs: next });
          return next;
        });
        try {
          const saved = await api.post<Program>("/api/programs", program);
          setPrograms((prev) => {
            const next = prev.map((p) => (p.id === saved.id ? saved : p));
            persistCache({ programs: next });
            return next;
          });
        } catch (err) {
          if (!(err instanceof NetworkError)) throw err;
          setOnline(false);
          enqueue("saveProgram", { ...program });
        }
        return;
      }

      const tempId = newTempId("p");
      const optimistic: Program = { id: tempId, name: program.name, color: program.color, exercises: program.exercises, createdAt: Date.now() };
      setPrograms((prev) => {
        const next = [...prev, optimistic];
        persistCache({ programs: next });
        return next;
      });
      try {
        const saved = await api.post<Program>("/api/programs", program);
        setPrograms((prev) => {
          const next = prev.map((p) => (p.id === tempId ? saved : p));
          persistCache({ programs: next });
          return next;
        });
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("saveProgram", { tempId, name: program.name, color: program.color, exercises: program.exercises });
      }
    },
    [persistCache, enqueue]
  );

  const deleteProgram = useCallback(
    async (id: string) => {
      setPrograms((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistCache({ programs: next });
        return next;
      });
      setPlans((prev) => {
        const next = prev.filter((p) => p.programId !== id);
        persistCache({ plans: next });
        return next;
      });
      if (isTempId(id)) {
        cancelPendingCreate(id, "saveProgram");
        return;
      }
      try {
        await api.delete(`/api/programs/${id}`);
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("deleteProgram", { id });
      }
    },
    [persistCache, enqueue, cancelPendingCreate]
  );

  const addPlan = useCallback(
    async (input: {
      date: string;
      time: string | null;
      programId: string | null;
      title: string;
      color: string;
      reminderMinutesBefore: number | null;
    }) => {
      const tempId = newTempId("pl");
      const remindAt = computeRemindAt(input.date, input.time, input.reminderMinutesBefore);
      const optimistic: PlannedWorkout = { id: tempId, ...input, remindAt };
      const body = { ...input, remindAt };
      setPlans((prev) => {
        const next = [...prev, optimistic];
        persistCache({ plans: next });
        return next;
      });
      try {
        const plan = await api.post<PlannedWorkout>("/api/plans", body);
        setPlans((prev) => {
          const next = prev.map((p) => (p.id === tempId ? plan : p));
          persistCache({ plans: next });
          return next;
        });
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("addPlan", { tempId, ...body });
      }
    },
    [persistCache, enqueue]
  );

  const updatePlan = useCallback(
    async (
      id: string,
      input: {
        date: string;
        time: string | null;
        programId: string | null;
        title: string;
        color: string;
        reminderMinutesBefore: number | null;
      }
    ) => {
      const remindAt = computeRemindAt(input.date, input.time, input.reminderMinutesBefore);
      const body = { ...input, remindAt };
      const optimistic: PlannedWorkout = { id, ...input, remindAt };

      if (isTempId(id)) {
        // Still-unsynced plan: patch the pending create op in place.
        const queue = loadQueue();
        const idx = queue.findIndex((op) => op.kind === "addPlan" && op.payload.tempId === id);
        if (idx !== -1) {
          queue[idx].payload = { ...queue[idx].payload, ...body };
          saveQueue(queue);
        }
        setPlans((prev) => {
          const next = prev.map((p) => (p.id === id ? optimistic : p));
          persistCache({ plans: next });
          return next;
        });
        return;
      }

      setPlans((prev) => {
        const next = prev.map((p) => (p.id === id ? optimistic : p));
        persistCache({ plans: next });
        return next;
      });
      try {
        const plan = await api.patch<PlannedWorkout>(`/api/plans/${id}`, body);
        setPlans((prev) => {
          const next = prev.map((p) => (p.id === id ? plan : p));
          persistCache({ plans: next });
          return next;
        });
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("updatePlan", { id, ...body });
      }
    },
    [persistCache, enqueue]
  );

  const removePlan = useCallback(
    async (id: string) => {
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistCache({ plans: next });
        return next;
      });
      if (isTempId(id)) {
        cancelPendingCreate(id, "addPlan");
        return;
      }
      try {
        await api.delete(`/api/plans/${id}`);
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("removePlan", { id });
      }
    },
    [persistCache, enqueue, cancelPendingCreate]
  );

  const addCustomExercise = useCallback(
    async (name: string, category: MuscleGroup, equipment: Equipment): Promise<Exercise> => {
      const tempId = newTempId("ce");
      const optimistic: Exercise = { id: tempId, name, category, equipment };
      setCustomExercises((prev) => {
        const next = [...prev, optimistic];
        persistCache({ customExercises: next });
        return next;
      });
      try {
        const exercise = await api.post<Exercise>("/api/custom-exercises", { name, category, equipment });
        setCustomExercises((prev) => {
          const next = prev.map((e) => (e.id === tempId ? exercise : e));
          persistCache({ customExercises: next });
          return next;
        });
        return exercise;
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("addCustomExercise", { tempId, name, category, equipment });
        return optimistic;
      }
    },
    [persistCache, enqueue]
  );

  const addGoal = useCallback(
    async (goal: {
      exerciseId: string;
      exerciseName: string;
      targetType: Goal["targetType"];
      targetValue: number;
      targetReps: number | null;
      startValue: number;
      startDate: string;
      deadline: string | null;
    }) => {
      const tempId = newTempId("g");
      const optimistic: Goal = { id: tempId, archived: false, createdAt: Date.now(), ...goal };
      setGoals((prev) => {
        const next = [optimistic, ...prev];
        persistCache({ goals: next });
        return next;
      });
      try {
        const saved = await api.post<Goal>("/api/goals", goal);
        setGoals((prev) => {
          const next = prev.map((g) => (g.id === tempId ? saved : g));
          persistCache({ goals: next });
          return next;
        });
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("addGoal", { tempId, ...goal });
      }
    },
    [persistCache, enqueue]
  );

  const archiveGoal = useCallback(
    async (id: string, archived: boolean) => {
      setGoals((prev) => {
        const next = prev.map((g) => (g.id === id ? { ...g, archived } : g));
        persistCache({ goals: next });
        return next;
      });
      if (isTempId(id)) return;
      try {
        await api.patch(`/api/goals/${id}`, { archived });
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("archiveGoal", { id, archived });
      }
    },
    [persistCache, enqueue]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setGoals((prev) => {
        const next = prev.filter((g) => g.id !== id);
        persistCache({ goals: next });
        return next;
      });
      if (isTempId(id)) {
        cancelPendingCreate(id, "addGoal");
        return;
      }
      try {
        await api.delete(`/api/goals/${id}`);
      } catch (err) {
        if (!(err instanceof NetworkError)) throw err;
        setOnline(false);
        enqueue("deleteGoal", { id });
      }
    },
    [persistCache, enqueue, cancelPendingCreate]
  );

  const value = useMemo<Store>(
    () => ({
      sessions,
      programs,
      plans,
      customExercises,
      ready,
      online,
      pendingCount,
      draft,
      startDraft,
      startProgram,
      discardDraft,
      addExerciseToDraft,
      removeExerciseFromDraft,
      reorderDraftExercises,
      addSet,
      updateSet,
      removeSet,
      finishDraft,
      deleteSession,
      saveProgram,
      deleteProgram,
      addPlan,
      updatePlan,
      removePlan,
      addCustomExercise,
      goals,
      addGoal,
      archiveGoal,
      deleteGoal,
    }),
    [
      sessions,
      programs,
      plans,
      customExercises,
      ready,
      online,
      pendingCount,
      draft,
      startDraft,
      startProgram,
      discardDraft,
      addExerciseToDraft,
      removeExerciseFromDraft,
      reorderDraftExercises,
      addSet,
      updateSet,
      removeSet,
      finishDraft,
      deleteSession,
      saveProgram,
      deleteProgram,
      addPlan,
      updatePlan,
      removePlan,
      addCustomExercise,
      goals,
      addGoal,
      archiveGoal,
      deleteGoal,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
