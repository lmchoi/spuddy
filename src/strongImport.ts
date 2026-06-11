import type { DrizzleDB } from './storage';
import { saveSession } from './storage';
import type { Program, ProgramExercise, Target, Session } from './types';
import { insertPrograms } from './programStorage';
import { parseStrongCsv } from './strongParser';

const LBS_TO_KG = 0.45359237;

type ImportResult =
  | { success: true; sessionsImported: number; programs: Program[] }
  | { success: false; error: string };

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function importFromStrong(
  db: DrizzleDB,
  text: string,
  selectedWorkoutNames: string[],
  unit: 'kg' | 'lbs'
): Promise<ImportResult> {
  try {
    const history = parseStrongCsv(text);

    if (history.workoutGroups.length === 0 && text.trim().length > 0) {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        return { success: false, error: 'No workout data found in file.' };
      }
    }

    // Collect all sessions across all groups
    const allSessions: Session[] = [];
    for (const group of history.workoutGroups) {
      for (const session of group.sessions) {
        const converted = unit === 'lbs' ? convertSessionWeights(session) : session;
        allSessions.push(converted);
      }
    }

    // Merge sessions by date (same date → merge exercises)
    const sessionsByDate = new Map<string, Session>();
    for (const session of allSessions) {
      if (!sessionsByDate.has(session.date)) {
        sessionsByDate.set(session.date, { date: session.date, exercises: [] });
      }
      const merged = sessionsByDate.get(session.date)!;
      for (const exercise of session.exercises) {
        const existing = merged.exercises.find(e => e.name === exercise.name);
        if (existing) {
          existing.sets.push(...exercise.sets);
        } else {
          merged.exercises.push(exercise);
        }
      }
    }

    for (const session of sessionsByDate.values()) {
      await saveSession(db, session);
    }

    const sessionsImported = sessionsByDate.size;

    // Infer programs from selected workout names
    const programs: Program[] = [];
    if (selectedWorkoutNames.length > 0) {
      const selectedSet = new Set(selectedWorkoutNames);

      for (const group of history.workoutGroups) {
        if (!selectedSet.has(group.name)) continue;

        // Find most recent session
        const sortedSessions = [...group.sessions].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        const latest = sortedSessions[0];
        if (!latest) continue;

        const convertedLatest = unit === 'lbs' ? convertSessionWeights(latest) : latest;

        const programExercises: ProgramExercise[] = convertedLatest.exercises
          .filter(exercise => exercise.sets.length > 0)
          .map(exercise => {
            const lastSet = exercise.sets[exercise.sets.length - 1];
            const targets: Target[] = exercise.sets.map(() => ({
              reps: lastSet.reps ?? 0,
              weight: lastSet.weight,
            }));
            return { name: exercise.name, targets };
          });

        programs.push({
          name: group.name,
          days: [{ name: group.name, exercises: programExercises }],
          activeDayIndex: 0,
        });
      }

      if (programs.length > 0) {
        await db.transaction((tx) => {
          insertPrograms(tx as DrizzleDB, programs);
        });
      }
    }

    return { success: true, sessionsImported, programs };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Import failed.' };
  }
}

function convertSessionWeights(session: Session): Session {
  return {
    ...session,
    exercises: session.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        weight: set.weight * LBS_TO_KG,
      })),
    })),
  };
}
