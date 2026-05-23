import type { ExerciseEntry, Target, WorkingSet } from '../types';

export type OnTargetStatus = 'hit' | 'below' | 'exceeded' | 'no-target';

export function getSetStatus(set: WorkingSet, target: Target | undefined): OnTargetStatus {
  if (!target) return 'no-target';
  const minReps = target.minReps ?? target.reps;
  const repsOk = set.reps >= minReps;
  const weightOk = target.weight === undefined || set.weight >= target.weight;
  if (!repsOk || !weightOk) return 'below';
  if (set.reps > target.reps || (target.weight !== undefined && set.weight > target.weight))
    return 'exceeded';
  return 'hit';
}

export function getEntryStatus(entry: ExerciseEntry): OnTargetStatus {
  const working = entry.sets.filter(s => !s.isWarmup);
  if (working.length === 0 || entry.targets.length === 0) return 'no-target';
  const statuses = working.map((s, i) => getSetStatus(s, entry.targets[i]));
  if (statuses.some(s => s === 'below')) return 'below';
  if (statuses.every(s => s === 'exceeded')) return 'exceeded';
  return 'hit';
}

export const STATUS_LABEL: Record<OnTargetStatus, string> = {
  hit: '✓',
  below: '↓',
  exceeded: '↑',
  'no-target': '–',
};
