import { type DrizzleDB } from '../src/storage';
import { importFromNotes } from '../src/notesImport';
import { getPrograms } from '../src/programStorage';
import type { ParsedNotes } from '../src/notesParser';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';

const EMPTY_PARSED: ParsedNotes = {
  sections: [],
  inferredUnit: null,
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
};

describe('importFromNotes', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
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
    await importFromNotes(db, ONE_SECTION);
    const before = await getPrograms(db);
    expect(before).toHaveLength(1);

    const allEmpty: ParsedNotes = {
      sections: [
        { name: 'Header only', exercises: [] },
        { name: 'Also empty', exercises: [] },
      ],
      inferredUnit: null,
    };
    const result = await importFromNotes(db, allEmpty);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(0);

    const after = await getPrograms(db);
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe('Push');
  });
});
