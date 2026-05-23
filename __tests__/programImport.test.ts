import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { importProgramFromJson } from '../src/programImport';
import { getPrograms } from '../src/programStorage';
import * as fs from 'fs';
import * as path from 'path';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
}

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/liftosaur-backup.json'), 'utf8')
);

describe('importProgramFromJson', () => {
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  it('imports all programs from fixture JSON into storage', async () => {
    const result = await importProgramFromJson(db, fixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.programs.length).toBeGreaterThan(0);
    expect(result.programs[0].name).toBe('v1');

    const stored = await getPrograms(db);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].name).toBe('v1');
    expect(stored[0].days).toHaveLength(3);
  });

  it('importing again replaces all existing programs', async () => {
    await importProgramFromJson(db, fixture);
    await importProgramFromJson(db, fixture);

    const stored = await getPrograms(db);
    const rows = await db.all<{ count: number }>('SELECT COUNT(*) AS count FROM programs');
    expect(rows[0].count).toBe(stored.length);
  });

  it('returns error and leaves storage unchanged for malformed input', async () => {
    const result = await importProgramFromJson(db, { not: 'a backup' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeTruthy();

    const stored = await getPrograms(db);
    expect(stored).toHaveLength(0);
  });

  it('returns error for null input without throwing', async () => {
    const result = await importProgramFromJson(db, null);
    expect(result.success).toBe(false);
  });
});
