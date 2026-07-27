import type { WorkoutSession } from "./types";

export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function sessionVolume(s: WorkoutSession): number {
  let v = 0;
  for (const ex of s.exercises) {
    for (const set of ex.sets) {
      if (set.completed) v += set.weight * set.reps;
    }
  }
  return v;
}

export function dateOfWeekday(offsetFromMonday: number, ref = new Date()) {
  const day = (ref.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - day);
  const d = new Date(monday);
  d.setDate(monday.getDate() + offsetFromMonday);
  return todayStr(d);
}

export function currentWeekDates(): string[] {
  return Array.from({ length: 7 }, (_, i) => dateOfWeekday(i));
}

export function computeStreak(sessions: WorkoutSession[]): number {
  const daysWithSession = new Set(sessions.map((s) => s.date));
  let streak = 0;
  const cursor = new Date();
  // if no session today yet, streak can still count from yesterday
  if (!daysWithSession.has(todayStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daysWithSession.has(todayStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function sessionsThisWeek(sessions: WorkoutSession[]): number {
  const week = new Set(currentWeekDates());
  const days = new Set(sessions.filter((s) => week.has(s.date)).map((s) => s.date));
  return days.size;
}

export function totalVolumeThisWeek(sessions: WorkoutSession[]): number {
  const week = new Set(currentWeekDates());
  return sessions.filter((s) => week.has(s.date)).reduce((sum, s) => sum + sessionVolume(s), 0);
}

export function formatVolume(v: number): { value: string; unit: string } {
  if (v >= 1000) return { value: (v / 1000).toFixed(1), unit: "т" };
  return { value: v.toFixed(0), unit: "кг" };
}

export function weeklyVolumeSeries(sessions: WorkoutSession[], weeks = 8) {
  const result: { label: string; volume: number }[] = [];
  const now = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const ref = new Date(now);
    ref.setDate(now.getDate() - w * 7);
    const dates = new Set(
      Array.from({ length: 7 }, (_, i) => {
        const day = (ref.getDay() + 6) % 7;
        const monday = new Date(ref);
        monday.setDate(ref.getDate() - day);
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return todayStr(d);
      })
    );
    const volume = sessions.filter((s) => dates.has(s.date)).reduce((sum, s) => sum + sessionVolume(s), 0);
    const day0 = new Date(ref);
    const dow = (ref.getDay() + 6) % 7;
    day0.setDate(ref.getDate() - dow);
    result.push({ label: `${day0.getDate()}.${day0.getMonth() + 1}`, volume });
  }
  return result;
}

export function muscleGroupTotals(sessions: WorkoutSession[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const sets = ex.sets.filter((st) => st.completed).length;
      totals[ex.category] = (totals[ex.category] || 0) + sets;
    }
  }
  return totals;
}
