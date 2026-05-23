export type WorkingSet = {
  reps: number;
  repsLeft?: number; // unilateral left side
  weight: number;    // kg, 0 = bodyweight
  isWarmup: boolean;
  isBodyweight: boolean;
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
