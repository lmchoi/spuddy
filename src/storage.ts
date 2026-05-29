import * as SQLite from 'expo-sqlite';
import type { Session, Target, WorkingSet } from './types';

export interface DB {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    sets_json TEXT NOT NULL,
    targets_json TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON sessions (exercise_id)`,
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
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
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

export async function resolveOrCreateExercise(db: DB, name: string): Promise<number> {
  const rows = await db.all<{ id: number }>(`SELECT id FROM exercises WHERE name = ?`, [name]);
  if (rows[0]) return rows[0].id;

  await db.run(`INSERT INTO exercises (name) VALUES (?)`, [name]);
  const lastId = await db.all<{ id: number }>(`SELECT last_insert_rowid() AS id`);
  return lastId[0].id;
}

export async function migrate(db: DB): Promise<void> {
  const tables = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
  );
  if (tables.length === 0) return;

  const tableInfo = await db.all<{ name: string }>(`PRAGMA table_info(sessions)`);
  if (tableInfo.some(c => c.name === 'exercise_id')) {
    return; // Already migrated
  }

  await db.run('BEGIN');
  try {
    // 1. Create exercises table if not exists
    await db.run(`CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

    // 2. Populate exercises from sessions and program_exercises
    const names = new Set<string>();
    const sessionNames = await db.all<{ exercise_name: string }>(`SELECT DISTINCT exercise_name FROM sessions`);
    sessionNames.forEach(r => names.add(r.exercise_name));

    // program_exercises might not exist yet if it's an old DB from before programs were added
    const peTables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='program_exercises'"
    );
    if (peTables.length > 0) {
      const programNames = await db.all<{ name: string }>(`SELECT DISTINCT name FROM program_exercises`);
      programNames.forEach(r => names.add(r.name));
    }

    for (const name of names) {
      await db.run(`INSERT OR IGNORE INTO exercises (name) VALUES (?)`, [name]);
    }

    // 3. Reconstruct sessions
    await db.run(`CREATE TABLE sessions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      sets_json TEXT NOT NULL,
      targets_json TEXT NOT NULL
    )`);
    await db.run(`INSERT INTO sessions_new (date, exercise_id, sets_json, targets_json)
      SELECT s.date, e.id, s.sets_json, s.targets_json
      FROM sessions s
      JOIN exercises e ON s.exercise_name = e.name`);
    await db.run(`DROP TABLE sessions`);
    await db.run(`ALTER TABLE sessions_new RENAME TO sessions`);
    // Indexes will be created by initSchema after migrate

    // 4. Reconstruct program_exercises if it exists
    if (peTables.length > 0) {
      await db.run(`CREATE TABLE program_exercises_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_day_id INTEGER NOT NULL REFERENCES program_days(id),
        exercise_index INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id),
        targets_json TEXT NOT NULL
      )`);
      await db.run(`INSERT INTO program_exercises_new (program_day_id, exercise_index, exercise_id, targets_json)
        SELECT pe.program_day_id, pe.exercise_index, e.id, pe.targets_json
        FROM program_exercises pe
        JOIN exercises e ON pe.name = e.name`);
      await db.run(`DROP TABLE program_exercises`);
      await db.run(`ALTER TABLE program_exercises_new RENAME TO program_exercises`);
    }

    await db.run('COMMIT');
  } catch (err) {
    try {
      await db.run('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export async function initSchema(db: DB): Promise<void> {
  await migrate(db);
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
      const exerciseId = await resolveOrCreateExercise(db, entry.name);
      await db.run(
        `INSERT INTO sessions (date, exercise_id, sets_json, targets_json)
         VALUES (?, ?, ?, ?)`,
        [
          session.date,
          exerciseId,
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
  exercise_id: number;
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
    if (session.exercises.some(e => e.exerciseId === row.exercise_id)) continue;
    session.exercises.push({
      exerciseId: row.exercise_id,
      name: row.exercise_name,
      sets: JSON.parse(row.sets_json) as WorkingSet[],
      targets: JSON.parse(row.targets_json) as Target[],
    });
  }
  return Array.from(byDate.values());
}


export async function getAllSessions(db: DB): Promise<Session[]> {
  const rows = await db.all<SessionRow>(
    `SELECT s.date, e.name AS exercise_name, s.exercise_id, s.sets_json, s.targets_json
     FROM sessions s
     JOIN exercises e ON s.exercise_id = e.id
     ORDER BY s.date DESC`
  );
  return rowsToSessions(rows);
}

export async function getSessionsForExercise(
  db: DB,
  exerciseName: string
): Promise<Session[]> {
  const rows = await db.all<SessionRow>(
    `SELECT s.date, e.name AS exercise_name, s.exercise_id, s.sets_json, s.targets_json
     FROM sessions s
     JOIN exercises e ON s.exercise_id = e.id
     WHERE e.name = ? ORDER BY s.date DESC`,
    [exerciseName]
  );
  return rowsToSessions(rows);
}

export async function getSessionByDate(db: DB, date: string): Promise<Session | null> {
  const rows = await db.all<SessionRow>(
    `SELECT s.date, e.name AS exercise_name, s.exercise_id, s.sets_json, s.targets_json 
     FROM sessions s
     JOIN exercises e ON s.exercise_id = e.id
     WHERE s.date = ?`,
    [date]
  );
  const sessions = rowsToSessions(rows);
  return sessions[0] ?? null;
}
