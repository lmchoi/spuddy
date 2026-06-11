import type { DrizzleDB } from './storage';
import type { ParsedNotes, ParsedExercise } from './notesParser';
import { DEFAULT_REST_SECONDS } from './types';
import type { Program, ProgramDay, ProgramExercise } from './types';
import { insertPrograms } from './programStorage';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatImportDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export type NotesImportResult =
  | { success: true; programsCreated: number }
  | { success: false; error: string };

// Defaults applied here — this is the only place ParsedExercise nulls become concrete values.
// To make these user-configurable, add an optional defaults param to importFromNotes and thread
// it through to exerciseToProgram. No other files need to change.
const DEFAULT_SETS = 6;
const DEFAULT_REPS = 10;
const DEFAULT_PROGRAM_NAME = 'My Program';

function exerciseToProgram(ex: ParsedExercise): ProgramExercise {
  const sets = ex.sets ?? DEFAULT_SETS;
  const reps = ex.reps ?? DEFAULT_REPS;
  const targets = Array.from({ length: sets }, () => ({
    reps,
    weight: ex.weight,
    restSeconds: DEFAULT_REST_SECONDS,
  }));
  return { name: ex.name, targets };
}

export async function importFromNotes(
  db: DrizzleDB,
  parsedNotes: ParsedNotes
): Promise<NotesImportResult> {
  if (parsedNotes.sections.length === 0) {
    return { success: true, programsCreated: 0 };
  }

  try {
    const days: ProgramDay[] = parsedNotes.sections
      .filter(s => s.exercises.length > 0)
      .map(section => ({
        name: section.name,
        exercises: section.exercises.map(exerciseToProgram),
      }));

    if (days.length === 0) return { success: true, programsCreated: 0 };
    const name = `${DEFAULT_PROGRAM_NAME} – ${formatImportDate(new Date())}`;
    const program: Program = { name, days, activeDayIndex: 0 };
    await db.transaction((tx) => {
      insertPrograms(tx as DrizzleDB, [program]);
    });
    return { success: true, programsCreated: 1 };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
