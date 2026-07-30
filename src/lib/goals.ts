import type { Goal, WorkoutSession } from "./types";

export type GoalStatus = "ACTIVE" | "ACHIEVED" | "FAILED";

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  progressPct: number;
  status: GoalStatus;
  achievedDate: string | null;
  forecastDate: string | null;
  aheadOfSchedule: boolean | null;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bestValueForSession(session: WorkoutSession, goal: Goal): number | null {
  const ex = session.exercises.find((e) => e.exerciseId === goal.exerciseId);
  if (!ex) return null;
  const completed = ex.sets.filter((s) => s.completed && s.weight > 0);
  if (completed.length === 0) return null;

  if (goal.targetType === "WEIGHT") {
    const relevant = goal.targetReps ? completed.filter((s) => s.reps >= goal.targetReps!) : completed;
    if (relevant.length === 0) return null;
    return Math.max(...relevant.map((s) => s.weight));
  }
  return completed.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function computeGoalProgress(goal: Goal, sessions: WorkoutSession[]): GoalProgress {
  const finished = sessions
    .filter((s) => s.finishedAt && s.date >= goal.startDate)
    .slice()
    .sort((a, b) => a.finishedAt! - b.finishedAt!);

  let currentValue = goal.startValue;
  let achievedDate: string | null = null;
  const timeline: { date: string; value: number }[] = [{ date: goal.startDate, value: goal.startValue }];

  for (const s of finished) {
    const v = bestValueForSession(s, goal);
    if (v === null || v <= currentValue) continue;
    currentValue = v;
    timeline.push({ date: s.date, value: currentValue });
    if (!achievedDate && currentValue >= goal.targetValue) achievedDate = s.date;
  }

  const span = goal.targetValue - goal.startValue;
  const progressPct = span <= 0 ? 100 : Math.max(0, Math.min(100, ((currentValue - goal.startValue) / span) * 100));

  let status: GoalStatus = "ACTIVE";
  if (achievedDate) status = "ACHIEVED";
  else if (goal.deadline && goal.deadline < todayStr()) status = "FAILED";

  let forecastDate: string | null = null;
  let aheadOfSchedule: boolean | null = null;
  if (status === "ACTIVE" && timeline.length >= 2) {
    const first = timeline[0];
    const last = timeline[timeline.length - 1];
    const daysElapsed = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000;
    const valueGain = last.value - first.value;
    if (daysElapsed > 0 && valueGain > 0) {
      const ratePerDay = valueGain / daysElapsed;
      const remaining = goal.targetValue - last.value;
      const daysNeeded = remaining / ratePerDay;
      const forecast = new Date(`${last.date}T00:00:00`);
      forecast.setDate(forecast.getDate() + Math.ceil(daysNeeded));
      forecastDate = `${forecast.getFullYear()}-${String(forecast.getMonth() + 1).padStart(2, "0")}-${String(
        forecast.getDate()
      ).padStart(2, "0")}`;
      if (goal.deadline) aheadOfSchedule = forecastDate <= goal.deadline;
    }
  }

  return { goal, currentValue, progressPct, status, achievedDate, forecastDate, aheadOfSchedule };
}

export function currentBestValue(
  sessions: WorkoutSession[],
  exerciseId: string,
  targetType: Goal["targetType"],
  targetReps: number | null
): number {
  const probe: Goal = {
    id: "",
    exerciseId,
    exerciseName: "",
    targetType,
    targetValue: Infinity,
    targetReps,
    startValue: 0,
    startDate: "0000-01-01",
    deadline: null,
    archived: false,
    createdAt: 0,
  };
  let best = 0;
  for (const s of sessions.filter((s) => s.finishedAt)) {
    const v = bestValueForSession(s, probe);
    if (v !== null && v > best) best = v;
  }
  return best;
}

export function suggestNextTarget(progress: GoalProgress): number {
  const { goal } = progress;
  if (goal.targetType === "WEIGHT") {
    const bump = Math.max(2.5, Math.round((goal.targetValue * 0.075) / 2.5) * 2.5);
    return goal.targetValue + bump;
  }
  return Math.round(goal.targetValue * 1.1);
}
