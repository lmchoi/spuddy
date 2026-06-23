import rawLibrary from '../data/exercises.json';

interface LibraryEntry {
  name: string;
  id: string;
}

const libraryEntries = (rawLibrary as LibraryEntry[]).map(e => ({
  name: e.name,
  libraryId: e.id,
}));

export interface LibrarySearchResult {
  name: string;
  libraryId: string;
}

export function searchLibrary(query: string): LibrarySearchResult[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  return libraryEntries
    .filter(e => e.name.toLowerCase().includes(lower))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 20);
}
