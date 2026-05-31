import type { DrizzleDB } from './storage';
import type { ParsedNotes, ParsedExercise } from './notesParser';
import type { Program, ProgramDay, ProgramExercise } from './types';
import { savePrograms } from './programStorage';

export type NotesImportResult =
  | { success: true; programsCreated: number }
  | { success: false; error: string };

// Defaults applied here — this is the only place ParsedExercise nulls become concrete values.
// To make these user-configurable, add an optional defaults param to importFromNotes and thread
// it through to exerciseToProgram. No other files need to change.
const DEFAULT_SETS = 6;
const DEFAULT_REPS = 10;
const DEFAULT_REST_SECONDS = 60;

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
    const programs: Program[] = parsedNotes.sections
      .filter(s => s.exercises.length > 0)
      .map(section => {
        const exercises: ProgramExercise[] = section.exercises.map(exerciseToProgram);
        const day: ProgramDay = { name: section.name, exercises };
        return { name: section.name, days: [day], activeDayIndex: 0 };
      });

    if (programs.length === 0) return { success: true, programsCreated: 0 };
    await savePrograms(db, programs);
    return { success: true, programsCreated: programs.length };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
