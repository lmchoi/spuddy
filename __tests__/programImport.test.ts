import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { importProgramFromJson } from '../src/programImport';
import { getProgram } from '../src/programStorage';
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

  it('imports fixture JSON and program appears in storage', async () => {
    const result = await importProgramFromJson(db, fixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.program.name).toBe('v1');
    expect(result.program.days).toHaveLength(3);

    const stored = await getProgram(db);
    expect(stored).not.toBeNull();
    expect(stored!.name).toBe('v1');
    expect(stored!.days).toHaveLength(3);
  });

  it('importing again replaces the existing program', async () => {
    await importProgramFromJson(db, fixture);
    await importProgramFromJson(db, fixture);

    const stored = await getProgram(db);
    expect(stored!.name).toBe('v1');
    // Only one program row should exist
    const rows = await db.all<{ count: number }>('SELECT COUNT(*) AS count FROM programs');
    expect(rows[0].count).toBe(1);
  });

  it('returns error and leaves storage unchanged for malformed input', async () => {
    const result = await importProgramFromJson(db, { not: 'a backup' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBeTruthy();

    const stored = await getProgram(db);
    expect(stored).toBeNull();
  });

  it('returns error for null input without throwing', async () => {
    const result = await importProgramFromJson(db, null);
    expect(result.success).toBe(false);
  });
});
