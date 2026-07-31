import type { WorkoutSession } from "./types";

export type AchievementIcon = "flame" | "barbell" | "trophy" | "target";

export interface Achievement {
  key: string;
  title: string;
  icon: AchievementIcon;
  unlockedAt: string | null;
  progressLabel?: string;
}

function sessionVolume(session: WorkoutSession): number {
  let sum = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (set.completed) sum += set.weight * set.reps;
    }
  }
  return sum;
}

function computeLongestStreak(dates: string[]): { length: number; endDate: string } {
  let best = 0;
  let bestEnd = "";
  let current = 0;
  let prev: Date | null = null;

  for (const d of dates) {
    const dt = new Date(`${d}T00:00:00`);
    if (prev) {
      const diffDays = Math.round((dt.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 0) continue;
      current = diffDays === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    if (current > best) {
      best = current;
      bestEnd = d;
    }
    prev = dt;
  }
  return { length: best, endDate: bestEnd };
}

const SESSION_THRESHOLDS = [1, 10, 50, 100, 250];
const VOLUME_THRESHOLDS_T = [10, 50, 200];
const STREAK_THRESHOLDS = [7, 30, 60];

export function computeAchievements(sessions: WorkoutSession[]): Achievement[] {
  const finished = sessions
    .filter((s) => s.finishedAt)
    .slice()
    .sort((a, b) => a.finishedAt! - b.finishedAt!);

  const countDate: Record<number, string> = {};
  const volumeCrossDate: Record<number, string> = {};
  let cumVolumeT = 0;

  finished.forEach((s, i) => {
    const n = i + 1;
    if (SESSION_THRESHOLDS.includes(n)) countDate[n] = s.date;
    cumVolumeT += sessionVolume(s) / 1000;
    for (const t of VOLUME_THRESHOLDS_T) {
      if (!volumeCrossDate[t] && cumVolumeT >= t) volumeCrossDate[t] = s.date;
    }
  });

  const uniqueDates = Array.from(new Set(finished.map((s) => s.date))).sort();
  const streak = computeLongestStreak(uniqueDates);

  const maxByExercise: Record<string, number> = {};
  let firstPrDate: string | null = null;
  for (const s of finished) {
    for (const ex of s.exercises) {
      const setMax = Math.max(0, ...ex.sets.filter((x) => x.completed).map((x) => x.weight));
      if (setMax <= 0) continue;
      const prevMax = maxByExercise[ex.name];
      if (prevMax === undefined) {
        maxByExercise[ex.name] = setMax;
      } else if (setMax > prevMax) {
        maxByExercise[ex.name] = setMax;
        if (!firstPrDate) firstPrDate = s.date;
      }
    }
  }

  const list: Achievement[] = [];
  for (const n of SESSION_THRESHOLDS) {
    list.push({
      key: `sessions_${n}`,
      title: `${n} ${n === 1 ? "тренировка" : "тренировок"}`,
      icon: "barbell",
      unlockedAt: countDate[n] ?? null,
      progressLabel: countDate[n] ? undefined : `${finished.length} / ${n}`,
    });
  }
  for (const t of VOLUME_THRESHOLDS_T) {
    list.push({
      key: `volume_${t}`,
      title: `Объём ${t} т`,
      icon: "trophy",
      unlockedAt: volumeCrossDate[t] ?? null,
      progressLabel: volumeCrossDate[t] ? undefined : `${cumVolumeT.toFixed(1)} / ${t} т`,
    });
  }
  for (const d of STREAK_THRESHOLDS) {
    list.push({
      key: `streak_${d}`,
      title: `Серия ${d} дней`,
      icon: "flame",
      unlockedAt: streak.length >= d ? streak.endDate : null,
      progressLabel: streak.length >= d ? undefined : `${streak.length} / ${d} дней`,
    });
  }
  list.push({ key: "first_pr", title: "Первый личный рекорд", icon: "target", unlockedAt: firstPrDate });

  return list;
}

export interface RecentPR {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export function findRecentPR(sessions: WorkoutSession[]): RecentPR | null {
  const finished = sessions
    .filter((s) => s.finishedAt)
    .slice()
    .sort((a, b) => a.finishedAt! - b.finishedAt!);
  if (finished.length === 0) return null;

  const latest = finished[finished.length - 1];
  const priorMax: Record<string, number> = {};
  for (const s of finished.slice(0, -1)) {
    for (const ex of s.exercises) {
      const setMax = Math.max(0, ...ex.sets.filter((x) => x.completed).map((x) => x.weight));
      if (setMax > 0) priorMax[ex.name] = Math.max(priorMax[ex.name] ?? 0, setMax);
    }
  }

  for (const ex of latest.exercises) {
    const completedSets = ex.sets.filter((s) => s.completed && s.weight > 0);
    if (completedSets.length === 0) continue;
    const best = completedSets.reduce((a, b) => (b.weight > a.weight ? b : a));
    const prev = priorMax[ex.name] ?? 0;
    if (best.weight > prev) {
      return { exerciseName: ex.name, weight: best.weight, reps: best.reps, date: latest.date };
    }
  }
  return null;
}
