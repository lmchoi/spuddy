import { eq } from 'drizzle-orm';
import { exercises } from './db/schema';
import type { DrizzleDB } from './storage';

export function getExerciseNote(db: DrizzleDB, exerciseId: number): string | null {
  const row = db.select({ notes: exercises.notes }).from(exercises)
    .where(eq(exercises.id, exerciseId))
    .get();
  return row?.notes ?? null;
}

export function setExerciseNote(db: DrizzleDB, exerciseId: number, note: string | null): void {
  db.update(exercises).set({ notes: note }).where(eq(exercises.id, exerciseId)).run();
}
