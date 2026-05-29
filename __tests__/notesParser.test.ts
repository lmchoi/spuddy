import { parseWorkoutNotes } from '../src/notesParser';

describe('parseWorkoutNotes', () => {
  describe('empty / whitespace input', () => {
    it('returns empty sections for empty string', () => {
      const result = parseWorkoutNotes('');
      expect(result).toEqual({ sections: [], inferredUnit: null });
    });

    it('returns empty sections for whitespace-only input', () => {
      const result = parseWorkoutNotes('   \n\n  ');
      expect(result).toEqual({ sections: [], inferredUnit: null });
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
      expect(ex.sets).toBeNull();
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

  describe('Nx weight / NxM weight patterns', () => {
    it('parses "2x 15kg" as reps=2 sets=null', () => {
      const result = parseWorkoutNotes('- Bench press 2x 15kg');
      const ex = result.sections[0].exercises[0];
      expect(ex.name).toBe('Bench press');
      expect(ex.sets).toBeNull();
      expect(ex.reps).toBe(2);
      expect(ex.weight).toBe(15);
      expect(ex.explicitUnit).toBe('kg');
    });

    it('parses "3 x 80" as reps=3 sets=null', () => {
      const result = parseWorkoutNotes('- Squat 3 x 80');
      const ex = result.sections[0].exercises[0];
      expect(ex.sets).toBeNull();
      expect(ex.reps).toBe(3);
      expect(ex.weight).toBe(80);
    });

    it('parses "3x12" (no weight) as sets=3 reps=12 weight=0', () => {
      const result = parseWorkoutNotes('- Bench press 3x12');
      const ex = result.sections[0].exercises[0];
      expect(ex.sets).toBe(3);
      expect(ex.reps).toBe(12);
      expect(ex.weight).toBe(0);
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

    it('does not leave orphan x when set count has trailing x ("3x bench - 10 x 80")', () => {
      const result = parseWorkoutNotes('- 3x bench - 10 x 80');
      expect(result.sections[0].exercises[0].name).toBe('bench');
    });

    it('does not leave orphan x when trailing set marker before dash ("Squat 3x - 10x80")', () => {
      const result = parseWorkoutNotes('- Squat 3x - 10x80');
      expect(result.sections[0].exercises[0].name).toBe('Squat');
    });
  });

});

describe('parseBulletLine — reps heuristic', () => {
  function parse(line: string) {
    const result = parseWorkoutNotes(`- Bench press ${line}`);
    return result.sections[0].exercises[0];
  }

  test.each([
    // sets × reps × weight (x connects two numbers directly)
    ['3x10 80kg',  { sets: 3,    reps: 10,   weight: 80, explicitUnit: 'kg'  }],
    ['3x10 80',    { sets: 3,    reps: 10,   weight: 80, explicitUnit: null  }],
    ['3x10 80lbs', { sets: 3,    reps: 10,   weight: 80, explicitUnit: 'lbs' }],
    // reps × weight (x = "times", sets not specified)
    ['2x 15kg',    { sets: null, reps: 2,    weight: 15 }],
    ['3x 80kg',    { sets: null, reps: 3,    weight: 80 }],
    ['3 x 80kg',   { sets: null, reps: 3,    weight: 80 }],
    ['3 x 80',     { sets: null, reps: 3,    weight: 80 }],
    // weight × reps (weight first)
    ['80kg x 3',   { sets: null, reps: 3,    weight: 80 }],
    ['80 x 3',     { sets: null, reps: 3,    weight: 80 }],
    // two bare numbers — smaller=reps, larger=weight, order doesn't matter
    ['10 80',      { sets: null, reps: 10,   weight: 80  }],
    ['80 10',      { sets: null, reps: 10,   weight: 80  }],
    ['5 100',      { sets: null, reps: 5,    weight: 100 }],
    // weight only
    ['80kg',       { sets: null, reps: null, weight: 80 }],
    ['- 80',       { sets: null, reps: null, weight: 80 }],
    ['80lbs',      { sets: null, reps: null, weight: 80 }],
  ])('%s', (line, expected) => {
    expect(parse(line)).toMatchObject(expected);
  });

  // No weight found — weight=0, sets and reps null, no line skipped
  it('no weight: produces an exercise with weight=0 rather than skipping', () => {
    const result = parseWorkoutNotes('- just some notes here');
    expect(result.sections[0].exercises).toHaveLength(1);
    expect(result.sections[0].exercises[0]).toMatchObject({ sets: null, reps: null, weight: 0 });
  });

  // Regression guard: shared /g regex lastIndex would cause the second parse to skip leading
  // tokens, producing wrong results. Both calls must return identical output.
  it('produces identical results when called twice in succession', () => {
    const input = '- Bench press 3x10 80kg\n- Squat 5 100';
    const first = parseWorkoutNotes(input);
    const second = parseWorkoutNotes(input);
    expect(second).toEqual(first);
  });
});
