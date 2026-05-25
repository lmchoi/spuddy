import type { DB } from './storage';
import type { Program } from './types';

type ImportResult =
  | { success: true; sessionsImported: number; programs: Program[] }
  | { success: false; error: string };

// Stub — replaced in step 4 with real persistence logic
export async function importFromStrong(
  _db: DB,
  _text: string,
  _selectedWorkoutNames: string[],
  _unit: 'kg' | 'lbs'
): Promise<ImportResult> {
  return { success: true, sessionsImported: 0, programs: [] };
}
