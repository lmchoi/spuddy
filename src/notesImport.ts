import type { DB } from './storage';
import type { ParsedNotes } from './notesParser';

export type NotesImportResult =
  | { success: true; programsCreated: number }
  | { success: false; error: string };

export async function importFromNotes(
  _db: DB,
  _parsedNotes: ParsedNotes,
  _unit: 'kg' | 'lbs'
): Promise<NotesImportResult> {
  return { success: true, programsCreated: 0 };
}
