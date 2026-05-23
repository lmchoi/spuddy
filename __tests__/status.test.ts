import { getSetStatus, getEntryStatus } from '../src/domain/status';
import type { Target, WorkingSet, ExerciseEntry } from '../src/types';

describe('Status logic', () => {
  describe('getSetStatus', () => {
    it('returns "no-target" if no target is provided', () => {
      const set: WorkingSet = { reps: 10, weight: 100, isWarmup: false, isBodyweight: false };
      expect(getSetStatus(set, undefined)).toBe('no-target');
    });

    it('returns "hit" if reps and weight match target exactly', () => {
      const set: WorkingSet = { reps: 10, weight: 100, isWarmup: false, isBodyweight: false };
      const target: Target = { reps: 10, weight: 100 };
      expect(getSetStatus(set, target)).toBe('hit');
    });

    it('returns "below" if reps are less than target', () => {
      const set: WorkingSet = { reps: 9, weight: 100, isWarmup: false, isBodyweight: false };
      const target: Target = { reps: 10, weight: 100 };
      expect(getSetStatus(set, target)).toBe('below');
    });

    it('returns "below" if weight is less than target', () => {
      const set: WorkingSet = { reps: 10, weight: 95, isWarmup: false, isBodyweight: false };
      const target: Target = { reps: 10, weight: 100 };
      expect(getSetStatus(set, target)).toBe('below');
    });

    it('returns "exceeded" if reps are more than target', () => {
      const set: WorkingSet = { reps: 11, weight: 100, isWarmup: false, isBodyweight: false };
      const target: Target = { reps: 10, weight: 100 };
      expect(getSetStatus(set, target)).toBe('exceeded');
    });

    it('returns "exceeded" if weight is more than target', () => {
      const set: WorkingSet = { reps: 10, weight: 105, isWarmup: false, isBodyweight: false };
      const target: Target = { reps: 10, weight: 100 };
      expect(getSetStatus(set, target)).toBe('exceeded');
    });

    it('respects minReps in range targets', () => {
      const target: Target = { reps: 12, minReps: 8, weight: 100 };
      expect(getSetStatus({ reps: 7, weight: 100, isWarmup: false, isBodyweight: false }, target)).toBe('below');
      expect(getSetStatus({ reps: 8, weight: 100, isWarmup: false, isBodyweight: false }, target)).toBe('hit');
      expect(getSetStatus({ reps: 12, weight: 100, isWarmup: false, isBodyweight: false }, target)).toBe('hit');
      expect(getSetStatus({ reps: 13, weight: 100, isWarmup: false, isBodyweight: false }, target)).toBe('exceeded');
    });
  });

  describe('getEntryStatus', () => {
    it('returns "hit" if all working sets hit targets', () => {
      const entry: ExerciseEntry = {
        name: 'Squat',
        sets: [
          { reps: 10, weight: 100, isWarmup: false, isBodyweight: false },
          { reps: 10, weight: 100, isWarmup: false, isBodyweight: false },
        ],
        targets: [
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
        ],
      };
      expect(getEntryStatus(entry)).toBe('hit');
    });

    it('returns "below" if any working set is below target', () => {
      const entry: ExerciseEntry = {
        name: 'Squat',
        sets: [
          { reps: 10, weight: 100, isWarmup: false, isBodyweight: false },
          { reps: 9, weight: 100, isWarmup: false, isBodyweight: false },
        ],
        targets: [
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
        ],
      };
      expect(getEntryStatus(entry)).toBe('below');
    });

    it('ignores warmup sets', () => {
      const entry: ExerciseEntry = {
        name: 'Squat',
        sets: [
          { reps: 5, weight: 60, isWarmup: true, isBodyweight: false },
          { reps: 10, weight: 100, isWarmup: false, isBodyweight: false },
        ],
        targets: [
          { reps: 10, weight: 100 },
        ],
      };
      expect(getEntryStatus(entry)).toBe('hit');
    });
  });
});
