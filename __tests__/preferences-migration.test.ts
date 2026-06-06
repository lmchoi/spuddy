import BetterSqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/db/schema';

function tableExists(sqlite: BetterSqlite.Database, name: string): boolean {
  const row = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
  return row !== undefined;
}

describe('preferences migration', () => {
  it('creates the preferences table on a fresh DB', () => {
    const sqlite = new BetterSqlite(':memory:');
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: './drizzle' });
    expect(tableExists(sqlite, 'preferences')).toBe(true);
  });

  it('creates the preferences table on a DB that already has data', () => {
    const sqlite = new BetterSqlite(':memory:');
    sqlite.exec(`
      CREATE TABLE exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
      CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, exercise_id INTEGER NOT NULL, sets_json TEXT NOT NULL, targets_json TEXT NOT NULL);
      CREATE TABLE programs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, active_day_index INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE program_days (id INTEGER PRIMARY KEY AUTOINCREMENT, program_id INTEGER NOT NULL, day_index INTEGER NOT NULL, name TEXT NOT NULL);
      CREATE TABLE program_exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, program_day_id INTEGER NOT NULL, exercise_index INTEGER NOT NULL, exercise_id INTEGER NOT NULL, targets_json TEXT NOT NULL);
      CREATE TABLE __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash text NOT NULL, created_at numeric);
    `);
    sqlite.prepare('INSERT INTO exercises (name) VALUES (?)').run('Squat');
    sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run('', 1780135301055); // migration 0
    sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run('', 1780221701055); // migration 1
    const db = drizzle(sqlite, { schema });
    expect(() => migrate(db, { migrationsFolder: './drizzle' })).not.toThrow();
    expect(tableExists(sqlite, 'preferences')).toBe(true);
  });
});
