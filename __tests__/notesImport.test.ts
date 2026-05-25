import BetterSqlite from 'better-sqlite3';
import { initSchema, makeTestDB, type DB } from '../src/storage';
import { importFromNotes } from '../src/notesImport';
import type { ParsedNotes } from '../src/notesParser';

function makeInMemoryDB(): DB {
  const sqlite = new BetterSqlite(':memory:');
  return makeTestDB(sqlite);
}

const EMPTY_PARSED: ParsedNotes = {
  sections: [],
  inferredUnit: null,
  skippedLines: 0,
};

describe('importFromNotes — contract shape', () => {
  let db: DB;

  beforeEach(async () => {
    db = makeInMemoryDB();
    await initSchema(db);
  });

  it('returns a result object with success flag', async () => {
    const result = await importFromNotes(db, EMPTY_PARSED, 'kg');
    expect(typeof result.success).toBe('boolean');
  });

  it('result has programsCreated count on success', async () => {
    const result = await importFromNotes(db, EMPTY_PARSED, 'kg');
    if (result.success) {
      expect(typeof result.programsCreated).toBe('number');
    }
  });
});
