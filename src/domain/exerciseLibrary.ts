import rawLibrary from '../data/exercises.json';

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

export function lookupById(id: string): LibraryExercise | null {
  return byId.get(id) ?? null;
}

const LEG_MUSCLES = new Set(['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors']);
const PUSH_MUSCLES = new Set(['chest', 'triceps', 'shoulders']);
const PULL_MUSCLES = new Set(['lats', 'biceps', 'middle back', 'lower back', 'traps', 'forearms']);

export type MuscleCategory = 'push' | 'pull' | 'legs' | 'core';

export function classifyMuscle(muscle: string): MuscleCategory {
  if (LEG_MUSCLES.has(muscle)) return 'legs';
  if (PUSH_MUSCLES.has(muscle)) return 'push';
  if (PULL_MUSCLES.has(muscle)) return 'pull';
  return 'core';
}

