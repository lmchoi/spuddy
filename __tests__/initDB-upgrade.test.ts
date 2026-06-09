import BetterSqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/db/schema';
import { seedMigrationsIfNeeded, seedLibraryMatches } from '../src/storage';

// Simulates a database left by the pre-Drizzle app: all tables exist
// but __drizzle_migrations does not (Drizzle was not managing migrations yet).
function buildOldSchemaDB() {
  const sqlite = new BetterSqlite(':memory:');
  sqlite.exec(`
    CREATE TABLE exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      sets_json TEXT NOT NULL,
      targets_json TEXT NOT NULL
    );
    CREATE TABLE programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active_day_index INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE program_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id),
      day_index INTEGER NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE program_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_day_id INTEGER NOT NULL REFERENCES program_days(id),
      exercise_index INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      targets_json TEXT NOT NULL
    );
  `);
  // seed existing user data
  sqlite.prepare('INSERT INTO exercises (name) VALUES (?)').run('Squat');
  sqlite.prepare(
    'INSERT INTO sessions (date, exercise_id, sets_json, targets_json) VALUES (?,?,?,?)'
  ).run('2025-01-01', 1, '[{"reps":5,"weight":100,"isWarmup":false,"isBodyweight":false}]', '[]');
  return sqlite;
}

describe('seedMigrationsIfNeeded', () => {
  it('allows the Drizzle migrator to skip migration 0000 on an existing schema', () => {
    const sqlite = buildOldSchemaDB();
    seedMigrationsIfNeeded(
      sql => sqlite.prepare(sql).get() as Record<string, unknown> | undefined,
      (sql, ...params) => { sqlite.prepare(sql).run(...params); }
    );
    const db = drizzle(sqlite, { schema });
    // Without seeding, this would throw "table already exists".
    expect(() => migrate(db, { migrationsFolder: './drizzle' })).not.toThrow();
  });

  it('preserves existing user data after the upgrade', () => {
    const sqlite = buildOldSchemaDB();
    seedMigrationsIfNeeded(
      sql => sqlite.prepare(sql).get() as Record<string, unknown> | undefined,
      (sql, ...params) => { sqlite.prepare(sql).run(...params); }
    );
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
    const exercises = db.select().from(schema.exercises).all();
    expect(exercises[0].name).toBe('Squat');
    const sessions = db.select().from(schema.sessions).all();
    expect(sessions).toHaveLength(1);
  });

  it('does nothing on a fresh DB (no exercises table)', () => {
    const sqlite = new BetterSqlite(':memory:');
    expect(() => seedMigrationsIfNeeded(
      sql => sqlite.prepare(sql).get() as Record<string, unknown> | undefined,
      (sql, ...params) => { sqlite.prepare(sql).run(...params); }
    )).not.toThrow();
    const row = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'"
    ).get();
    expect(row).toBeUndefined();
  });

  it('migration 0002 runs without error on a DB with existing exercises', () => {
    const sqlite = buildOldSchemaDB();
    seedMigrationsIfNeeded(
      sql => sqlite.prepare(sql).get() as Record<string, unknown> | undefined,
      (sql, ...params) => { sqlite.prepare(sql).run(...params); }
    );
    const db = drizzle(sqlite, { schema });
    expect(() => migrate(db, { migrationsFolder: './drizzle' })).not.toThrow();
  });

  it('migration 0002 leaves existing exercise rows unchanged with null new columns', () => {
    const sqlite = buildOldSchemaDB();
    seedMigrationsIfNeeded(
      sql => sqlite.prepare(sql).get() as Record<string, unknown> | undefined,
      (sql, ...params) => { sqlite.prepare(sql).run(...params); }
    );
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
    const rows = db.select().from(schema.exercises).all();
    expect(rows[0].name).toBe('Squat');
    expect(rows[0].muscleGroups).toBeNull();
    expect(rows[0].equipment).toBeNull();
    expect(rows[0].libraryId).toBeNull();
    expect(rows[0].libraryConfidence).toBeNull();
  });

  it('seedLibraryMatches populates columns for an exercise with an exact name match', () => {
    const sqlite = new BetterSqlite(':memory:');
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
    // Insert an exercise whose name exists in the library
    sqlite.prepare('INSERT INTO exercises (name) VALUES (?)').run('Barbell Squat');
    seedLibraryMatches(db as any);
    const row = sqlite.prepare('SELECT library_id, muscle_groups, equipment, library_confidence FROM exercises WHERE name = ?').get('Barbell Squat') as any;
    expect(row.library_id).toBe('Barbell_Squat');
    expect(JSON.parse(row.muscle_groups)).toContain('quadriceps');
    expect(row.equipment).toBe('barbell');
    expect(row.library_confidence).toBe(100);
  });

  it('seedLibraryMatches leaves unmatched exercises with null library columns', () => {
    const sqlite = new BetterSqlite(':memory:');
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
    sqlite.prepare('INSERT INTO exercises (name) VALUES (?)').run('Unknown Exercise XYZ');
    seedLibraryMatches(db as any);
    const row = sqlite.prepare('SELECT library_id, muscle_groups FROM exercises WHERE name = ?').get('Unknown Exercise XYZ') as any;
    expect(row.library_id).toBeNull();
    expect(row.muscle_groups).toBeNull();
  });

  it('seedLibraryMatches is atomic — no rows written if an error is thrown mid-loop', () => {
    const sqlite = new BetterSqlite(':memory:');
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
    sqlite.prepare('INSERT INTO exercises (name) VALUES (?)').run('Barbell Squat');
    sqlite.prepare('INSERT INTO exercises (name) VALUES (?)').run('Barbell Bench Press - Medium Grip');
    // Intercept exactMatch to throw after the first successful match
    const libraryModule = require('../src/domain/exerciseLibrary');
    let callCount = 0;
    jest.spyOn(libraryModule, 'exactMatch').mockImplementation((name: unknown) => {
      callCount++;
      if (callCount === 2) throw new Error('simulated failure');
      return callCount === 1 ? { id: 'x', primaryMuscles: [], equipment: null } : null;
    });
    expect(() => seedLibraryMatches(db as any)).toThrow('simulated failure');
    jest.restoreAllMocks();
    const rows = sqlite.prepare('SELECT library_id FROM exercises').all() as any[];
    expect(rows.every((r: any) => r.library_id === null)).toBe(true);
  });

  it('does nothing when __drizzle_migrations already exists', () => {
    const sqlite = buildOldSchemaDB();
    // Run migrator once to set up __drizzle_migrations (fresh DB to avoid the "exists" error)
    const freshSqlite = new BetterSqlite(':memory:');
    const freshDb = drizzle(freshSqlite, { schema });
    migrate(freshDb, { migrationsFolder: './drizzle' });
    // Now seed an existing DB that already has __drizzle_migrations
    sqlite.exec(`CREATE TABLE __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash text NOT NULL, created_at numeric)`);
    sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?,?)').run('', 1780135301055);
    expect(() => seedMigrationsIfNeeded(
      sql => sqlite.prepare(sql).get() as Record<string, unknown> | undefined,
      (sql, ...params) => { sqlite.prepare(sql).run(...params); }
    )).not.toThrow();
    const count = (sqlite.prepare('SELECT COUNT(*) AS n FROM __drizzle_migrations').get() as { n: number }).n;
    expect(count).toBe(1); // no duplicate inserted
  });
});
