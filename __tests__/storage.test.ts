import { sql } from 'drizzle-orm';
import {
  resolveOrCreateExercise,
  saveSession,
  getAllSessions,
  getSessionsForExercise,
  getSessionByDate,
  type DrizzleDB,
} from '../src/storage';
import type { Session } from '../src/types';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';

const SESSION_A: Session = {
  date: '2026-05-01',
  exercises: [
    {
      name: 'Squat',
      sets: [
        { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
        { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
      ],
      targets: [{ reps: 5, weight: 100 }],
    },
    {
      name: 'Deadlift',
      sets: [{ reps: 5, weight: 120, isWarmup: false, isBodyweight: false }],
      targets: [],
    },
  ],
};

const SESSION_B: Session = {
  date: '2026-05-10',
  exercises: [
    {
      name: 'Squat',
      sets: [{ reps: 5, weight: 105, isWarmup: false, isBodyweight: false }],
      targets: [{ reps: 5, weight: 105 }],
    },
  ],
};

describe('SQLite storage', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('saves a session and retrieves it', async () => {
    await saveSession(db, SESSION_A);
    const sessions = await getAllSessions(db);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].date).toBe('2026-05-01');
    expect(sessions[0].exercises).toHaveLength(2);
    expect(sessions[0].exercises[0].name).toBe('Squat');
    expect(sessions[0].exercises[0].sets).toHaveLength(2);
  });

  it('returns sessions newest first', async () => {
    await saveSession(db, SESSION_A);
    await saveSession(db, SESSION_B);
    const sessions = await getAllSessions(db);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].date).toBe('2026-05-10');
    expect(sessions[1].date).toBe('2026-05-01');
  });

  it('queries sessions by exercise name', async () => {
    await saveSession(db, SESSION_A);
    await saveSession(db, SESSION_B);
    const squatSessions = await getSessionsForExercise(db, 'Squat');
    expect(squatSessions).toHaveLength(2);
    squatSessions.forEach(s => expect(s.exercises[0].name).toBe('Squat'));

    const deadliftSessions = await getSessionsForExercise(db, 'Deadlift');
    expect(deadliftSessions).toHaveLength(1);
    expect(deadliftSessions[0].date).toBe('2026-05-01');
  });

  it('returns empty array when no sessions exist', async () => {
    const sessions = await getAllSessions(db);
    expect(sessions).toHaveLength(0);
  });

  it('preserves set and target data through serialisation round-trip', async () => {
    await saveSession(db, SESSION_A);
    const sessions = await getAllSessions(db);
    const squat = sessions[0].exercises[0];
    expect(squat.sets[0]).toMatchObject({ reps: 5, weight: 100, isWarmup: false });
    expect(squat.targets[0]).toMatchObject({ reps: 5, weight: 100 });
  });

  it('old sets_json without optional fields deserialises — rpe/distanceMeters/durationSeconds are undefined', async () => {
    await saveSession(db, SESSION_A);
    const sessions = await getAllSessions(db);
    const set = sessions[0].exercises[0].sets[0];
    expect(set.rpe).toBeUndefined();
    expect(set.distanceMeters).toBeUndefined();
    expect(set.durationSeconds).toBeUndefined();
  });

  it('round-trips sets with optional fields intact', async () => {
    const sessionWithExtras: Session = {
      date: '2026-05-20',
      exercises: [{
        name: 'Run',
        sets: [{
          reps: 1,
          weight: 0,
          isWarmup: false,
          isBodyweight: false,
          rpe: 7,
          distanceMeters: 1000,
          durationSeconds: 300,
        }],
        targets: [],
      }],
    };
    await saveSession(db, sessionWithExtras);
    const sessions = await getAllSessions(db);
    const run = sessions.find(s => s.date === '2026-05-20')!;
    const set = run.exercises[0].sets[0];
    expect(set.rpe).toBe(7);
    expect(set.distanceMeters).toBe(1000);
    expect(set.durationSeconds).toBe(300);
  });

  describe('getSessionByDate', () => {
    it('returns a session for a specific date', async () => {
      await saveSession(db, SESSION_A);
      const session = await getSessionByDate(db, '2026-05-01');
      expect(session).not.toBeNull();
      expect(session?.date).toBe('2026-05-01');
    });

    it('returns null if no session exists for date', async () => {
      const session = await getSessionByDate(db, '2999-01-01');
      expect(session).toBeNull();
    });
  });

  describe('schema step 0 — nullable reps and optional id', () => {
    it('sets with reps: null round-trip through storage', async () => {
      const session: Session = {
        date: '2026-05-25',
        exercises: [{
          name: 'Leg press',
          sets: [{ reps: null, weight: 68.3, isWarmup: false, isBodyweight: false }],
          targets: [],
        }],
      };
      await saveSession(db, session);
      const loaded = await getSessionByDate(db, '2026-05-25');
      expect(loaded?.exercises[0].sets[0].reps).toBeNull();
    });

    it('exercises loaded from old data without id field have id undefined', async () => {
      const exId = resolveOrCreateExercise(db, 'Bench');
      db.run(sql`INSERT INTO sessions (date, exercise_id, sets_json, targets_json)
        VALUES (${'2026-05-26'}, ${exId}, ${'[{"reps":5,"weight":60,"isWarmup":false,"isBodyweight":false}]'}, ${'[]'})`);
      const session = await getSessionByDate(db, '2026-05-26');
      expect(session?.exercises[0].id).toBeUndefined();
    });
  });

  describe('resolveOrCreateExercise', () => {
    it('returns a numeric id for a new exercise', () => {
      const id = resolveOrCreateExercise(db, 'Press');
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('returns the same id on repeat calls for the same name', () => {
      const first = resolveOrCreateExercise(db, 'Curl');
      const second = resolveOrCreateExercise(db, 'Curl');
      expect(first).toBe(second);
    });

    it('returns distinct ids for different exercise names', () => {
      const a = resolveOrCreateExercise(db, 'Squat');
      const b = resolveOrCreateExercise(db, 'Deadlift');
      expect(a).not.toBe(b);
    });
  });

  describe('deduplication safeguard', () => {
    it('skips duplicate exercise entries for the same date/name', async () => {
      const exId = resolveOrCreateExercise(db, 'Bench');
      db.run(sql`INSERT INTO sessions (date, exercise_id, sets_json, targets_json)
        VALUES (${'2026-06-01'}, ${exId}, ${'[]'}, ${'[]'})`);
      db.run(sql`INSERT INTO sessions (date, exercise_id, sets_json, targets_json)
        VALUES (${'2026-06-01'}, ${exId}, ${'[{"reps":10,"weight":60}]'}, ${'[]'})`);

      const sessions = await getAllSessions(db);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].exercises).toHaveLength(1);
      expect(sessions[0].exercises[0].sets).toHaveLength(0);
    });
  });

});
