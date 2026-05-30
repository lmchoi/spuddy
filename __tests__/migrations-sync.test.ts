import * as fs from 'fs';
import * as path from 'path';
import { migrations } from '../src/db/migrations';

// Verifies that src/db/migrations.ts matches the drizzle/ SQL files.
// If drizzle-kit generates a new migration but migrations.ts is not updated,
// the production app silently skips the migration while tests pass.
describe('migrations.ts sync with drizzle/ folder', () => {
  const drizzleDir = path.join(__dirname, '..', 'drizzle');
  const journal = JSON.parse(
    fs.readFileSync(path.join(drizzleDir, 'meta', '_journal.json'), 'utf8')
  ) as { entries: Array<{ idx: number; tag: string }> };

  it('has an entry in migrations.ts for every migration in drizzle/', () => {
    const bundledKeys = Object.keys(migrations.migrations);
    const expectedKeys = journal.entries.map(e => `m${String(e.idx).padStart(4, '0')}`);
    expect(bundledKeys.sort()).toEqual(expectedKeys.sort());
  });

  it('bundled SQL matches the drizzle/ .sql files for each migration', () => {
    for (const entry of journal.entries) {
      const key = `m${String(entry.idx).padStart(4, '0')}` as keyof typeof migrations.migrations;
      const bundledSQL: string = migrations.migrations[key];
      const fileSQL = fs.readFileSync(
        path.join(drizzleDir, `${entry.tag}.sql`),
        'utf8'
      );
      // Normalise line endings before comparing
      expect(bundledSQL.replace(/\r\n/g, '\n').trim()).toBe(
        fileSQL.replace(/\r\n/g, '\n').trim()
      );
    }
  });
});
