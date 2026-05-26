import type { DB } from './storage';
import type { ParsedNotes, ParsedExercise } from './notesParser';
import type { Program, ProgramDay, ProgramExercise } from './types';
import { savePrograms } from './programStorage';

export type NotesImportResult =
  | { success: true; programsCreated: number }
  | { success: false; error: string };

function exerciseToProgram(ex: ParsedExercise): ProgramExercise {
  const targets = Array.from({ length: ex.sets }, () => ({
    reps: 10,
    weight: ex.weight,
  }));
  return { name: ex.name, targets };
}

export async function importFromNotes(
  db: DB,
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

    await savePrograms(db, programs);
    return { success: true, programsCreated: programs.length };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
