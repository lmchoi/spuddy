import type { DB } from './storage';
import type { Program } from './types';
import { parseProgramFromBackup } from './programParser';
import { saveProgram } from './programStorage';

type ImportResult =
  | { success: true; program: Program }
  | { success: false; error: string };

export async function importProgramFromJson(db: DB, json: unknown): Promise<ImportResult> {
  const parsed = parseProgramFromBackup(json);
  if ('error' in parsed) {
    return { success: false, error: parsed.error };
  }
  await saveProgram(db, parsed);
  return { success: true, program: parsed };
}
