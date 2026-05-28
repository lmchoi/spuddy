import type { ExerciseEntry, WorkingSet } from '../types';

export function workingSets(entry: ExerciseEntry): WorkingSet[] {
  return entry.sets.filter(s => !s.isWarmup);
}

export function warmupSets(entry: ExerciseEntry): WorkingSet[] {
  return entry.sets.filter(s => s.isWarmup);
}
