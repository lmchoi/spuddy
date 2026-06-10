import type { DrizzleDB } from './storage';
import type { Program } from './types';
import { parseProgramFromBackup } from './programParser';
import { savePrograms } from './programStorage';
import { parseHistoryFromBackup } from './liftosaurParser';
import { saveSession } from './storage';
import { sql } from 'drizzle-orm';

type ImportResult =
  | { success: true; programs: Program[]; sessionsImported: number }
  | { success: false; error: string };

export async function importProgramFromJson(db: DrizzleDB, json: unknown): Promise<ImportResult> {
  const parsed = parseProgramFromBackup(json);
  if ('error' in parsed) {
    return { success: false, error: parsed.error };
  }
  await importPrograms(db, parsed);

  const sessions = parseHistoryFromBackup(json);
  let sessionsImported = 0;
  if (Array.isArray(sessions)) {
    for (const session of sessions) {
      const firstSourceId = session.sourceId ? `${session.sourceId}_0` : null;
      const rows = firstSourceId
        ? db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM sessions WHERE source = 'liftosaur' AND source_id = ${firstSourceId}`)
        : [];
      const isNew = (rows[0]?.n ?? 0) === 0;
      await saveSession(db, session);
      if (isNew) sessionsImported++;
    }
  }

  return { success: true, programs: parsed, sessionsImported };
}

export async function importPrograms(db: DrizzleDB, programs: Program[]): Promise<void> {
  await savePrograms(db, programs);
}
