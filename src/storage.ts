import * as SQLite from 'expo-sqlite';
import type { Session, Target, WorkingSet } from './types';

export interface DB {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    sets_json TEXT NOT NULL,
    targets_json TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON sessions (exercise_name)`,
  `CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active_day_index INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS program_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL REFERENCES programs(id),
    day_index INTEGER NOT NULL,
    name TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS program_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_day_id INTEGER NOT NULL REFERENCES program_days(id),
    exercise_index INTEGER NOT NULL,
    name TEXT NOT NULL,
    targets_json TEXT NOT NULL
  )`,
];

export async function initDB(): Promise<DB> {
  const db = await SQLite.openDatabaseAsync('spuddy.db');
  const adapter = makeExpoAdapter(db);
  await initSchema(adapter);
  return adapter;
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
  for (const sql of SCHEMA_STATEMENTS) {
    await db.run(sql);
  }
}

export async function sessionExists(db: DB, date: string): Promise<boolean> {
  const rows = await db.all<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sessions WHERE date = ?`,
    [date]
  );
  return (rows[0]?.n ?? 0) > 0;
}

export async function saveSession(db: DB, session: Session): Promise<void> {
  await db.run('BEGIN');
  try {
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
    await db.run('COMMIT');
  } catch (err) {
    try { await db.run('ROLLBACK'); } catch { /* ignore secondary failure */ }
    throw err;
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
    const session = byDate.get(row.date)!;
    // Skip duplicate exercise entries caused by double-saves before dedup was in place
    if (session.exercises.some(e => e.name === row.exercise_name)) continue;
    session.exercises.push({
      name: row.exercise_name,
      sets: JSON.parse(row.sets_json) as WorkingSet[],
      targets: JSON.parse(row.targets_json) as Target[],
    });
  }
  return Array.from(byDate.values());
}


export async function getUniqueExerciseNames(db: DB): Promise<string[]> {
  const rows = await db.all<{ exercise_name: string }>(
    `SELECT DISTINCT exercise_name FROM sessions ORDER BY exercise_name ASC`
  );
  return rows.map(r => r.exercise_name);
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

export async function getSessionByDate(db: DB, date: string): Promise<Session | null> {
  const rows = await db.all<SessionRow>(
    `SELECT date, exercise_name, sets_json, targets_json FROM sessions WHERE date = ?`,
    [date]
  );
  const sessions = rowsToSessions(rows);
  return sessions[0] ?? null;
}
