import BetterSqlite from 'better-sqlite3';
import {
  initSchema,
  makeTestDB,
  saveSession,
  resolveOrCreateExercise,
  getAllSessions,
  getSessionsForExercise,
  getSessionByDate,
  type DB,
} from '../src/storage';
import type { Session } from '../src/types';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
}

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
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
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
      const exId = await resolveOrCreateExercise(db, 'Bench');
      await db.run(
        `INSERT INTO sessions (date, exercise_id, sets_json, targets_json) VALUES (?, ?, ?, ?)`,
        ['2026-05-26', exId, '[{"reps":5,"weight":60,"isWarmup":false,"isBodyweight":false}]', '[]']
      );
      const session = await getSessionByDate(db, '2026-05-26');
      expect(session?.exercises[0].id).toBeUndefined();
    });
  });

  describe('deduplication safeguard', () => {
    it('skips duplicate exercise entries for the same date/name', async () => {
      const exId = await resolveOrCreateExercise(db, 'Bench');
      // Manually insert duplicate rows to simulate legacy bad data
      await db.run(
        `INSERT INTO sessions (date, exercise_id, sets_json, targets_json)
         VALUES (?, ?, ?, ?)`,
        ['2026-06-01', exId, '[]', '[]']
      );
      await db.run(
        `INSERT INTO sessions (date, exercise_id, sets_json, targets_json)
         VALUES (?, ?, ?, ?)`,
        ['2026-06-01', exId, '[{"reps":10,"weight":60}]', '[]']
      );

      const sessions = await getAllSessions(db);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].exercises).toHaveLength(1);
      // We pick the first row found for a given exercise on a given date.
      // This is a simple safeguard against duplicate entries from legacy bugs.
      expect(sessions[0].exercises[0].sets).toHaveLength(0);
    });
  });

  describe('migration to exercise IDs', () => {
    it('migrates legacy name-based data to ID-based data', async () => {
      const sqlite = new BetterSqlite(':memory:');
      const db = makeTestDB(sqlite);

      // Manually create legacy schema
      await db.run(`CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        sets_json TEXT NOT NULL,
        targets_json TEXT NOT NULL
      )`);
      await db.run(`CREATE TABLE programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        active_day_index INTEGER NOT NULL DEFAULT 0
      )`);
      await db.run(`CREATE TABLE program_days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_id INTEGER NOT NULL REFERENCES programs(id),
        day_index INTEGER NOT NULL,
        name TEXT NOT NULL
      )`);
      await db.run(`CREATE TABLE program_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_day_id INTEGER NOT NULL REFERENCES program_days(id),
        exercise_index INTEGER NOT NULL,
        name TEXT NOT NULL,
        targets_json TEXT NOT NULL
      )`);

      // Seed legacy data
      await db.run(`INSERT INTO sessions (date, exercise_name, sets_json, targets_json) VALUES (?, ?, ?, ?)`,
        ['2026-05-01', 'Squat', '[]', '[]']);
      await db.run(`INSERT INTO programs (name) VALUES (?)`, ['PPL']);
      await db.run(`INSERT INTO program_days (program_id, day_index, name) VALUES (?, ?, ?)`, [1, 0, 'Legs']);
      await db.run(`INSERT INTO program_exercises (program_day_id, exercise_index, name, targets_json) VALUES (?, ?, ?, ?)`,
        [1, 0, 'Squat', '[]']);

      // Run initSchema which calls migrate
      await initSchema(db);

      // Verify migration
      const exercises = await db.all<{ id: number, name: string }>(`SELECT * FROM exercises`);
      expect(exercises).toHaveLength(1);
      expect(exercises[0].name).toBe('Squat');

      const sessions = await db.all<{ exercise_id: number }>(`SELECT exercise_id FROM sessions`);
      expect(sessions[0].exercise_id).toBe(exercises[0].id);

      const progEx = await db.all<{ exercise_id: number }>(`SELECT exercise_id FROM program_exercises`);
      expect(progEx[0].exercise_id).toBe(exercises[0].id);
    });
  });

  describe('saveSession error handling', () => {
    it('preserves the original error when ROLLBACK also fails', async () => {
      const originalError = new Error('Cannot use shared object that was already released');
      let callCount = 0;
      const flakyDB: DB = {
        run: jest.fn().mockImplementation(async (sql: string) => {
          callCount++;
          if (callCount === 1) return; // BEGIN succeeds
          throw callCount === 2 ? originalError : new Error('ROLLBACK also failed');
        }),
        all: jest.fn().mockResolvedValue([]),
      };

      await expect(saveSession(flakyDB, SESSION_A)).rejects.toThrow(originalError.message);
    });
  });
});
