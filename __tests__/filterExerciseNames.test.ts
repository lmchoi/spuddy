import { filterExerciseNames } from '../src/domain/filterExerciseNames';

describe('filterExerciseNames', () => {
  const names = ['Barbell Squat', 'Bench Press', 'Cable Fly', 'Deadlift', 'Pull-up'];

  it('returns full list when query is empty', () => {
    expect(filterExerciseNames(names, '')).toEqual(names);
  });

  it('matches mid-word substring case-insensitively', () => {
    expect(filterExerciseNames(names, 'ench')).toEqual(['Bench Press']);
  });

  it('is case-insensitive', () => {
    expect(filterExerciseNames(names, 'SQUAT')).toEqual(['Barbell Squat']);
  });

  it('returns [] when nothing matches', () => {
    expect(filterExerciseNames(names, 'zzzz')).toEqual([]);
  });

  it('preserves alphabetical order from source array', () => {
    expect(filterExerciseNames(names, 'l')).toEqual(['Barbell Squat', 'Cable Fly', 'Deadlift', 'Pull-up']);
  });
});
