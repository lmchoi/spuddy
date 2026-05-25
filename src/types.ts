export type WorkingSet = {
  reps: number;
  repsLeft?: number; // unilateral left side
  weight: number;    // kg, 0 = bodyweight
  isWarmup: boolean;
  isBodyweight: boolean;
  rpe?: number;
  distanceMeters?: number;
  durationSeconds?: number;
};

export type Target = {
  reps: number;
  minReps?: number;    // lower bound of a rep range
  weight?: number;     // kg, undefined = no weight specified
  restSeconds?: number;
};

export type ExerciseEntry = {
  name: string;
  sets: WorkingSet[];
  targets: Target[];
};

export type Session = {
  date: string; // YYYY-MM-DD
  exercises: ExerciseEntry[];
};

export type ProgramExercise = {
  name: string;
  targets: Target[];
};

export type ProgramDay = {
  name: string;
  exercises: ProgramExercise[];
};

export type Program = {
  name: string;
  days: ProgramDay[];
  activeDayIndex: number;
};
