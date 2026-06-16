export function filterExerciseNames(names: string[], query: string): string[] {
  if (!query) return names;
  const lower = query.toLowerCase();
  return names.filter(n => n.toLowerCase().includes(lower));
}
