import rawLibrary from '../data/exercises.json';

interface LibraryEntry {
  name: string;
}

const libraryNames: string[] = (rawLibrary as LibraryEntry[]).map(e => e.name);

export interface ExercisePickerResults {
  history: string[];
  library: string[];
}

export function searchExercisePicker(
  historyNames: string[],
  query: string,
): ExercisePickerResults {
  if (!query) {
    return { history: historyNames, library: [] };
  }

  const lower = query.toLowerCase();
  const historySet = new Set(historyNames.map(n => n.toLowerCase()));

  const history = historyNames.filter(n => n.toLowerCase().includes(lower));

  const library = libraryNames
    .filter(n => !historySet.has(n.toLowerCase()) && n.toLowerCase().includes(lower))
    .sort((a, b) => a.localeCompare(b));

  return { history, library };
}
