export interface SetLog {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  category: string;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  startedAt: number;
  finishedAt: number | null;
  exercises: ExerciseLog[];
}

export interface DraftExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: SetLog[];
}
