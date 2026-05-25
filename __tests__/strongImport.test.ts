import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, getAllSessions, type DB } from '../src/storage';
import { getPrograms } from '../src/programStorage';
import { importFromStrong } from '../src/strongImport';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
}

const SC_HEADER = '"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"';

const BASIC_CSV = [
  SC_HEADER,
  '"1";"2026-05-10 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"70";"5";"";"";"";"";"" ',
  '"1";"2026-05-10 07:00:00";"Push";"1800";"Bench Press (Barbell)";"2";"75";"5";"";"";"";"";"" ',
  '"2";"2026-05-20 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"80";"5";"";"";"";"";"" ',
  '"2";"2026-05-20 07:00:00";"Push";"1800";"Bench Press (Barbell)";"2";"80";"3";"";"";"";"";"" ',
  '"3";"2026-05-21 08:00:00";"Pull";"1800";"Row (Barbell)";"1";"60";"8";"";"";"";"";"" ',
].join('\n');

const LBS_CSV = [
  SC_HEADER,
  '"1";"2026-05-20 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"176";"5";"";"";"";"";"" ',
].join('\n');

describe('importFromStrong', () => {
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  describe('history saving', () => {
    it('saves all sessions regardless of selected workout names', async () => {
      await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      const sessions = await getAllSessions(db);
      // 2 Push sessions (2026-05-10, 2026-05-20) + 1 Pull session (2026-05-21)
      expect(sessions).toHaveLength(3);
    });

    it('returns correct sessionsImported count', async () => {
      const result = await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      expect(result.success).toBe(true);
      if (result.success) expect(result.sessionsImported).toBe(3);
    });

    it('persists sets with correct weight and reps', async () => {
      await importFromStrong(db, BASIC_CSV, [], 'kg');
      const sessions = await getAllSessions(db);
      const pushMay20 = sessions.find(s => s.date === '2026-05-20')!;
      const bench = pushMay20.exercises.find(e => e.name === 'Bench Press')!;
      expect(bench.sets).toHaveLength(2);
      expect(bench.sets[0]).toMatchObject({ weight: 80, reps: 5 });
    });
  });

  describe('program inference', () => {
    it('creates programs only for selected workout names', async () => {
      await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      const programs = await getPrograms(db);
      expect(programs).toHaveLength(1);
      expect(programs[0].name).toBe('Push');
    });

    it('creates no programs when selection is empty', async () => {
      await importFromStrong(db, BASIC_CSV, [], 'kg');
      const programs = await getPrograms(db);
      expect(programs).toHaveLength(0);
    });

    it('uses most recent session for program template', async () => {
      // Push has sessions on 2026-05-10 and 2026-05-20; most recent is 2026-05-20
      await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      const programs = await getPrograms(db);
      const push = programs[0];
      const benchTarget = push.days[0].exercises.find(e => e.name === 'Bench Press');
      expect(benchTarget).toBeDefined();
      // From 2026-05-20: last set is weight 80 reps 3
      expect(benchTarget!.targets[0]).toMatchObject({ weight: 80, reps: 3 });
    });

    it('sets target set count from most recent session', async () => {
      await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      const programs = await getPrograms(db);
      const bench = programs[0].days[0].exercises.find(e => e.name === 'Bench Press')!;
      // 2026-05-20 Push has 2 Bench Press sets
      expect(bench.targets).toHaveLength(2);
    });

    it('returns the created programs in the result', async () => {
      const result = await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.programs).toHaveLength(1);
        expect(result.programs[0].name).toBe('Push');
      }
    });
  });

  describe('unit conversion', () => {
    it('converts lbs to kg when unit is lbs', async () => {
      await importFromStrong(db, LBS_CSV, [], 'lbs');
      const sessions = await getAllSessions(db);
      const bench = sessions[0].exercises[0];
      // 176 lbs ≈ 79.83 kg
      expect(bench.sets[0].weight).toBeCloseTo(79.83, 1);
    });

    it('does not convert when unit is kg', async () => {
      await importFromStrong(db, LBS_CSV, [], 'kg');
      const sessions = await getAllSessions(db);
      expect(sessions[0].exercises[0].sets[0].weight).toBe(176);
    });
  });

  describe('error handling', () => {
    it('returns success: false for unparseable input', async () => {
      const result = await importFromStrong(db, 'not a csv at all !!!', ['Push'], 'kg');
      expect(result.success).toBe(false);
    });

    it('does not crash when a selected workout has an exercise with no sets', async () => {
      // A CSV where every row for one exercise is a Rest Timer — parser filters them all,
      // leaving an exercise entry with sets: []. Program inference must not crash.
      const SC_HEADER = '"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"';
      const csv = [
        SC_HEADER,
        '"1";"2026-05-20 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"80";"5";"";"";"";"";"" ',
        '"1";"2026-05-20 07:00:00";"Push";"1800";"Rest Timer";"1";"0";"0";"";"";"60";"";"" ',
      ].join('\n');
      const result = await importFromStrong(db, csv, ['Push'], 'kg');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.programs).toHaveLength(1);
        expect(result.programs[0].days[0].exercises).toHaveLength(1);
        expect(result.programs[0].days[0].exercises[0].name).toBe('Bench Press');
      }
    });
  });

  describe('edge cases', () => {
    it('merges multiple sessions on the same date into one session', async () => {
      // Two different "workouts" (IDs 1 and 2) on the same date
      const mergedCsv = [
        SC_HEADER,
        '"1";"2026-05-10 07:00:00";"Morning Session";"1800";"Squat";"1";"100";"5";"";"";"";"";""',
        '"2";"2026-05-10 17:00:00";"Evening Session";"1800";"Bench Press";"1";"70";"5";"";"";"";"";""',
      ].join('\n');

      await importFromStrong(db, mergedCsv, [], 'kg');
      const sessions = await getAllSessions(db);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].date).toBe('2026-05-10');
      expect(sessions[0].exercises).toHaveLength(2);
      expect(sessions[0].exercises.map(e => e.name)).toContain('Squat');
      expect(sessions[0].exercises.map(e => e.name)).toContain('Bench Press');
    });

    it('merges sets of the same exercise if it appears in multiple sessions on same date', async () => {
      const mergedCsv = [
        SC_HEADER,
        '"1";"2026-05-10 07:00:00";"Morning";"1800";"Squat";"1";"100";"5";"";"";"";"";""',
        '"2";"2026-05-10 17:00:00";"Evening";"1800";"Squat";"1";"110";"5";"";"";"";"";""',
      ].join('\n');

      await importFromStrong(db, mergedCsv, [], 'kg');
      const sessions = await getAllSessions(db);
      expect(sessions).toHaveLength(1);
      const squat = sessions[0].exercises[0];
      expect(squat.sets).toHaveLength(2);
      expect(squat.sets[0].weight).toBe(100);
      expect(squat.sets[1].weight).toBe(110);
    });

    it('returns error result if db fails', async () => {
      const brokenDb = {
        run: () => Promise.reject(new Error('DB failure')),
        all: () => Promise.resolve([]),
      } as unknown as DB;

      const result = await importFromStrong(brokenDb, BASIC_CSV, [], 'kg');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('DB failure');
      }
    });

    it('returns generic error if catch receives non-Error object', async () => {
      const brokenDb = {
        run: () => { throw 'string error'; },
        all: () => Promise.resolve([]),
      } as unknown as DB;

      const result = await importFromStrong(brokenDb, BASIC_CSV, [], 'kg');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Import failed.');
      }
    });
  });
});
