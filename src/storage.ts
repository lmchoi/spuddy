import * as SQLite from 'expo-sqlite';
import type { ExerciseEntry, Session, Target, WorkingSet } from './types';

export interface DB {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    sets_json TEXT NOT NULL,
    targets_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (date DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON sessions (exercise_name);
`;

export async function initDB(): Promise<DB> {
  const db = await SQLite.openDatabaseAsync('spuddy.db');
  await db.execAsync(SCHEMA);
  return makeExpoAdapter(db);
}

function makeExpoAdapter(db: SQLite.SQLiteDatabase): DB {
  return {
    run: async (sql, params = []) => {
      await db.runAsync(sql, params as SQLite.SQLiteBindParams);
    },
    all: async <T>(sql: string, params: unknown[] = []) => {
      return db.getAllAsync<T>(sql, params as SQLite.SQLiteBindParams);
    },
  };
}

export function makeTestDB(betterSqlite: BetterSqliteDB): DB {
  return {
    run: async (sql, params = []) => {
      betterSqlite.prepare(sql).run(params);
    },
    all: async <T>(sql: string, params: unknown[] = []) => {
      return betterSqlite.prepare(sql).all(params) as T[];
    },
  };
}

interface BetterSqliteDB {
  prepare(sql: string): { run(params: unknown[]): void; all(params: unknown[]): unknown[] };
  exec(sql: string): void;
}

export async function initSchema(db: DB): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      sets_json TEXT NOT NULL,
      targets_json TEXT NOT NULL
    )
  `);
  await db.run(
    `CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (date DESC)`
  );
  await db.run(
    `CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON sessions (exercise_name)`
  );
}

export async function saveSession(db: DB, session: Session): Promise<void> {
  for (const entry of session.exercises) {
    await db.run(
      `INSERT INTO sessions (date, exercise_name, sets_json, targets_json)
       VALUES (?, ?, ?, ?)`,
      [
        session.date,
        entry.name,
        JSON.stringify(entry.sets),
        JSON.stringify(entry.targets),
      ]
    );
  }
}

type SessionRow = {
  date: string;
  exercise_name: string;
  sets_json: string;
  targets_json: string;
};

function rowsToSessions(rows: SessionRow[]): Session[] {
  const byDate = new Map<string, Session>();
  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { date: row.date, exercises: [] });
    }
    byDate.get(row.date)!.exercises.push({
      name: row.exercise_name,
      sets: JSON.parse(row.sets_json) as WorkingSet[],
      targets: JSON.parse(row.targets_json) as Target[],
    });
  }
  return Array.from(byDate.values());
}

export async function getAllSessions(db: DB): Promise<Session[]> {
  const rows = await db.all<SessionRow>(
    `SELECT date, exercise_name, sets_json, targets_json
     FROM sessions ORDER BY date DESC`
  );
  return rowsToSessions(rows);
}

export async function getSessionsForExercise(
  db: DB,
  exerciseName: string
): Promise<Session[]> {
  const rows = await db.all<SessionRow>(
    `SELECT date, exercise_name, sets_json, targets_json
     FROM sessions WHERE exercise_name = ? ORDER BY date DESC`,
    [exerciseName]
  );
  return rowsToSessions(rows);
}
