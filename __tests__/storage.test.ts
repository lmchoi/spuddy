import BetterSqlite from 'better-sqlite3';
import {
  initSchema,
  makeTestDB,
  saveSession,
  getAllSessions,
  getSessionsForExercise,
  getUniqueExerciseNames,
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

  it('returns unique exercise names alphabetically', async () => {
    await saveSession(db, SESSION_A); // Squat, Deadlift
    await saveSession(db, SESSION_B); // Squat (again)
    const names = await getUniqueExerciseNames(db);
    expect(names).toEqual(['Deadlift', 'Squat']);
  });

  it('returns empty array for exercise names when no sessions', async () => {
    const names = await getUniqueExerciseNames(db);
    expect(names).toHaveLength(0);
  });

  it('preserves set and target data through serialisation round-trip', async () => {
    await saveSession(db, SESSION_A);
    const sessions = await getAllSessions(db);
    const squat = sessions[0].exercises[0];
    expect(squat.sets[0]).toMatchObject({ reps: 5, weight: 100, isWarmup: false });
    expect(squat.targets[0]).toMatchObject({ reps: 5, weight: 100 });
  });
});
