#!/usr/bin/env node
// Reads drizzle/meta/_journal.json and the SQL files, writes src/db/migrations.ts.
// Run after `drizzle-kit generate` to keep migrations.ts in sync.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const drizzleDir = path.join(root, 'drizzle');
const outFile = path.join(root, 'src', 'db', 'migrations.ts');

const journal = JSON.parse(
  fs.readFileSync(path.join(drizzleDir, 'meta', '_journal.json'), 'utf8')
);

const journalEntries = journal.entries
  .map(e => `      { idx: ${e.idx}, when: ${e.when}, tag: '${e.tag}', breakpoints: ${e.breakpoints} },`)
  .join('\n');

const sqlEntries = journal.entries
  .map(e => {
    const key = `m${String(e.idx).padStart(4, '0')}`;
    const sql = fs.readFileSync(path.join(drizzleDir, `${e.tag}.sql`), 'utf8').trim();
    const escaped = sql.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `    ${key}: \`${escaped}\`,`;
  })
  .join('\n');

const output = `export const migrations = {
  journal: {
    entries: [
${journalEntries}
    ],
  },
  migrations: {
${sqlEntries}
  },
};
`;

fs.writeFileSync(outFile, output);
console.log(`wrote ${outFile} (${journal.entries.length} migrations)`);
