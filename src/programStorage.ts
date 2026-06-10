import { and, asc, eq, sql } from 'drizzle-orm';
import { programDays, programExercises, programs } from './db/schema';
import { resolveOrCreateExercise, type DrizzleDB } from './storage';
import type { Program, ProgramDay, ProgramExercise, Target } from './types';

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

export async function savePrograms(db: DrizzleDB, programs_: Program[]): Promise<void> {
  db.transaction((tx) => {
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

    return { name: programRow.name, days, activeDayIndex: programRow.activeDayIndex };
  });
}

export async function getProgramDay(
  db: DrizzleDB,
  programName: string,
  dayIndex: number
): Promise<ProgramDay | null> {
  const programRows = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.name, programName));
  if (programRows.length === 0) return null;

  const dayRows = await db
    .select({ id: programDays.id, name: programDays.name })
    .from(programDays)
    .where(and(eq(programDays.programId, programRows[0].id), eq(programDays.dayIndex, dayIndex)));
  if (dayRows.length === 0) return null;
  const dayRow = dayRows[0];

  return { name: dayRow.name, exercises: loadExercises(db, dayRow.id) };
}

export async function updateProgramDay(
  db: DrizzleDB,
  programName: string,
  dayIndex: number,
  day: ProgramDay
): Promise<void> {
  const programList = await getPrograms(db);
  const target = programList.find((p) => p.name === programName);
  if (!target) throw new Error(`Program not found: ${programName}`);
  target.days[dayIndex] = day;
  await savePrograms(db, programList);
}

export function updateActiveDayIndex(db: DrizzleDB, programName: string, dayIndex: number): void {
  db.update(programs).set({ activeDayIndex: dayIndex }).where(eq(programs.name, programName)).run();
}

export async function getProgramTotalDays(db: DrizzleDB, programName: string): Promise<number> {
  const programRows = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.name, programName));
  if (programRows.length === 0) return 0;
  const rows = db.all<{ n: number }>(
    sql`SELECT COUNT(*) AS n FROM program_days WHERE program_id = ${programRows[0].id}`
  );
  return rows[0]?.n ?? 0;
}

export async function addProgramDay(
  db: DrizzleDB,
  programName: string,
  day: ProgramDay
): Promise<void> {
  const programList = await getPrograms(db);
  const target = programList.find((p) => p.name === programName);
  if (!target) throw new Error(`Program not found: ${programName}`);
  target.days.push(day);
  await savePrograms(db, programList);
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
