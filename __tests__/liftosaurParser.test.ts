import { parseHistoryFromBackup } from '../src/liftosaurParser';
import * as fs from 'fs';
import * as path from 'path';

const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/liftosaur-backup.json'), 'utf8')
);

describe('parseHistoryFromBackup', () => {
  it('returns one Session per history record', () => {
    const result = parseHistoryFromBackup(fixture);
    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) return;
    expect(result).toHaveLength(4);
  });

  it('normalises ISO date to YYYY-MM-DD', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    expect(result.find(s => s.date === '2026-05-19')).toBeDefined();
    expect(result.find(s => s.date === '2026-05-15')).toBeDefined();
  });

  it('sets source and sourceId from history record', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    expect(session.source).toBe('liftosaur');
    expect(session.sourceId).toBe('1779214852902');
  });

  it('maps exercise names from entry.exercise.name', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    const names = session.exercises.map(e => e.name);
    expect(names).toContain('Face Pull');
    expect(names).toContain('Goblet Squat');
    expect(names).toContain('Lunge');
    expect(names).toContain('Romanian Deadlift');
  });

  it('maps completedReps and completedWeight as actual set values', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    const facePull = session.exercises.find(e => e.name === 'Face Pull')!;
    expect(facePull.sets[0].reps).toBe(20);
    expect(facePull.sets[0].weight).toBe(9);
  });

  it('skips sets where isCompleted is false', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    // Lunge has 1 completed and 2 incomplete sets
    const lunge = session.exercises.find(e => e.name === 'Lunge')!;
    expect(lunge.sets).toHaveLength(1);
    expect(lunge.sets[0].reps).toBe(3);
  });

  it('marks warmupSets with isWarmup: true', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    const goblet = session.exercises.find(e => e.name === 'Goblet Squat')!;
    const warmupSets = goblet.sets.filter(s => s.isWarmup);
    expect(warmupSets).toHaveLength(1);
    expect(warmupSets[0].reps).toBe(5);
    expect(warmupSets[0].weight).toBe(13.5);
  });

  it('maps programmed reps, minReps, and weight as targets for completed sets', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    const facePull = session.exercises.find(e => e.name === 'Face Pull')!;
    expect(facePull.targets).toHaveLength(3);
    expect(facePull.targets[0].reps).toBe(20);
    expect(facePull.targets[0].minReps).toBe(15);
    expect(facePull.targets[0].weight).toBe(10);
  });

  it('omits minReps from targets when not present', () => {
    const result = parseHistoryFromBackup(fixture);
    if (!Array.isArray(result)) return;
    const session = result.find(s => s.date === '2026-05-19')!;
    const lunge = session.exercises.find(e => e.name === 'Lunge')!;
    // Lunge set has reps=10 but no minReps
    expect(lunge.targets[0].minReps).toBeUndefined();
  });

  it('converts lb completedWeight to kg', () => {
    const lbFixture = {
      history: [{
        id: 123,
        date: '2026-01-01T00:00:00.000Z',
        entries: [{
          exercise: { name: 'Bench Press' },
          warmupSets: [],
          sets: [{
            reps: 5,
            weight: { value: 100, unit: 'lb' },
            isCompleted: true,
            completedReps: 5,
            completedWeight: { value: 100, unit: 'lb' },
          }],
        }],
      }],
    };
    const result = parseHistoryFromBackup(lbFixture);
    if (!Array.isArray(result)) return;
    expect(result[0].exercises[0].sets[0].weight).toBeCloseTo(100 * 0.453592, 3);
  });

  it('converts lb target weight to kg', () => {
    const lbFixture = {
      history: [{
        id: 456,
        date: '2026-01-02T00:00:00.000Z',
        entries: [{
          exercise: { name: 'Squat' },
          warmupSets: [],
          sets: [{
            reps: 5,
            weight: { value: 200, unit: 'lb' },
            isCompleted: true,
            completedReps: 5,
            completedWeight: { value: 200, unit: 'lb' },
          }],
        }],
      }],
    };
    const result = parseHistoryFromBackup(lbFixture);
    if (!Array.isArray(result)) return;
    expect(result[0].exercises[0].targets[0].weight).toBeCloseTo(200 * 0.453592, 3);
  });

  it('returns error for null input', () => {
    const result = parseHistoryFromBackup(null);
    expect(Array.isArray(result)).toBe(false);
    if (Array.isArray(result)) return;
    expect((result as { error: string }).error).toBeTruthy();
  });

  it('returns error when history field is missing', () => {
    const result = parseHistoryFromBackup({ programs: [] });
    expect(Array.isArray(result)).toBe(false);
  });

  it('returns empty array when history is empty', () => {
    const result = parseHistoryFromBackup({ history: [] });
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) expect(result).toHaveLength(0);
  });

  it('skips history records with no id', () => {
    const fixture = {
      history: [
        {
          date: '2026-01-01T00:00:00.000Z',
          entries: [{ exercise: { name: 'Squat' }, warmupSets: [], sets: [] }],
        },
        {
          id: 999,
          date: '2026-01-02T00:00:00.000Z',
          entries: [{ exercise: { name: 'Bench Press' }, warmupSets: [], sets: [] }],
        },
      ],
    };
    const result = parseHistoryFromBackup(fixture);
    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) return;
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('999');
  });

  it('warns when a record is skipped due to missing id', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    parseHistoryFromBackup({
      history: [{ date: '2026-01-01T00:00:00.000Z', entries: [] }],
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('skips sessions where all entries have no exercise name', () => {
    const result = parseHistoryFromBackup({
      history: [{
        id: 1,
        date: '2026-01-01T00:00:00.000Z',
        entries: [{ exercise: {}, warmupSets: [], sets: [] }],
      }],
    });
    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) return;
    expect(result).toHaveLength(0);
  });

  it('warns when a session has no exercises after filtering', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    parseHistoryFromBackup({
      history: [{
        id: 1,
        date: '2026-01-01T00:00:00.000Z',
        entries: [{ exercise: {}, warmupSets: [], sets: [] }],
      }],
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('warns when a completed set has null completedWeight', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    parseHistoryFromBackup({
      history: [{
        id: 1,
        date: '2026-01-01T00:00:00.000Z',
        entries: [{
          exercise: { name: 'Squat' },
          warmupSets: [],
          sets: [{ reps: 5, isCompleted: true, completedReps: 5, completedWeight: null }],
        }],
      }],
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
