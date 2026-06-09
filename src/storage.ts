import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate as drizzleMigrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { eq, desc, asc, sql, isNull } from 'drizzle-orm';
import * as schema from './db/schema';
import { exercises, sessions } from './db/schema';
import { migrations } from './db/migrations';
import type { Session, Target, WorkingSet } from './types';
export type DrizzleDB = BaseSQLiteDatabase<'sync', any, typeof schema>;

// Exported for testing; called with raw SQLite accessors to stay adapter-agnostic.
export function seedMigrationsIfNeeded(
  getFirst: (sql: string) => Record<string, unknown> | null | undefined,
  run: (sql: string, ...params: unknown[]) => void
): void {
  const hasExercises = getFirst("SELECT name FROM sqlite_master WHERE type='table' AND name='exercises'");
  const hasMigrations = getFirst("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'");
  if (!hasExercises || hasMigrations) return;
  // Pre-Drizzle schema detected: seed the migrations table so Drizzle's migrator
  // skips migration 0000 (which uses bare CREATE TABLE) on existing tables.
  run('CREATE TABLE __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash text NOT NULL, created_at numeric)');
  run('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', '', 1780135301055);
}

export function seedLibraryMatches(db: DrizzleDB): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { exactMatch } = require('./domain/exerciseLibrary') as typeof import('./domain/exerciseLibrary');
  const rows = db.select({
    id: exercises.id,
    name: exercises.name,
  }).from(exercises).where(isNull(exercises.libraryId)).all();

  db.transaction(tx => {
    for (const row of rows) {
      const match = exactMatch(row.name);
      if (!match) continue;
      tx.update(exercises)
        .set({
          libraryId: match.id,
          muscleGroups: JSON.stringify(match.primaryMuscles),
          equipment: match.equipment,
          libraryConfidence: 100,
        })
        .where(eq(exercises.id, row.id))
        .run();
    }
  });
}

export async function initDB(): Promise<DrizzleDB> {
  const client = SQLite.openDatabaseSync('spuddy.db');
  seedMigrationsIfNeeded(
    (q) => client.getFirstSync(q) as Record<string, unknown> | null,
    (q, ...params) => client.runSync(q, ...(params as SQLite.SQLiteBindValue[]))
  );
  const db = drizzle(client, { schema });
  await drizzleMigrate(db, migrations);
  seedLibraryMatches(db);
  return db;
}

export function resolveOrCreateExercise(db: DrizzleDB, name: string): number {
  const existing = db.all<{ id: number }>(sql`SELECT id FROM exercises WHERE name = ${name}`);
  if (existing[0]) return existing[0].id;
  const row = db.insert(exercises).values({ name }).returning({ id: exercises.id }).get()!;
  return row.id;
}

export async function sessionExists(db: DrizzleDB, date: string): Promise<boolean> {
  const rows = db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM sessions WHERE date = ${date}`);
  return (rows[0]?.n ?? 0) > 0;
}

export async function hasAnySessions(db: DrizzleDB): Promise<boolean> {
  const rows = db.all(sql`SELECT 1 FROM sessions LIMIT 1`);
  return rows.length > 0;
}

export async function saveSession(db: DrizzleDB, session: Session): Promise<void> {
  db.transaction(tx => {
    for (const entry of session.exercises) {
      const exerciseId = resolveOrCreateExercise(tx as DrizzleDB, entry.name);
      (tx as DrizzleDB).insert(sessions).values({
        date: session.date,
        exerciseId,
        setsJson: JSON.stringify(entry.sets),
        targetsJson: JSON.stringify(entry.targets),
      }).run();
    }
  });
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

export async function getAllSessions(db: DrizzleDB): Promise<Session[]> {
  const rows = await db
    .select({
      date: sessions.date,
      exercise_name: exercises.name,
      exercise_id: sessions.exerciseId,
      sets_json: sessions.setsJson,
      targets_json: sessions.targetsJson,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .orderBy(desc(sessions.date), asc(sessions.id));
  return rowsToSessions(rows as SessionRow[]);
}

export async function getSessionsForExercise(
  db: DrizzleDB,
  exerciseName: string
): Promise<Session[]> {
  const rows = await db
    .select({
      date: sessions.date,
      exercise_name: exercises.name,
      exercise_id: sessions.exerciseId,
      sets_json: sessions.setsJson,
      targets_json: sessions.targetsJson,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(eq(exercises.name, exerciseName))
    .orderBy(desc(sessions.date), asc(sessions.id));
  return rowsToSessions(rows as SessionRow[]);
}

export async function getSessionByDate(db: DrizzleDB, date: string): Promise<Session | null> {
  const rows = await db
    .select({
      date: sessions.date,
      exercise_name: exercises.name,
      exercise_id: sessions.exerciseId,
      sets_json: sessions.setsJson,
      targets_json: sessions.targetsJson,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(eq(sessions.date, date))
    .orderBy(asc(sessions.id));
  const result = rowsToSessions(rows as SessionRow[]);
  return result[0] ?? null;
}
