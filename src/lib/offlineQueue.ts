export type QueueOpKind =
  | "createWorkout"
  | "deleteWorkout"
  | "saveProgram"
  | "deleteProgram"
  | "addPlan"
  | "updatePlan"
  | "removePlan"
  | "addCustomExercise"
  | "updateProfile"
  | "addGoal"
  | "archiveGoal"
  | "deleteGoal";

export interface QueueOp {
  id: string;
  kind: QueueOpKind;
  payload: Record<string, unknown>;
  createdAt: number;
}

const QUEUE_KEY = "wa_queue_v1";

export function loadQueue(): QueueOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue: QueueOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function newOpId() {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newTempId(prefix: string) {
  return `local_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isTempId(id: string | null | undefined) {
  return !!id && id.startsWith("local_");
}

/** Resolve a possibly-temp id against a temp->real id map built up as ops flush. */
export function resolveId(id: string | null | undefined, idMap: Record<string, string>): string | null {
  if (!id) return id ?? null;
  return idMap[id] ?? id;
}
