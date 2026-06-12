import { and, asc, eq, sql } from 'drizzle-orm';
import { programDays, programExercises, programs } from './db/schema';
import { resolveOrCreateExercise, type DrizzleDB } from './storage';
import type { Program, ProgramDay, ProgramExercise, Target } from './types';

// Append new programs without touching existing ones. Used by import flows (Liftosaur, Strong, notes).
// This enables idempotent re-import: importing the same file twice won't duplicate programs or lose data.
export function insertPrograms(db: DrizzleDB, programs_: Program[]): void {
  for (const program of programs_) {
    const programRow = db
      .insert(programs)
      .values({ name: program.name, activeDayIndex: program.activeDayIndex })
      .returning({ insertedId: programs.id })
      .get()!;

    for (let di = 0; di < program.days.length; di++) {
      const day = program.days[di];
      const dayRow = db
        .insert(programDays)
        .values({ programId: programRow.insertedId, dayIndex: di, name: day.name })
        .returning({ insertedId: programDays.id })
        .get()!;

      for (let ei = 0; ei < day.exercises.length; ei++) {
        const exercise = day.exercises[ei];
        const exerciseId = resolveOrCreateExercise(db, exercise.name);
        db.insert(programExercises)
          .values({
            programDayId: dayRow.insertedId,
            exerciseIndex: ei,
            exerciseId,
            targetsJson: JSON.stringify(exercise.targets),
          })
          .run();
      }
    }
  }
}

// Wrap insertPrograms in a transaction. Used by all import flows (Liftosaur, Strong, notes).
export function importPrograms(db: DrizzleDB, newPrograms: Program[]): void {
  db.transaction((tx) => {
    insertPrograms(tx as DrizzleDB, newPrograms);
  });
}

// Replace all programs (full sync). Used only by internal operations that rebuild the entire program list (e.g., app UI).
// Safe for session history: deletes only the program structure (programs/programDays/programExercises tables).
// Sessions reference exercises directly by ID, not through program templates, so logged workouts are never affected.
// For imports, use importPrograms instead to preserve existing programs and enable idempotent re-import.
export async function savePrograms(db: DrizzleDB, programs_: Program[]): Promise<void> {
  return db.transaction((tx) => {
    const tdb = tx as DrizzleDB;
    tdb.delete(programExercises).run();
    tdb.delete(programDays).run();
    tdb.delete(programs).run();

    insertPrograms(tdb, programs_);
  });
}

export async function getPrograms(db: DrizzleDB): Promise<Program[]> {
  const programRows = await db.select().from(programs).orderBy(asc(programs.id));

  return programRows.map((programRow) => {
    const dayRows = db.all<{ id: number; name: string; day_index: number }>(sql`
      SELECT id, name, day_index FROM program_days
      WHERE program_id = ${programRow.id} ORDER BY day_index ASC
    `);

    const days: ProgramDay[] = dayRows.map((dayRow) => ({
      name: dayRow.name,
      exercises: loadExercises(db, dayRow.id),
    }));

    return {
      id: programRow.id,
      name: programRow.name,
      days,
      activeDayIndex: programRow.activeDayIndex,
      createdAt: programRow.createdAt.getTime(),
    };
  });
}

export async function getProgramDay(
  db: DrizzleDB,
  programId: number,
  dayIndex: number
): Promise<ProgramDay | null> {
  const dayRows = await db
    .select({ id: programDays.id, name: programDays.name })
    .from(programDays)
    .where(and(eq(programDays.programId, programId), eq(programDays.dayIndex, dayIndex)));
  if (dayRows.length === 0) return null;
  const dayRow = dayRows[0];

  return { name: dayRow.name, exercises: loadExercises(db, dayRow.id) };
}

export async function updateProgramDay(
  db: DrizzleDB,
  programId: number,
  dayIndex: number,
  day: ProgramDay
): Promise<void> {
  return db.transaction((tx) => {
    const tdb = tx as unknown as DrizzleDB;
    // 1. Find the day row
    const dayRows = tdb
      .select({ id: programDays.id })
      .from(programDays)
      .where(and(eq(programDays.programId, programId), eq(programDays.dayIndex, dayIndex)))
      .all();

    if (dayRows.length === 0) throw new Error(`Day ${dayIndex} not found for program ${programId}`);
    const dayRowId = dayRows[0].id;

    // 2. Update day name
    tdb.update(programDays).set({ name: day.name }).where(eq(programDays.id, dayRowId)).run();

    // 3. Delete existing exercises for this day
    tdb.delete(programExercises).where(eq(programExercises.programDayId, dayRowId)).run();

    // 4. Insert new exercises
    for (let ei = 0; ei < day.exercises.length; ei++) {
      const exercise = day.exercises[ei];
      const exerciseId = resolveOrCreateExercise(tdb, exercise.name);
      tdb
        .insert(programExercises)
        .values({
          programDayId: dayRowId,
          exerciseIndex: ei,
          exerciseId,
          targetsJson: JSON.stringify(exercise.targets),
        })
        .run();
    }
  });
}

export function updateActiveDayIndex(db: DrizzleDB, programId: number, dayIndex: number): void {
  db.update(programs).set({ activeDayIndex: dayIndex }).where(eq(programs.id, programId)).run();
}

export async function getProgramTotalDays(db: DrizzleDB, programId: number): Promise<number> {
  const rows = db.all<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM program_days WHERE program_id = ${programId}`
  );
  return rows[0]?.n ?? 0;
}

export async function addProgramDay(
  db: DrizzleDB,
  programId: number,
  day: ProgramDay
): Promise<void> {
  return db.transaction((tx) => {
    const tdb = tx as unknown as DrizzleDB;
    // 1. Find current max dayIndex
    const rows = tdb.all<{ n: number }>(
      sql`SELECT MAX(day_index) AS n FROM program_days WHERE program_id = ${programId}`
    );
    const nextIndex = (rows[0]?.n ?? -1) + 1;

    // 2. Insert new day
    const dayRow = tdb
      .insert(programDays)
      .values({ programId, dayIndex: nextIndex, name: day.name })
      .returning({ insertedId: programDays.id })
      .get()!;

    // 3. Insert exercises
    for (let ei = 0; ei < day.exercises.length; ei++) {
      const exercise = day.exercises[ei];
      const exerciseId = resolveOrCreateExercise(tdb, exercise.name);
      tdb
        .insert(programExercises)
        .values({
          programDayId: dayRow.insertedId,
          exerciseIndex: ei,
          exerciseId,
          targetsJson: JSON.stringify(exercise.targets),
        })
        .run();
    }
  });
}

function loadExercises(db: DrizzleDB, dayId: number): ProgramExercise[] {
  const rows = db.all<{ name: string; exercise_id: number; targets_json: string }>(sql`
    SELECT e.name, pe.exercise_id, pe.targets_json
    FROM program_exercises pe
    JOIN exercises e ON pe.exercise_id = e.id
    WHERE pe.program_day_id = ${dayId} ORDER BY pe.exercise_index ASC
  `);

  return rows.map((row) => ({
    exerciseId: row.exercise_id,
    name: row.name,
    targets: JSON.parse(row.targets_json) as Target[],
  }));
}
