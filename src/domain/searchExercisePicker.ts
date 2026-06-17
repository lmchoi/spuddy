import rawLibrary from '../data/exercises.json';

interface LibraryEntry {
  name: string;
  id: string;
}

const libraryEntries = (rawLibrary as LibraryEntry[]).map(e => ({
  name: e.name,
  libraryId: e.id,
}));

const MAX_LIBRARY_RESULTS = 20;

export interface ExercisePickerResults {
  history: string[];
  library: { name: string; libraryId: string }[];
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

  const library = libraryEntries
    .filter(e => !historySet.has(e.name.toLowerCase()) && e.name.toLowerCase().includes(lower))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_LIBRARY_RESULTS);

  return { history, library };
}
