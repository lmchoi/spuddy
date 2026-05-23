import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { savePrograms, getPrograms, getProgramDay, updateActiveDayIndex } from '../src/programStorage';
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

  it('savePrograms stub is callable without throwing', async () => {
    await expect(
      savePrograms(db, [{ name: 'Test', days: [], activeDayIndex: 0 }])
    ).resolves.toBeUndefined();
  });

  it('getPrograms stub returns empty array', async () => {
    await expect(getPrograms(db)).resolves.toEqual([]);
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

  it('saves and retrieves multiple programs in order', async () => {
    await savePrograms(db, [PROGRAM_A, PROGRAM_B]);
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(2);
    expect(programs[0].name).toBe('v1');
    expect(programs[0].activeDayIndex).toBe(2);
    expect(programs[0].days).toHaveLength(2);
    expect(programs[0].days[0].exercises[0].name).toBe('Squat');
    expect(programs[0].days[0].exercises[0].targets[0]).toMatchObject({ reps: 5, weight: 100 });
    expect(programs[1].name).toBe('v2');
  });

  it('second save replaces all previous programs', async () => {
    await savePrograms(db, [PROGRAM_A]);
    await savePrograms(db, [PROGRAM_B]);
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].name).toBe('v2');
  });

  it('returns empty array when no programs have been saved', async () => {
    const programs = await getPrograms(db);
    expect(programs).toHaveLength(0);
  });

  it('getProgramDay returns the correct day with its exercises', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const day = await getProgramDay(db, 1); // day_index 1 = Day 2
    expect(day).not.toBeNull();
    expect(day!.name).toBe('Day 2');
    expect(day!.exercises[0].name).toBe('Bench Press');
  });

  it('preserves target data through serialisation round-trip', async () => {
    await savePrograms(db, [PROGRAM_A]);
    const programs = await getPrograms(db);
    const target = programs[0].days[1].exercises[0].targets[0];
    expect(target.reps).toBe(8);
    expect(target.minReps).toBe(6);
    expect(target.weight).toBe(60);
  });

  it('updateActiveDayIndex persists the new selection', async () => {
    await savePrograms(db, [PROGRAM_A]);
    await updateActiveDayIndex(db, 'v1', 0);
    const programs = await getPrograms(db);
    expect(programs[0].activeDayIndex).toBe(0);
  });

  it('updateActiveDayIndex does not affect other programs', async () => {
    await savePrograms(db, [PROGRAM_A, PROGRAM_B]);
    await updateActiveDayIndex(db, 'v1', 1);
    const programs = await getPrograms(db);
    expect(programs[0].activeDayIndex).toBe(1);
    expect(programs[1].activeDayIndex).toBe(0); // v2 unchanged
  });
});
