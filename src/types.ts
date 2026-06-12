export type WorkingSet = {
  reps: number | null;
  repsLeft?: number; // unilateral left side
  weight: number;    // kg, 0 = bodyweight
  isWarmup: boolean;
  isBodyweight: boolean;
  rpe?: number;
  distanceMeters?: number;
  durationSeconds?: number;
};

export const DEFAULT_REST_SECONDS = 60;

export type Target = {
  reps: number;
  minReps?: number;    // lower bound of a rep range
  weight?: number;     // kg, undefined = no weight specified
  restSeconds?: number;
};

export type ExerciseEntry = {
  id?: string;
  exerciseId?: number;
  name: string;
  sets: WorkingSet[];
  targets: Target[];
};

export type Session = {
  date: string; // YYYY-MM-DD
  exercises: ExerciseEntry[];
  source?: string;
  sourceId?: string;
};

export type ProgramExercise = {
  exerciseId?: number;
  name: string;
  targets: Target[];
};

export type ProgramDay = {
  name: string;
  exercises: ProgramExercise[];
};

export type Program = {
  id?: number;
  name: string;
  days: ProgramDay[];
  activeDayIndex: number;
  createdAt?: number;
};

export type ImportedWorkoutGroup = {
  name: string;
  sessionCount: number;
  lastUsed: string; // YYYY-MM-DD
  sessions: Session[];
  equipmentHints: Record<string, string | null>;
};

export type ImportedHistory = {
  workoutGroups: ImportedWorkoutGroup[];
};
