import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { importFromNotes } from '../src/notesImport';
import { getPrograms } from '../src/programStorage';
import type { ParsedNotes } from '../src/notesParser';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
}

const EMPTY_PARSED: ParsedNotes = {
  sections: [],
  inferredUnit: null,
  skippedLines: 0,
};

const ONE_SECTION: ParsedNotes = {
  sections: [
    {
      name: 'Push',
      exercises: [
        { name: 'Bench press', sets: 3, reps: null, weight: 80, explicitUnit: 'kg' },
        { name: 'Overhead press', sets: 2, reps: null, weight: 50, explicitUnit: null },
      ],
    },
  ],
  inferredUnit: 'kg',
  skippedLines: 0,
};

const TWO_SECTIONS: ParsedNotes = {
  sections: [
    {
      name: 'Push',
      exercises: [
        { name: 'Bench press', sets: 3, reps: null, weight: 80, explicitUnit: 'kg' },
      ],
    },
    {
      name: 'Pull',
      exercises: [
        { name: 'Row', sets: 3, reps: null, weight: 60, explicitUnit: 'kg' },
      ],
    },
  ],
  inferredUnit: 'kg',
  skippedLines: 0,
};

const EMPTY_SECTION: ParsedNotes = {
  sections: [
    { name: 'Push', exercises: [] },
    {
      name: 'Pull',
      exercises: [{ name: 'Row', sets: 3, reps: null, weight: 60, explicitUnit: 'kg' }],
    },
  ],
  inferredUnit: 'kg',
  skippedLines: 0,
};

describe('importFromNotes', () => {
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  it('returns success with 0 programs for empty input', async () => {
    const result = await importFromNotes(db, EMPTY_PARSED);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(0);
  });

  it('creates one program per section', async () => {
    const result = await importFromNotes(db, TWO_SECTIONS);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(2);

    const programs = await getPrograms(db);
    expect(programs).toHaveLength(2);
    expect(programs.map(p => p.name)).toEqual(['Push', 'Pull']);
  });

  it('each program has a single day containing all its exercises', async () => {
    await importFromNotes(db, ONE_SECTION);
    const programs = await getPrograms(db);
    expect(programs[0].days).toHaveLength(1);
    expect(programs[0].days[0].exercises).toHaveLength(2);
    expect(programs[0].days[0].exercises[0].name).toBe('Bench press');
    expect(programs[0].days[0].exercises[1].name).toBe('Overhead press');
  });

  it('exercises get one target per set with weight from parsed data and 10 default reps', async () => {
    await importFromNotes(db, ONE_SECTION);
    const programs = await getPrograms(db);
    const bench = programs[0].days[0].exercises[0]; // 3 sets, 80kg
    expect(bench.targets).toHaveLength(3);
    expect(bench.targets[0]).toEqual({ reps: 10, weight: 80 });
    expect(bench.targets[1]).toEqual({ reps: 10, weight: 80 });
    expect(bench.targets[2]).toEqual({ reps: 10, weight: 80 });
  });

  it('skips sections with no exercises', async () => {
    const result = await importFromNotes(db, EMPTY_SECTION);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(1);

    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].name).toBe('Pull');
  });

  it('does not wipe existing programs when all parsed sections are empty', async () => {
    // Seed an existing program
    await importFromNotes(db, ONE_SECTION);
    const before = await getPrograms(db);
    expect(before).toHaveLength(1);

    // Import notes with sections but no exercises
    const allEmpty: ParsedNotes = {
      sections: [
        { name: 'Header only', exercises: [] },
        { name: 'Also empty', exercises: [] },
      ],
      inferredUnit: null,
      skippedLines: 0,
    };
    const result = await importFromNotes(db, allEmpty);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(0);

    // Existing programs must be untouched
    const after = await getPrograms(db);
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe('Push');
  });
});
