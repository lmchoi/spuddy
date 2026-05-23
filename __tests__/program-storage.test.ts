import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { saveProgram, getProgram, getProgramDay } from '../src/programStorage';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
}

describe('program schema', () => {
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  it('creates programs, program_days, and program_exercises tables', async () => {
    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = tables.map(t => t.name);
    expect(names).toContain('programs');
    expect(names).toContain('program_days');
    expect(names).toContain('program_exercises');
  });

  it('saveProgram stub is callable without throwing', async () => {
    await expect(
      saveProgram(db, { name: 'Test', days: [], activeDayIndex: 0 })
    ).resolves.toBeUndefined();
  });

  it('getProgram stub returns null', async () => {
    await expect(getProgram(db)).resolves.toBeNull();
  });

  it('getProgramDay stub returns null', async () => {
    await expect(getProgramDay(db, 1)).resolves.toBeNull();
  });
});
