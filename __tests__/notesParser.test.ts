import { parseWorkoutNotes } from '../src/notesParser';
import type { ParsedNotes } from '../src/notesParser';

describe('parseWorkoutNotes — contract shape', () => {
  it('returns a ParsedNotes object for any input', () => {
    const result: ParsedNotes = parseWorkoutNotes('anything');
    expect(Array.isArray(result.sections)).toBe(true);
    expect(typeof result.skippedLines).toBe('number');
    expect(
      result.inferredUnit === null ||
      result.inferredUnit === 'kg' ||
      result.inferredUnit === 'lbs'
    ).toBe(true);
  });

  it('returns a ParsedNotes object for empty input', () => {
    const result = parseWorkoutNotes('');
    expect(Array.isArray(result.sections)).toBe(true);
  });
});
