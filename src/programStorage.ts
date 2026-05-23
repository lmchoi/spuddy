import type { DB } from './storage';
import type { Program, ProgramDay } from './types';

export async function saveProgram(_db: DB, _program: Program): Promise<void> {
  // stub — real implementation in Step 4
}

export async function getProgram(_db: DB): Promise<Program | null> {
  return null;
}

export async function getProgramDay(_db: DB, _dayId: number): Promise<ProgramDay | null> {
  return null;
}
