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

  it('creates one program with all sections as days', async () => {
    const result = await importFromNotes(db, TWO_SECTIONS);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(1);

    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].days).toHaveLength(2);
    expect(programs[0].days.map(d => d.name)).toEqual(['Push', 'Pull']);
  });

  it('each day contains all exercises from its section', async () => {
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
    expect(bench.targets[0]).toEqual({ reps: 10, weight: 80, restSeconds: 60 });
    expect(bench.targets[1]).toEqual({ reps: 10, weight: 80, restSeconds: 60 });
    expect(bench.targets[2]).toEqual({ reps: 10, weight: 80, restSeconds: 60 });
  });

  it('defaults to 6 sets, 10 reps, and 60s rest when not specified in parsed data', async () => {
    const noSetsOrReps: ParsedNotes = {
      sections: [
        {
          name: 'Push',
          exercises: [{ name: 'Squat', sets: null, reps: null, weight: 100, explicitUnit: 'kg' }],
        },
      ],
      inferredUnit: 'kg',
    };
    await importFromNotes(db, noSetsOrReps);
    const programs = await getPrograms(db);
    const squat = programs[0].days[0].exercises[0];
    expect(squat.targets).toHaveLength(6);
    squat.targets.forEach(t => expect(t).toEqual({ reps: 10, weight: 100, restSeconds: 60 }));
  });

  it('skips sections with no exercises', async () => {
    const result = await importFromNotes(db, EMPTY_SECTION);
    expect(result.success).toBe(true);
    if (result.success) expect(result.programsCreated).toBe(1);

    const programs = await getPrograms(db);
    expect(programs).toHaveLength(1);
    expect(programs[0].days).toHaveLength(1);
    expect(programs[0].days[0].name).toBe('Pull');
  });

  it('does not wipe existing programs when all parsed sections are empty', async () => {
    await importFromNotes(db, ONE_SECTION);
    const before = await getPrograms(db);
    expect(before).toHaveLength(1);
    const firstName = before[0].name;

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
    expect(after[0].name).toBe(firstName);
  });

  it('importing twice appends a second program and leaves the first untouched', async () => {
    jest.useFakeTimers({ now: new Date('2026-06-02T12:00:00Z') });
    try {
      await importFromNotes(db, ONE_SECTION);
      const after1 = await getPrograms(db);
      expect(after1).toHaveLength(1);
      expect(after1[0].name).toBe('My Program – 2 Jun 2026');
      expect(after1[0].days).toHaveLength(1);

      await importFromNotes(db, TWO_SECTIONS);
      const after2 = await getPrograms(db);
      expect(after2).toHaveLength(2);
      expect(after2[0].name).toBe('My Program – 2 Jun 2026');
      expect(after2[0].days).toHaveLength(1); // first import untouched
      expect(after2[1].name).toBe('My Program – 2 Jun 2026');
      expect(after2[1].days).toHaveLength(2); // second import has 2 sections
    } finally {
      jest.useRealTimers();
    }
  });
});
