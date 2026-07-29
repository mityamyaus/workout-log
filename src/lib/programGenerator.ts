import { EXERCISES, type Equipment, type MuscleGroup } from "./exercises";
import { PROGRAM_COLORS } from "./colors";
import type { ProgramExercise } from "./types";

export type Goal = "LOSS" | "MASS" | "STRENGTH" | "MAINTAIN";
export type Location = "GYM" | "HOME_EQUIPMENT" | "HOME_BODYWEIGHT";

export const GOAL_LABELS: Record<Goal, string> = {
  LOSS: "Похудение",
  MASS: "Набор массы",
  STRENGTH: "Сила",
  MAINTAIN: "Поддержание формы",
};

export const LOCATION_LABELS: Record<Location, string> = {
  GYM: "Тренажёрный зал",
  HOME_EQUIPMENT: "Дома (гантели, резина, турник)",
  HOME_BODYWEIGHT: "Дома без инвентаря",
};

const EQUIPMENT_BY_LOCATION: Record<Location, Equipment[]> = {
  GYM: [
    "BARBELL", "DUMBBELL", "EZ_BAR", "SMITH_MACHINE", "MACHINE", "CABLE",
    "KETTLEBELL", "BAND", "TRX", "SANDBAG", "BODYWEIGHT", "ASSISTED_BODYWEIGHT",
    "TIME", "CARDIO",
  ],
  HOME_EQUIPMENT: ["DUMBBELL", "BAND", "KETTLEBELL", "TRX", "BODYWEIGHT", "TIME"],
  HOME_BODYWEIGHT: ["BODYWEIGHT", "TIME"],
};

interface Scheme {
  sets: number;
  reps: number;
  exercisesPerDay: number;
}

const SCHEME: Record<Goal, Scheme> = {
  LOSS: { sets: 3, reps: 15, exercisesPerDay: 7 },
  MASS: { sets: 4, reps: 10, exercisesPerDay: 6 },
  STRENGTH: { sets: 5, reps: 5, exercisesPerDay: 5 },
  MAINTAIN: { sets: 3, reps: 12, exercisesPerDay: 6 },
};

interface DayTemplate {
  label: string;
  muscles: MuscleGroup[];
}

const SPLITS: Record<number, DayTemplate[]> = {
  1: [
    { label: "Всё тело", muscles: [
      "CHEST", "UPPER_BACK", "QUADS", "HAMSTRINGS", "FRONT_DELTS", "SIDE_DELTS",
      "BICEPS", "TRICEPS", "GLUTES", "ABS",
    ] },
  ],
  2: [
    { label: "Верх тела", muscles: [
      "CHEST", "UPPER_BACK", "FRONT_DELTS", "SIDE_DELTS", "REAR_DELTS", "BICEPS", "TRICEPS", "TRAPS",
    ] },
    { label: "Низ тела", muscles: [
      "QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "HIP_ABDUCTORS", "HIP_ADDUCTORS", "LOWER_BACK", "ABS",
    ] },
  ],
  3: [
    { label: "Жимовая: грудь, плечи, трицепс", muscles: ["CHEST", "FRONT_DELTS", "SIDE_DELTS", "TRICEPS", "ABS"] },
    { label: "Тяговая: спина, бицепс", muscles: ["UPPER_BACK", "LOWER_BACK", "REAR_DELTS", "TRAPS", "BICEPS", "FOREARMS"] },
    { label: "Ноги", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "HIP_ABDUCTORS", "HIP_ADDUCTORS"] },
  ],
  4: [
    { label: "Верх тела A", muscles: ["CHEST", "UPPER_BACK", "FRONT_DELTS", "TRICEPS", "BICEPS"] },
    { label: "Низ тела A", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "ABS"] },
    { label: "Верх тела B", muscles: ["CHEST", "UPPER_BACK", "SIDE_DELTS", "REAR_DELTS", "TRAPS", "FOREARMS"] },
    { label: "Низ тела B", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "HIP_ABDUCTORS", "HIP_ADDUCTORS", "ABS"] },
  ],
  5: [
    { label: "Грудь", muscles: ["CHEST", "TRICEPS", "ABS"] },
    { label: "Спина", muscles: ["UPPER_BACK", "LOWER_BACK", "TRAPS", "BICEPS"] },
    { label: "Ноги", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "HIP_ABDUCTORS", "HIP_ADDUCTORS"] },
    { label: "Плечи", muscles: ["FRONT_DELTS", "SIDE_DELTS", "REAR_DELTS", "TRAPS", "ABS"] },
    { label: "Руки", muscles: ["BICEPS", "TRICEPS", "FOREARMS", "ABS"] },
  ],
  6: [
    { label: "Push A: грудь, плечи, трицепс", muscles: ["CHEST", "FRONT_DELTS", "SIDE_DELTS", "TRICEPS"] },
    { label: "Pull A: спина, бицепс", muscles: ["UPPER_BACK", "REAR_DELTS", "TRAPS", "BICEPS"] },
    { label: "Ноги A", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "ABS"] },
    { label: "Push B: грудь, плечи, трицепс", muscles: ["CHEST", "FRONT_DELTS", "SIDE_DELTS", "TRICEPS"] },
    { label: "Pull B: спина, бицепс", muscles: ["UPPER_BACK", "LOWER_BACK", "TRAPS", "BICEPS", "FOREARMS"] },
    { label: "Ноги B", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "HIP_ABDUCTORS", "HIP_ADDUCTORS", "ABS"] },
  ],
};

function pickExercisesForDay(muscles: MuscleGroup[], equipment: Equipment[], count: number) {
  const pool = EXERCISES.filter((e) => equipment.includes(e.equipment));
  const chosen: typeof EXERCISES = [];
  const usedIds = new Set<string>();

  let safety = 0;
  while (chosen.length < count && safety < 8) {
    let addedThisRound = false;
    for (const m of muscles) {
      if (chosen.length >= count) break;
      const candidates = pool.filter((e) => e.category === m && !usedIds.has(e.id));
      if (candidates.length === 0) continue;
      const ex = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push(ex);
      usedIds.add(ex.id);
      addedThisRound = true;
    }
    safety++;
    if (!addedThisRound) break;
  }
  return chosen;
}

export interface GeneratedProgram {
  name: string;
  color: string;
  exercises: ProgramExercise[];
}

export function generatePrograms(goal: Goal, location: Location, days: number): GeneratedProgram[] {
  const templates = SPLITS[days] ?? SPLITS[3];
  const equipment = EQUIPMENT_BY_LOCATION[location];
  const scheme = SCHEME[goal];

  return templates.map((day, i) => {
    const picked = pickExercisesForDay(day.muscles, equipment, scheme.exercisesPerDay);
    const exercises: ProgramExercise[] = picked.map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      category: ex.category,
      sets: scheme.sets,
      reps: scheme.reps,
    }));
    const name = templates.length > 1 ? `${i + 1}. ${day.label}` : day.label;
    return { name, color: PROGRAM_COLORS[i % PROGRAM_COLORS.length], exercises };
  });
}
