import { type DrizzleDB, getAllSessions } from '../src/storage';
import { getPrograms } from '../src/programStorage';
import { importFromStrong } from '../src/strongImport';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';

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
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
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
      const may10 = sessions.find(s => s.date === '2026-05-10')!;
      const bench = may10.exercises[0];
      expect(bench.sets).toHaveLength(2);
      expect(bench.sets[0].weight).toBe(70);
      expect(bench.sets[0].reps).toBe(5);
    });

    it('converts lbs to kg when unit is lbs', async () => {
      await importFromStrong(db, LBS_CSV, [], 'lbs');
      const sessions = await getAllSessions(db);
      const session = sessions[0];
      const set = session.exercises[0].sets[0];
      expect(set.weight).toBeCloseTo(176 * 0.45359237, 5);
    });

    it('merges exercises from same workout on the same date', async () => {
      await importFromStrong(db, BASIC_CSV, [], 'kg');
      const sessions = await getAllSessions(db);
      const may10 = sessions.find(s => s.date === '2026-05-10')!;
      expect(may10.exercises[0].sets).toHaveLength(2);
    });
  });

  describe('program inference', () => {
    it('creates a program for each selected workout name', async () => {
      const result = await importFromStrong(db, BASIC_CSV, ['Push', 'Pull'], 'kg');
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.programs).toHaveLength(2);
    });

    it('does not create programs when selectedWorkoutNames is empty', async () => {
      const result = await importFromStrong(db, BASIC_CSV, [], 'kg');
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.programs).toHaveLength(0);
      const programs = await getPrograms(db);
      expect(programs).toHaveLength(0);
    });

    it('uses the most recent session for program exercise targets', async () => {
      await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      const programs = await getPrograms(db);
      const push = programs.find(p => p.name === 'Push')!;
      const bench = push.days[0].exercises[0];
      expect(bench.targets[0].weight).toBe(80);
    });

    it('persists programs to storage', async () => {
      await importFromStrong(db, BASIC_CSV, ['Push'], 'kg');
      const programs = await getPrograms(db);
      expect(programs.find(p => p.name === 'Push')).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('returns error for completely invalid input', async () => {
      const result = await importFromStrong(db, 'not a csv', [], 'kg');
      expect(result.success).toBe(false);
    });
  });
});
