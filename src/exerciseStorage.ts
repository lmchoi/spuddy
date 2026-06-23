import { asc, eq, inArray } from 'drizzle-orm';
import { exercises } from './db/schema';
import type { DrizzleDB } from './storage';

export type ExerciseLibraryRow = {
  name: string;
  libraryId: string | null;
  muscleGroups: string | null;
  equipment: string | null;
  libraryConfidence: number | null;
};

export function getAllExerciseNames(db: DrizzleDB): string[] {
  return db.select({ name: exercises.name }).from(exercises).orderBy(asc(exercises.name)).all().map(r => r.name);
}

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

export function setExerciseLibraryLink(
  db: DrizzleDB,
  exerciseName: string,
  libraryId: string,
  muscleGroups: string,
  equipment: string,
): void {
  db.update(exercises)
    .set({ libraryId, muscleGroups, equipment, libraryConfidence: 100 })
    .where(eq(exercises.name, exerciseName))
    .run();
}
