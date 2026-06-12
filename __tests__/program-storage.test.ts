import BetterSqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { type DrizzleDB } from '../src/storage';
import { savePrograms, getPrograms, getProgramDay, updateActiveDayIndex, updateProgramDay, addProgramDay } from '../src/programStorage';
import type { Program } from '../src/types';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';
import * as schema from '../src/db/schema';

// Simulates expo-sqlite's SQLiteRunResult shape: property is lastInsertRowId (capital I),
// not lastInsertRowid (lowercase) as returned by better-sqlite3.
// savePrograms reads .lastInsertRowid — undefined on expo → Number(undefined) = NaN → NULL in SQLite.
function makeExpoStyleDB(): DrizzleDB {
  const sqlite = new BetterSqlite(':memory:') as any;
  const realPrepare = sqlite.prepare.bind(sqlite);
  sqlite.prepare = (sql: string) => {
    const stmt = realPrepare(sql);
    const realRun = stmt.run.bind(stmt);
    stmt.run = (...args: unknown[]) => {
      const result = realRun(...args) as { lastInsertRowid: bigint; changes: number };
      const { lastInsertRowid, ...rest } = result;
      return { ...rest, lastInsertRowId: lastInsertRowid }; // expo-sqlite shape, no lastInsertRowid
    };
    return stmt;
  };
  const db = drizzle(sqlite, { schema }) as DrizzleDB;
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

const PROGRAM_A: Program = {
  id: 1,
  createdAt: Date.now(),
  name: 'v1',
  activeDayIndex: 2,
  days: [
    {
      name: 'Day 1',
      exercises: [
        { name: 'Squat', targets: [{ reps: 5, weight: 100 }] },
        { name: 'Deadlift', targets: [] },
      ],
    },
    {
      name: 'Day 2',
      exercises: [
        { name: 'Bench Press', targets: [{ reps: 8, minReps: 6, weight: 60 }] },
      ],
    },
  ],
};

const PROGRAM_B: Program = {
  id: 2,
  createdAt: Date.now(),
  name: 'v2',
  activeDayIndex: 0,
  days: [{ name: 'Full Body', exercises: [{ name: 'Squat', targets: [] }] }],
};

describe('program schema', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('creates programs, program_days, and program_exercises tables', async () => {
    const tables = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = tables.map(t => t.name);
    expect(names).toContain('programs');
    expect(names).toContain('program_days');
    expect(names).toContain('program_exercises');
  });

  it('saves and retrieves programs', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].id!).toBeDefined();
    expect(programs[0].name).toBe('v1');
    expect(programs[0].activeDayIndex).toBe(2);
    expect(programs[0].days).toHaveLength(2);
  });

  it('sets createdAt to a timestamp in milliseconds', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programRows = db.select().from(schema.programs).all();
    expect(programRows).toHaveLength(1);
    const createdAt = programRows[0].createdAt;
    expect(createdAt).toBeInstanceOf(Date);
    const msSinceEpoch = createdAt.getTime();
    // It should be recently, within the last hour
    expect(msSinceEpoch).toBeGreaterThan(Date.now() - 3600000);
    expect(msSinceEpoch).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('retrieves program days with exercises', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const day1 = programs[0].days[0];
    expect(day1.name).toBe('Day 1');
    expect(day1.exercises).toHaveLength(2);
    expect(day1.exercises[0].name).toBe('Squat');
    expect(day1.exercises[1].name).toBe('Deadlift');
  });

  it('preserves exercise targets through round-trip', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const squat = programs[0].days[0].exercises[0];
    expect(squat.targets).toHaveLength(1);
    expect(squat.targets[0]).toMatchObject({ reps: 5, weight: 100 });
  });

  it('replaces all programs on save', async () => {
    await savePrograms(db, [PROGRAM_A]);
    await savePrograms(db, [PROGRAM_B]);
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].name).toBe('v2');
  });

  it('saves and retrieves multiple programs', async () => {
    await savePrograms(db, [PROGRAM_A, PROGRAM_B]);
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(2);
  });

  it('getProgramDay returns specific day', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const day = await getProgramDay(db, programs[0].id!, 1);
    expect(day).not.toBeNull();
    expect(day?.name).toBe('Day 2');
    expect(day?.exercises[0].name).toBe('Bench Press');
  });

  it('getProgramDay returns null for missing program', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const day = await getProgramDay(db, 999, 0);
    expect(day).toBeNull();
  });

  it('getProgramDay returns null for out-of-range day', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const day = await getProgramDay(db, programs[0].id!, 99);
    expect(day).toBeNull();
  });

  it('getProgramDay looks up by day_index column, not array position', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const programId = programs[0].id!;
    // Shift Day 2's stored day_index from 1 to 5, creating a gap at positions 1–4.
    db.run(`UPDATE program_days SET day_index = 5 WHERE day_index = 1 AND program_id = ${programId}`);

    const day = await getProgramDay(db, programId, 5);
    expect(day?.name).toBe('Day 2');
    const missing = await getProgramDay(db, programId, 1);
    expect(missing).toBeNull();
  });

  it('updateActiveDayIndex updates the index', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programsBefore = await getPrograms(db);
    await updateActiveDayIndex(db, programsBefore[0].id!, 0);
    const programsAfter = await getPrograms(db);
    expect(programsAfter[0].activeDayIndex).toBe(0);
  });

  it('updateActiveDayIndex does not affect other programs', async () => {
    await savePrograms(db, [PROGRAM_A, PROGRAM_B]);
    const programsBefore = await getPrograms(db);
    const p1 = programsBefore.find(p => p.name === 'v1')!;
    const p2 = programsBefore.find(p => p.name === 'v2')!;
    
    await updateActiveDayIndex(db, p1.id!, 0);
    const programsAfter = await getPrograms(db);
    const b = programsAfter.find(p => p.id === p2.id)!;
    expect(b.activeDayIndex).toBe(0); // PROGRAM_B's initial activeDayIndex was 0
  });

  it('preserves exercise ordering by exercise_index', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const exercises = programs[0].days[0].exercises;
    expect(exercises[0].name).toBe('Squat');
    expect(exercises[1].name).toBe('Deadlift');
  });

  it('rejects if an error occurs during savePrograms transaction', async () => {
    const badProgram: Program = {
      name: null as unknown as string, // Invalid
      activeDayIndex: 0,
      days: []
    };
    
    expect(() => savePrograms(db, [badProgram])).toThrow();
  });
});

