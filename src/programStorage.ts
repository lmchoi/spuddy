import type { DB } from './storage';
import type { Program, ProgramDay, ProgramExercise, Target } from './types';

export async function saveProgram(db: DB, program: Program): Promise<void> {
  // Replace any existing program (one at a time)
  await db.run('DELETE FROM program_exercises');
  await db.run('DELETE FROM program_days');
  await db.run('DELETE FROM programs');

  await db.run(
    'INSERT INTO programs (name, active_day_index) VALUES (?, ?)',
    [program.name, program.activeDayIndex]
  );

  const programRows = await db.all<{ id: number }>('SELECT last_insert_rowid() AS id');
  const programId = programRows[0].id;

  for (let di = 0; di < program.days.length; di++) {
    const day = program.days[di];
    await db.run(
      'INSERT INTO program_days (program_id, day_index, name) VALUES (?, ?, ?)',
      [programId, di, day.name]
    );

    const dayRows = await db.all<{ id: number }>('SELECT last_insert_rowid() AS id');
    const dayId = dayRows[0].id;

    for (let ei = 0; ei < day.exercises.length; ei++) {
      const exercise = day.exercises[ei];
      await db.run(
        'INSERT INTO program_exercises (program_day_id, exercise_index, name, targets_json) VALUES (?, ?, ?, ?)',
        [dayId, ei, exercise.name, JSON.stringify(exercise.targets)]
      );
    }
  }
}

type ProgramRow = { name: string; active_day_index: number };
type DayRow = { id: number; day_index: number; name: string };
type ExerciseRow = { name: string; exercise_index: number; targets_json: string };

export async function getProgram(db: DB): Promise<Program | null> {
  const programs = await db.all<ProgramRow>(
    'SELECT name, active_day_index FROM programs LIMIT 1'
  );
  if (programs.length === 0) return null;

  const { name, active_day_index } = programs[0];

  const dayRows = await db.all<DayRow>(
    `SELECT pd.id, pd.day_index, pd.name
     FROM program_days pd
     JOIN programs p ON pd.program_id = p.id
     ORDER BY pd.day_index ASC`
  );

  const days: ProgramDay[] = await Promise.all(
    dayRows.map(async dayRow => {
      const exercises = await loadExercises(db, dayRow.id);
      return { name: dayRow.name, exercises };
    })
  );

  return { name, days, activeDayIndex: active_day_index };
}

export async function getProgramDay(db: DB, dayIndex: number): Promise<ProgramDay | null> {
  const dayRows = await db.all<DayRow>(
    `SELECT pd.id, pd.day_index, pd.name
     FROM program_days pd
     JOIN programs p ON pd.program_id = p.id
     WHERE pd.day_index = ?`,
    [dayIndex]
  );
  if (dayRows.length === 0) return null;

  const dayRow = dayRows[0];
  const exercises = await loadExercises(db, dayRow.id);
  return { name: dayRow.name, exercises };
}

async function loadExercises(db: DB, dayId: number): Promise<ProgramExercise[]> {
  const rows = await db.all<ExerciseRow>(
    'SELECT name, exercise_index, targets_json FROM program_exercises WHERE program_day_id = ? ORDER BY exercise_index ASC',
    [dayId]
  );
  return rows.map(row => ({
    name: row.name,
    targets: JSON.parse(row.targets_json) as Target[],
  }));
}
