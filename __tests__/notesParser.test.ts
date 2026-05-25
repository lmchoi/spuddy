import { parseWorkoutNotes } from '../src/notesParser';

describe('parseWorkoutNotes', () => {
  describe('empty / whitespace input', () => {
    it('returns empty sections for empty string', () => {
      const result = parseWorkoutNotes('');
      expect(result).toEqual({ sections: [], inferredUnit: null, skippedLines: 0 });
    });

    it('returns empty sections for whitespace-only input', () => {
      const result = parseWorkoutNotes('   \n\n  ');
      expect(result).toEqual({ sections: [], inferredUnit: null, skippedLines: 0 });
    });
  });

  describe('section headers', () => {
    it('non-bullet line becomes the section name', () => {
      const result = parseWorkoutNotes('Upper body\n- Bench press - 80');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].name).toBe('Upper body');
    });

    it('no header → section named "My Workout"', () => {
      const result = parseWorkoutNotes('- Bench press - 80');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].name).toBe('My Workout');
    });

    it('multiple headers → multiple sections', () => {
      const input = [
        'Upper body',
        '- Bench press - 80',
        'Lower body',
        '- Squat - 100',
      ].join('\n');
      const result = parseWorkoutNotes(input);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].name).toBe('Upper body');
      expect(result.sections[1].name).toBe('Lower body');
    });
  });

  describe('name - weight pattern', () => {
    it('parses basic "name - weight"', () => {
      const result = parseWorkoutNotes('- Bench press - 80');
      const ex = result.sections[0].exercises[0];
      expect(ex.name).toBe('Bench press');
      expect(ex.weight).toBe(80);
      expect(ex.sets).toBe(1);
      expect(ex.explicitUnit).toBeNull();
    });

    it('parses decimal weight', () => {
      const result = parseWorkoutNotes('- Leg press - 68.3');
      expect(result.sections[0].exercises[0].weight).toBeCloseTo(68.3);
    });

    it('parses name with parenthetical note', () => {
      const result = parseWorkoutNotes('- Lat pulldown (wide grip) - 55');
      const ex = result.sections[0].exercises[0];
      expect(ex.name).toBe('Lat pulldown (wide grip)');
      expect(ex.weight).toBe(55);
    });

    it('parses explicit kg unit', () => {
      const result = parseWorkoutNotes('- Bench press - 80kg');
      const ex = result.sections[0].exercises[0];
      expect(ex.weight).toBe(80);
      expect(ex.explicitUnit).toBe('kg');
    });

    it('parses explicit lbs unit', () => {
      const result = parseWorkoutNotes('- Bench press - 175lbs');
      const ex = result.sections[0].exercises[0];
      expect(ex.weight).toBe(175);
      expect(ex.explicitUnit).toBe('lbs');
    });
  });

  describe('Nx weight pattern', () => {
    it('parses "2x 15kg"', () => {
      const result = parseWorkoutNotes('- Bench press 2x 15kg');
      const ex = result.sections[0].exercises[0];
      expect(ex.name).toBe('Bench press');
      expect(ex.sets).toBe(2);
      expect(ex.weight).toBe(15);
      expect(ex.explicitUnit).toBe('kg');
    });

    it('parses "3 x 80" (spaces around x)', () => {
      const result = parseWorkoutNotes('- Squat 3 x 80');
      const ex = result.sections[0].exercises[0];
      expect(ex.sets).toBe(3);
      expect(ex.weight).toBe(80);
    });

    it('skips reps-only entry like "3x12" (no weight)', () => {
      const result = parseWorkoutNotes('- Bench press 3x12');
      expect(result.sections[0]?.exercises).toHaveLength(0);
      expect(result.skippedLines).toBe(1);
    });
  });

  describe('bullet styles', () => {
    it('recognises • bullet', () => {
      const result = parseWorkoutNotes('• Bench press - 80');
      expect(result.sections[0].exercises).toHaveLength(1);
    });

    it('recognises * bullet', () => {
      const result = parseWorkoutNotes('* Bench press - 80');
      expect(result.sections[0].exercises).toHaveLength(1);
    });
  });

  describe('inferredUnit', () => {
    it('is "kg" when all explicit units are kg', () => {
      const result = parseWorkoutNotes('- Bench 80kg\n- Squat 100kg');
      expect(result.inferredUnit).toBe('kg');
    });

    it('is "lbs" when all explicit units are lbs', () => {
      const result = parseWorkoutNotes('- Bench 175lbs\n- Squat 225lbs');
      expect(result.inferredUnit).toBe('lbs');
    });

    it('is null when units are mixed', () => {
      const result = parseWorkoutNotes('- Bench 80kg\n- Squat 225lbs');
      expect(result.inferredUnit).toBeNull();
    });

    it('is null when no explicit units', () => {
      const result = parseWorkoutNotes('- Bench press - 80\n- Squat - 100');
      expect(result.inferredUnit).toBeNull();
    });
  });

  describe('name cleanup', () => {
    it('strips trailing dash from name in Nx pattern ("Circuit A - 3 x 80")', () => {
      const result = parseWorkoutNotes('- Circuit A - 3 x 80');
      expect(result.sections[0].exercises[0].name).toBe('Circuit A');
    });
  });

  describe('skippedLines', () => {
    it('increments skippedLines for unrecognised bullet lines', () => {
      const result = parseWorkoutNotes('- just some notes here');
      expect(result.skippedLines).toBe(1);
    });

    it('does not count non-bullet lines as skipped', () => {
      const result = parseWorkoutNotes('Upper body\n- Bench press - 80');
      expect(result.skippedLines).toBe(0);
    });
  });
});
