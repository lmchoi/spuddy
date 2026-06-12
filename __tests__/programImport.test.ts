import { type DrizzleDB } from '../src/storage';
import { importProgramFromJson } from '../src/programImport';
import { getPrograms, importPrograms, savePrograms } from '../src/programStorage';
import * as fs from 'fs';
import * as path from 'path';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/liftosaur-backup.json'), 'utf8')
);

describe('importProgramFromJson', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
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

  it('leaves existing Spuddy-only programs untouched', async () => {
    await savePrograms(db, [{ name: 'Spuddy PPL', activeDayIndex: 0, days: [] }]);
    
    await importProgramFromJson(db, fixture);

    const stored = await getPrograms(db);
    const spuddyProgram = stored.find((p) => p.name === 'Spuddy PPL');
    expect(spuddyProgram).toBeDefined();
    
    const importedProgram = stored.find((p) => p.name === 'v1');
    expect(importedProgram).toBeDefined();
  });

  it('allows duplicate names and coexists distinct programs on import twice', async () => {
    await importProgramFromJson(db, fixture);
    
    // Fake a small delay to simulate timestamps being distinct
    // Though makeInMemoryDB and sql`(unixepoch() * 1000)` might just get the same ms if it's too fast,
    // actually drizzle SQLite handles default timestamps. Let's just do a second import.
    await importProgramFromJson(db, fixture);

    const stored = await getPrograms(db);
    
    // Since fixture has 'v1' and 'another', importing twice means we should have two 'v1's.
    const v1Programs = stored.filter((p) => p.name === 'v1');
    expect(v1Programs).toHaveLength(2);
    
    // We expect both to have their own days
    expect(v1Programs[0].days).toHaveLength(3);
    expect(v1Programs[1].days).toHaveLength(3);
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

  it('rolls back completely if a program fails to insert', async () => {
    const badPrograms = [
      { name: 'valid', activeDayIndex: 0, days: [] },
      { name: 'invalid', activeDayIndex: 0, days: null as unknown as any[] } // will throw in loop
    ];
    
    expect(() => importPrograms(db, badPrograms)).toThrow();

    const stored = await getPrograms(db);
    expect(stored).toHaveLength(0); // The 'valid' program should have been rolled back
  });
});
