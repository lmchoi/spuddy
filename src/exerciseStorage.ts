import { eq, inArray } from 'drizzle-orm';
import { exercises } from './db/schema';
import type { DrizzleDB } from './storage';

export type ExerciseLibraryRow = {
  name: string;
  libraryId: string | null;
  muscleGroups: string | null;
  equipment: string | null;
  libraryConfidence: number | null;
};

export function getExercisesLibraryData(db: DrizzleDB, names: string[]): ExerciseLibraryRow[] {
  if (names.length === 0) return [];
  return db.select({
    name: exercises.name,
    libraryId: exercises.libraryId,
    muscleGroups: exercises.muscleGroups,
    equipment: exercises.equipment,
    libraryConfidence: exercises.libraryConfidence,
  }).from(exercises).where(inArray(exercises.name, names)).all();
}

export function getExerciseNote(db: DrizzleDB, exerciseId: number): string | null {
  const row = db.select({ notes: exercises.notes }).from(exercises)
    .where(eq(exercises.id, exerciseId))
    .get();
  return row?.notes ?? null;
}

export function setExerciseNote(db: DrizzleDB, exerciseId: number, note: string | null): void {
  db.update(exercises).set({ notes: note }).where(eq(exercises.id, exerciseId)).run();
}
