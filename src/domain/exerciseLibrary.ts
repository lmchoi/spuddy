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

export function exactMatch(name: string): LibraryExercise | null {
  return byName.get(name.toLowerCase()) ?? null;
}


