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
  programId: string | null;
  color: string;
}

export interface DraftExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: SetLog[];
}

export interface ProgramExercise {
  exerciseId: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
}

export interface Program {
  id: string;
  name: string;
  color: string;
  exercises: ProgramExercise[];
  createdAt: number;
}

export interface PlannedWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  programId: string | null;
  title: string;
  color: string;
}
