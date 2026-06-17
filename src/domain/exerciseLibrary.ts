import rawLibrary from '../data/exercises.json';
import type { ExerciseLibraryRow } from '../exerciseStorage';

export interface LibraryExercise {
  id: string;
  name: string;
  force: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string | null;
  category: string;
  level: string;
}

const library = rawLibrary as LibraryExercise[];

const byName = new Map<string, LibraryExercise>(
  library.map(e => [e.name.toLowerCase(), e])
);

const byId = new Map<string, LibraryExercise>(
  library.map(e => [e.id, e])
);

export function exactMatch(name: string): LibraryExercise | null {
  return byName.get(name.toLowerCase()) ?? null;
}

export function matchById(id: string): LibraryExercise | null {
  return byId.get(id) ?? null;
}

export function renameLibraryEntry(
  map: Map<string, ExerciseLibraryRow>,
  oldName: string,
  newName: string,
): Map<string, ExerciseLibraryRow> {
  if (oldName === newName) return map;
  const row = map.get(oldName);
  if (!row) return map;
  const next = new Map(map);
  next.delete(oldName);
  next.set(newName, row);
  return next;
}

export function parseMuscleGroups(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

