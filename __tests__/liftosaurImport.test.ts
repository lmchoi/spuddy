import { importProgramFromJson } from '../src/programImport';
import { getAllSessions } from '../src/storage';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';
import * as fs from 'fs';
import * as path from 'path';

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/liftosaur-backup.json'), 'utf8')
);

describe('importProgramFromJson — liftosaur history', () => {
  let db: ReturnType<typeof makeInMemoryDB>;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('saves sessions from fixture history to DB', async () => {
    await importProgramFromJson(db, fixture);
    const sessions = await getAllSessions(db);
    expect(sessions.length).toBeGreaterThan(0);
  });

  it('returns sessionsImported equal to number of history records', async () => {
    const result = await importProgramFromJson(db, fixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.sessionsImported).toBe(4);
  });

  it('saved sessions have correct dates', async () => {
    await importProgramFromJson(db, fixture);
    const sessions = await getAllSessions(db);
    const dates = sessions.map(s => s.date);
    expect(dates).toContain('2026-05-19');
    expect(dates).toContain('2026-05-15');
  });

  it('re-importing produces no duplicate sessions', async () => {
    await importProgramFromJson(db, fixture);
    const firstCount = (await getAllSessions(db)).length;

    await importProgramFromJson(db, fixture);
    const secondCount = (await getAllSessions(db)).length;

    expect(secondCount).toBe(firstCount);
  });

  it('saved sessions use source liftosaur', async () => {
    // Query raw rows to verify source column
    await importProgramFromJson(db, fixture);
    const rows = db.all<{ source: string }>('SELECT DISTINCT source FROM sessions');
    expect(rows.map(r => r.source)).toContain('liftosaur');
  });

  it('returns sessionsImported of 0 on re-import', async () => {
    await importProgramFromJson(db, fixture);
    const result = await importProgramFromJson(db, fixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.sessionsImported).toBe(0);
  });

  it('returns historyWarning when history field is missing from backup', async () => {
    const noHistory = { programs: fixture.programs };
    const result = await importProgramFromJson(db, noHistory);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.historyWarning).toBeTruthy();
  });

  it('returns no historyWarning on a valid backup', async () => {
    const result = await importProgramFromJson(db, fixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.historyWarning).toBeUndefined();
  });
});