describe('updateProgramDay', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('replaces the specified day', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const newDay = { name: 'New Day 1', exercises: [{ name: 'Press', targets: [] }] };
    await updateProgramDay(db, programs[0].id!, 0, newDay);
    const updatedPrograms = await getPrograms(db);
    expect(updatedPrograms[0].days[0].name).toBe('New Day 1');
    expect(updatedPrograms[0].days[0].exercises[0].name).toBe('Press');
  });

  it('does not affect other days', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const newDay = { name: 'New Day 1', exercises: [] };
    await updateProgramDay(db, programs[0].id!, 0, newDay);
    const updatedPrograms = await getPrograms(db);
    expect(updatedPrograms[0].days[1].name).toBe('Day 2');
  });

  it('throws if program not found', async () => {
    await expect(updateProgramDay(db, 999, 0, { name: 'x', exercises: [] }))
      .rejects.toThrow('Day 0 not found for program 999');
  });
});

describe('addProgramDay', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('appends a new day to the correct program', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const newDay = { name: 'Day 3', exercises: [{ name: 'Pull-up', targets: [{ reps: 8, weight: 0 }] }] };
    await addProgramDay(db, programs[0].id!, newDay);
    const updatedPrograms = await getPrograms(db);
    expect(updatedPrograms[0].days).toHaveLength(3);
    expect(updatedPrograms[0].days[2].name).toBe('Day 3');
    expect(updatedPrograms[0].days[2].exercises[0].name).toBe('Pull-up');
  });

  it('does not affect other programs', async () => {
    await savePrograms(db, [PROGRAM_A, PROGRAM_B]);
    const programs = await getPrograms(db);
    const p1 = programs.find(p => p.name === 'v1')!;
    const p2 = programs.find(p => p.name === 'v2')!;
    const newDay = { name: 'Extra', exercises: [] };
    await addProgramDay(db, p1.id!, newDay);
    const updatedPrograms = await getPrograms(db);
    const b = updatedPrograms.find(p => p.id === p2.id)!;
    expect(b.days).toHaveLength(1);
  });

  it('does not affect existing days in the target program', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const newDay = { name: 'Extra', exercises: [] };
    await addProgramDay(db, programs[0].id!, newDay);
    const day0 = await getProgramDay(db, programs[0].id!, 0);
    expect(day0!.name).toBe('Day 1');
    const day1 = await getProgramDay(db, programs[0].id!, 1);
    expect(day1!.name).toBe('Day 2');
  });
});

// Regression: on expo-sqlite, insert().run() returns lastInsertRowId (capital I), not
// lastInsertRowid. savePrograms used .lastInsertRowid which is undefined on expo, making
// Number(undefined) = NaN the value bound for program_id → NOT NULL constraint failure.
describe('savePrograms — expo-sqlite driver compatibility', () => {
  it('saves programs and days correctly when driver uses lastInsertRowId (expo-sqlite shape)', async () => {
    const db = makeExpoStyleDB();
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].name).toBe('v1');
    expect(programs[0].days).toHaveLength(2);
    expect(programs[0].days[0].name).toBe('Day 1');
    expect(programs[0].days[1].name).toBe('Day 2');
  });
});
