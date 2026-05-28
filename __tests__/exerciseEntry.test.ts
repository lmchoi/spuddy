import { workingSets, warmupSets } from '../src/domain/exerciseEntry';
import type { ExerciseEntry } from '../src/types';

const entry: ExerciseEntry = {
  name: 'Squat',
  targets: [{ reps: 5, weight: 100 }],
  sets: [
    { reps: 5, weight: 60, isWarmup: true, isBodyweight: false },
    { reps: 5, weight: 80, isWarmup: true, isBodyweight: false },
    { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
    { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
  ],
};

describe('workingSets', () => {
  it('returns only non-warmup sets', () => {
    const result = workingSets(entry);
    expect(result).toHaveLength(2);
    expect(result.every(s => !s.isWarmup)).toBe(true);
  });

  it('returns empty array when all sets are warmups', () => {
    const warmupOnly: ExerciseEntry = { ...entry, sets: entry.sets.filter(s => s.isWarmup) };
    expect(workingSets(warmupOnly)).toEqual([]);
  });
});

describe('warmupSets', () => {
  it('returns only warmup sets', () => {
    const result = warmupSets(entry);
    expect(result).toHaveLength(2);
    expect(result.every(s => s.isWarmup)).toBe(true);
  });

  it('returns empty array when no warmups', () => {
    const noWarmups: ExerciseEntry = { ...entry, sets: entry.sets.filter(s => !s.isWarmup) };
    expect(warmupSets(noWarmups)).toEqual([]);
  });
});
