import { parsePlannerDay, parseProgramFromBackup } from '../src/programParser';
import * as fs from 'fs';
import * as path from 'path';

// --- parsePlannerDay ---

// Day 1 exerciseText from fixture (post-reference-resolution).
// Reference resolution happens in parseProgramFromBackup; parsePlannerDay returns raw form.
// We test parsePlannerDay with a self-contained exerciseText (no ... references).

const DAY1_SELF_CONTAINED = [
  'Squat, Dumbbell / 3x8-12 / 13.5kg / progress: dp(5lb, 8, 12)',
  "// Label 'posture:' used to keep this separate from Day 3",
  'posture: Bent Over Row, Dumbbell / 3x8-12 / 13.5kg / progress: dp(5lb, 8, 12)',
  'Face Pull / 3x15-20',
  'Plank / 3x60',
].join('\n');

describe('parsePlannerDay', () => {
  it('parses a rep-range exercise with weight', () => {
    const exercises = parsePlannerDay('Squat, Dumbbell / 3x8-12 / 13.5kg / progress: dp(5lb, 8, 12)');
    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toBe('Squat, Dumbbell');
    expect(exercises[0].targets).toHaveLength(3);
    exercises[0].targets.forEach(t => {
      expect(t.reps).toBe(12);
      expect(t.minReps).toBe(8);
      expect(t.weight).toBeCloseTo(13.5);
    });
  });

  it('strips label prefix from exercise name', () => {
    const exercises = parsePlannerDay('posture: Bent Over Row, Dumbbell / 3x8-12 / 13.5kg');
    expect(exercises[0].name).toBe('Bent Over Row, Dumbbell');
  });

  it('skips comment lines', () => {
    const exercises = parsePlannerDay("// this is a comment\nSquat / 3x5 / 100kg");
    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toBe('Squat');
  });

  it('parses rep-only exercise (no weight)', () => {
    const exercises = parsePlannerDay('Face Pull / 3x15-20');
    expect(exercises[0].name).toBe('Face Pull');
    expect(exercises[0].targets).toHaveLength(3);
    exercises[0].targets.forEach(t => {
      expect(t.reps).toBe(20);
      expect(t.minReps).toBe(15);
      expect(t.weight).toBeUndefined();
    });
  });

  it('parses fixed-rep exercise (e.g. Plank 3x60)', () => {
    const exercises = parsePlannerDay('Plank / 3x60');
    expect(exercises[0].name).toBe('Plank');
    expect(exercises[0].targets).toHaveLength(3);
    exercises[0].targets.forEach(t => {
      expect(t.reps).toBe(60);
      expect(t.minReps).toBeUndefined();
    });
  });

  it('parses AMRAP set (3x10+)', () => {
    const exercises = parsePlannerDay('Push Up / 3x10+');
    expect(exercises[0].name).toBe('Push Up');
    expect(exercises[0].targets).toHaveLength(3);
    exercises[0].targets.forEach(t => {
      expect(t.reps).toBe(10);
    });
  });

  it('returns raw ...Reference line with empty targets (resolution deferred)', () => {
    const exercises = parsePlannerDay('Overhead Press, Dumbbell / ...Lunge, Dumbbell');
    expect(exercises[0].name).toBe('Overhead Press, Dumbbell');
    expect(exercises[0].targets).toHaveLength(0);
  });

  it('parses a multi-line exerciseText correctly', () => {
    const exercises = parsePlannerDay(DAY1_SELF_CONTAINED);
    expect(exercises).toHaveLength(4); // Squat, Bent Over Row, Face Pull, Plank
    expect(exercises[0].name).toBe('Squat, Dumbbell');
    expect(exercises[1].name).toBe('Bent Over Row, Dumbbell');
    expect(exercises[2].name).toBe('Face Pull');
    expect(exercises[3].name).toBe('Plank');
  });

  it('ignores unknown lines without throwing', () => {
    expect(() => parsePlannerDay('???garbled line')).not.toThrow();
  });
});

// --- parseProgramFromBackup ---

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/liftosaur-backup.json'), 'utf8')
);

describe('parseProgramFromBackup', () => {
  it('returns all programs from the fixture as an array', () => {
    const result = parseProgramFromBackup(fixture);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('parses the first program with 3 days', () => {
    const result = parseProgramFromBackup(fixture);
    if ('error' in result) return;
    const program = result[0];
    expect(program.name).toBe('v1');
    expect(program.days).toHaveLength(3);
  });

  it('sets activeDayIndex from nextDay field', () => {
    const result = parseProgramFromBackup(fixture);
    if ('error' in result) return;
    expect(result[0].activeDayIndex).toBe(2);
  });

  it('resolves cross-day ...Reference in Day 1', () => {
    const result = parseProgramFromBackup(fixture);
    if ('error' in result) return;
    const day1 = result[0].days[0];
    const incline = day1.exercises.find(e => e.name === 'Incline Chest Press, Band');
    expect(incline).toBeDefined();
    expect(incline!.targets.length).toBeGreaterThan(0);
    expect(incline!.targets[0].reps).toBe(12);
    expect(incline!.targets[0].minReps).toBe(8);
  });

  it('resolves ...Reference in Day 2', () => {
    const result = parseProgramFromBackup(fixture);
    if ('error' in result) return;
    const day2 = result[0].days[1];
    const ohp = day2.exercises.find(e => e.name === 'Overhead Press, Dumbbell');
    expect(ohp).toBeDefined();
    expect(ohp!.targets.length).toBeGreaterThan(0);
  });

  it('resolves ...Reference in Day 3', () => {
    const result = parseProgramFromBackup(fixture);
    if ('error' in result) return;
    const day3 = result[0].days[2];
    const goblet = day3.exercises.find(e => e.name === 'Goblet Squat');
    expect(goblet).toBeDefined();
    expect(goblet!.targets.length).toBeGreaterThan(0);
  });

  it('returns an error object for malformed input', () => {
    const result = parseProgramFromBackup({ not: 'a backup' });
    expect('error' in result).toBe(true);
  });

  it('returns error if programs is empty', () => {
    const result = parseProgramFromBackup({ programs: [] });
    expect(result).toEqual({ error: 'No programs found in backup' });
  });

  it('returns error if no valid programs found', () => {
    const result = parseProgramFromBackup({
      programs: [
        { name: 'Bad', planner: { weeks: [] } }
      ]
    });
    expect(result).toEqual({ error: 'No valid programs found in backup' });
  });

  it('returns error if weeks missing', () => {
    // @ts-ignore
    const result = parseProgramFromBackup({ programs: [{ name: 'Test', planner: {} }] });
    expect(result).toEqual({ error: 'No valid programs found in backup' });
  });

  it('returns error if days missing', () => {
    const result = parseProgramFromBackup({
      programs: [{ name: 'Test', planner: { weeks: [{ days: null }] } }]
    });
    expect(result).toEqual({ error: 'No valid programs found in backup' });
  });

  it('returns error for empty backup', () => {
    const result = parseProgramFromBackup({});
    expect(result).toEqual({ error: 'No programs found in backup' });
  });

  it('does not throw for malformed input', () => {
    expect(() => parseProgramFromBackup(null)).not.toThrow();
    expect(() => parseProgramFromBackup('string')).not.toThrow();
  });
});
