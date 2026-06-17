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
    expect(result.library).toContainEqual(expect.objectContaining({ name: '3/4 Sit-Up' }));
  });

  it('deduplicates: name in both history and library only appears in history', () => {
    // 'Bench Press' is in the library — confirm it is excluded from library section
    const result = searchExercisePicker(['Bench Press'], 'bench');
    expect(result.history).toContain('Bench Press');
    expect(result.library).not.toContainEqual(expect.objectContaining({ name: 'Bench Press' }));
  });

  it('library results are alphabetically ordered', () => {
    const result = searchExercisePicker([], 'squat');
    const sorted = [...result.library].sort((a, b) => a.name.localeCompare(b.name));
    expect(result.library).toEqual(sorted);
  });

  it('library results are capped at 20', () => {
    // 'e' matches far more than 20 library exercises
    const result = searchExercisePicker([], 'e');
    expect(result.library.length).toBeLessThanOrEqual(20);
  });

  it('library results include correct libraryId from exercises.json', () => {
    // '3/4 Sit-Up' has id '3_4_Sit-Up' in exercises.json
    const result = searchExercisePicker([], '3/4 sit');
    expect(result.library).toContainEqual({
      name: '3/4 Sit-Up',
      libraryId: '3_4_Sit-Up',
    });
  });
});
