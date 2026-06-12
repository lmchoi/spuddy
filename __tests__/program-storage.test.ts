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
    expect(programs[0].name).toBe('v1');
    expect(programs[0].activeDayIndex).toBe(2);
    expect(programs[0].days).toHaveLength(2);
  });

  it('getPrograms returns id on each program', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    expect(programs[0].id).toBeDefined();
    expect(typeof programs[0].id).toBe('number');
  });

  it('getPrograms returns createdAt as a recent millisecond timestamp', async () => {
    const before = Date.now();
    await savePrograms(db, [PROGRAM_A]);
    const after = Date.now();
    const programs = await getPrograms(db);
    expect(typeof programs[0].createdAt).toBe('number');
    // SQLite julianday conversion loses ~1ms of precision, so allow 1ms below before
    expect(programs[0].createdAt).toBeGreaterThanOrEqual(before - 1);
    expect(programs[0].createdAt).toBeLessThanOrEqual(after + 1);
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
    expect(b.activeDayIndex).toBe(0);
  });

  it('preserves exercise ordering by exercise_index', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const exercises = programs[0].days[0].exercises;
    expect(exercises[0].name).toBe('Squat');
    expect(exercises[1].name).toBe('Deadlift');
  });

  it('rolls back and leaves storage empty if a program fails to insert', () => {
    const badProgram = { name: null as unknown as string, activeDayIndex: 0, days: [] };
    expect(() => savePrograms(db, [badProgram])).toThrow();
    const stored = db.all<{ n: number }>('SELECT COUNT(*) AS n FROM programs');
    expect(stored[0].n).toBe(0);
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
    const updated = await getPrograms(db);
    expect(updated[0].days[0].name).toBe('New Day 1');
    expect(updated[0].days[0].exercises[0].name).toBe('Press');
  });

  it('does not affect other days', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const newDay = { name: 'New Day 1', exercises: [] };
    await updateProgramDay(db, programs[0].id!, 0, newDay);
    const updated = await getPrograms(db);
    expect(updated[0].days[1].name).toBe('Day 2');
  });

  it('throws if day not found', async () => {
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
    const updated = await getPrograms(db);
    expect(updated[0].days).toHaveLength(3);
    expect(updated[0].days[2].name).toBe('Day 3');
    expect(updated[0].days[2].exercises[0].name).toBe('Pull-up');
  });

  it('does not affect other programs', async () => {
    await savePrograms(db, [PROGRAM_A, PROGRAM_B]);
    const programs = await getPrograms(db);
    const a = programs.find(p => p.name === 'v1')!;
    const b = programs.find(p => p.name === 'v2')!;
    await addProgramDay(db, a.id!, { name: 'Extra', exercises: [] });
    const updated = await getPrograms(db);
    const bAfter = updated.find(p => p.id === b.id)!;
    expect(bAfter.days).toHaveLength(1);
  });

  it('does not affect existing days in the target program', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    await addProgramDay(db, programs[0].id!, { name: 'Extra', exercises: [] });
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
