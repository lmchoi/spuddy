import { formatExerciseMeta } from '../src/domain/notesReview';
import type { ParsedExercise } from '../src/notesParser';

function ex(overrides: Partial<ParsedExercise>): ParsedExercise {
  return { name: 'Bench press', sets: null, reps: null, weight: 0, explicitUnit: null, ...overrides };
}

describe('formatExerciseMeta', () => {
  it('shows sets×reps · weight when both sets and reps are present', () => {
    expect(formatExerciseMeta(ex({ sets: 3, reps: 10, weight: 80, explicitUnit: 'kg' }), null)).toBe('3×10 · 80kg');
  });

  it('shows reps-only label when only reps present', () => {
    expect(formatExerciseMeta(ex({ reps: 3, weight: 80, explicitUnit: 'kg' }), null)).toBe('3 reps · 80kg');
  });

  it('shows sets-only label when only sets present', () => {
    expect(formatExerciseMeta(ex({ sets: 3, weight: 80, explicitUnit: 'kg' }), null)).toBe('3 sets · 80kg');
  });

  it('shows weight only when neither sets nor reps present', () => {
    expect(formatExerciseMeta(ex({ weight: 80, explicitUnit: 'kg' }), null)).toBe('80kg');
  });

  it('shows dash when no weight and no count', () => {
    expect(formatExerciseMeta(ex({ weight: 0 }), null)).toBe('—');
  });

  it('falls back to inferredUnit when explicitUnit is null', () => {
    expect(formatExerciseMeta(ex({ sets: 3, reps: 10, weight: 80 }), 'kg')).toBe('3×10 · 80kg');
  });

  it('omits unit when both explicitUnit and inferredUnit are null', () => {
    expect(formatExerciseMeta(ex({ sets: 3, reps: 10, weight: 80 }), null)).toBe('3×10 · 80');
  });

  it('uses singular "set" when sets is 1 and reps is null', () => {
    expect(formatExerciseMeta(ex({ sets: 1, weight: 50 }), null)).toBe('1 set · 50');
  });

  it('uses singular "rep" when reps is 1 and sets is null', () => {
    expect(formatExerciseMeta(ex({ reps: 1, weight: 50 }), null)).toBe('1 rep · 50');
  });
});
