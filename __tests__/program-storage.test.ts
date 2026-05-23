import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { saveProgram, getProgram, getProgramDay } from '../src/programStorage';
import type { Program } from '../src/types';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
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
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  it('creates programs, program_days, and program_exercises tables', async () => {
    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = tables.map(t => t.name);
    expect(names).toContain('programs');
    expect(names).toContain('program_days');
    expect(names).toContain('program_exercises');
  });

  it('saveProgram stub is callable without throwing', async () => {
    await expect(
      saveProgram(db, { name: 'Test', days: [], activeDayIndex: 0 })
    ).resolves.toBeUndefined();
  });

  it('getProgram stub returns null', async () => {
    await expect(getProgram(db)).resolves.toBeNull();
  });

  it('getProgramDay stub returns null', async () => {
    await expect(getProgramDay(db, 1)).resolves.toBeNull();
  });
});

describe('program storage', () => {
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  it('saves and retrieves a program with days and exercises in order', async () => {
    await saveProgram(db, PROGRAM_A);
    const program = await getProgram(db);
    expect(program).not.toBeNull();
    expect(program!.name).toBe('v1');
    expect(program!.activeDayIndex).toBe(2);
    expect(program!.days).toHaveLength(2);
    expect(program!.days[0].name).toBe('Day 1');
    expect(program!.days[0].exercises).toHaveLength(2);
    expect(program!.days[0].exercises[0].name).toBe('Squat');
    expect(program!.days[0].exercises[0].targets[0]).toMatchObject({ reps: 5, weight: 100 });
    expect(program!.days[1].name).toBe('Day 2');
    expect(program!.days[1].exercises[0].name).toBe('Bench Press');
    expect(program!.days[1].exercises[0].targets[0]).toMatchObject({ reps: 8, minReps: 6, weight: 60 });
  });

  it('second save replaces first — only one program at a time', async () => {
    await saveProgram(db, PROGRAM_A);
    await saveProgram(db, PROGRAM_B);
    const program = await getProgram(db);
    expect(program!.name).toBe('v2');
    expect(program!.days).toHaveLength(1);
  });

  it('returns null when no program has been saved', async () => {
    const program = await getProgram(db);
    expect(program).toBeNull();
  });

  it('getProgramDay returns the correct day with its exercises', async () => {
    await saveProgram(db, PROGRAM_A);
    const program = await getProgram(db);
    const days = program!.days;
    // We need a day id — retrieve it from the program
    // getProgramDay is keyed on day_index within the single program
    const day = await getProgramDay(db, 1); // day_index 1 = Day 2
    expect(day).not.toBeNull();
    expect(day!.name).toBe('Day 2');
    expect(day!.exercises[0].name).toBe('Bench Press');
  });

  it('preserves target data through serialisation round-trip', async () => {
    await saveProgram(db, PROGRAM_A);
    const program = await getProgram(db);
    const target = program!.days[1].exercises[0].targets[0];
    expect(target.reps).toBe(8);
    expect(target.minReps).toBe(6);
    expect(target.weight).toBe(60);
  });
});
