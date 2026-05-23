import type { DB } from './storage';
import type { Program, ProgramDay, ProgramExercise, Target } from './types';

export async function savePrograms(db: DB, programs: Program[]): Promise<void> {
  await db.run('BEGIN');
  try {
    await db.run('DELETE FROM program_exercises');
    await db.run('DELETE FROM program_days');
    await db.run('DELETE FROM programs');

    for (const program of programs) {
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

    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

type ProgramRow = { id: number; name: string; active_day_index: number };
type DayRow = { id: number; program_id: number; day_index: number; name: string };
type ExerciseRow = { name: string; exercise_index: number; targets_json: string };

export async function getPrograms(db: DB): Promise<Program[]> {
  const programRows = await db.all<ProgramRow>(
    'SELECT id, name, active_day_index FROM programs ORDER BY id ASC'
  );

  return Promise.all(
    programRows.map(async programRow => {
      const dayRows = await db.all<DayRow>(
        'SELECT id, program_id, day_index, name FROM program_days WHERE program_id = ? ORDER BY day_index ASC',
        [programRow.id]
      );

      const days: ProgramDay[] = await Promise.all(
        dayRows.map(async dayRow => {
          const exercises = await loadExercises(db, dayRow.id);
          return { name: dayRow.name, exercises };
        })
      );

      return { name: programRow.name, days, activeDayIndex: programRow.active_day_index };
    })
  );
}

export async function getProgramDay(
  db: DB,
  programName: string,
  dayIndex: number
): Promise<ProgramDay | null> {
  const dayRows = await db.all<DayRow>(
    `SELECT pd.id, pd.program_id, pd.day_index, pd.name
     FROM program_days pd
     JOIN programs p ON pd.program_id = p.id
     WHERE p.name = ? AND pd.day_index = ?`,
    [programName, dayIndex]
  );
  if (dayRows.length === 0) return null;

  const exercises = await loadExercises(db, dayRows[0].id);
  return { name: dayRows[0].name, exercises };
}

export async function updateActiveDayIndex(
  db: DB,
  programName: string,
  dayIndex: number
): Promise<void> {
  await db.run(
    'UPDATE programs SET active_day_index = ? WHERE name = ?',
    [dayIndex, programName]
  );
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
