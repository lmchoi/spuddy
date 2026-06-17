import { searchExercisePicker } from '../src/domain/searchExercisePicker';

const history = ['Barbell Squat', 'Bench Press', 'Cable Fly'];

describe('searchExercisePicker', () => {
  it('empty query returns full history and empty library', () => {
    const result = searchExercisePicker(history, '');
    expect(result.history).toEqual(history);
    expect(result.library).toEqual([]);
  });

  it('history-only match: custom name not in library appears only in history', () => {
    const customHistory = ['My Custom Movement'];
    const result = searchExercisePicker(customHistory, 'custom movement');
    expect(result.history).toEqual(['My Custom Movement']);
    expect(result.library).toEqual([]);
  });

  it('library-only match returns empty history, results in library', () => {
    // '3/4 Sit-Up' is in the library but not in history
    const result = searchExercisePicker([], '3/4 sit');
    expect(result.history).toEqual([]);
    expect(result.library).toContain('3/4 Sit-Up');
  });

  it('deduplicates: name in both history and library only appears in history', () => {
    // 'Bench Press' is in the library — confirm it is excluded from library section
    const result = searchExercisePicker(['Bench Press'], 'bench');
    expect(result.history).toContain('Bench Press');
    expect(result.library).not.toContain('Bench Press');
  });

  it('library results are alphabetically ordered', () => {
    const result = searchExercisePicker([], 'squat');
    const sorted = [...result.library].sort((a, b) => a.localeCompare(b));
    expect(result.library).toEqual(sorted);
  });
});
