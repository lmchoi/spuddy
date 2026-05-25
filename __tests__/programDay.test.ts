import {
  summaryLine,
  targetsUniform,
  uniformRest,
  fmtRest,
  fmtKg,
} from '../src/domain/programDay';
import type { Target } from '../src/types';

// ─── fmtRest ─────────────────────────────────────────────────────────────────

describe('fmtRest', () => {
  it('formats whole minutes', () => {
    expect(fmtRest(60)).toBe('1 min');
    expect(fmtRest(180)).toBe('3 min');
    expect(fmtRest(120)).toBe('2 min');
  });

  it('formats seconds when not a whole minute', () => {
    expect(fmtRest(90)).toBe('90s');
    expect(fmtRest(45)).toBe('45s');
    expect(fmtRest(30)).toBe('30s');
  });
});

// ─── fmtKg ───────────────────────────────────────────────────────────────────

describe('fmtKg', () => {
  it('returns whole number without decimal for integers', () => {
    expect(fmtKg(80, 'kg')).toBe('80 kg');
    expect(fmtKg(100, 'kg')).toBe('100 kg');
  });

  it('includes decimals for non-integer weights', () => {
    expect(fmtKg(82.5, 'kg')).toBe('82.5 kg');
  });

  it('formats as lbs when unit is lb', () => {
    expect(fmtKg(80, 'lb')).toBe('80 lb');
  });
});

// ─── targetsUniform ──────────────────────────────────────────────────────────

describe('targetsUniform', () => {
  it('returns true for single target', () => {
    expect(targetsUniform([{ reps: 5, weight: 80 }])).toBe(true);
  });

  it('returns true when all targets are identical', () => {
    const t: Target = { reps: 5, weight: 80, restSeconds: 180 };
    expect(targetsUniform([t, t, t])).toBe(true);
  });

  it('returns false when reps differ', () => {
    expect(targetsUniform([
      { reps: 5, weight: 80 },
      { reps: 3, weight: 80 },
    ])).toBe(false);
  });

  it('returns false when weights differ', () => {
    expect(targetsUniform([
      { reps: 5, weight: 80 },
      { reps: 5, weight: 90 },
    ])).toBe(false);
  });

  it('returns false when rest differs', () => {
    expect(targetsUniform([
      { reps: 5, restSeconds: 60 },
      { reps: 5, restSeconds: 90 },
    ])).toBe(false);
  });

  it('returns true for empty array', () => {
    expect(targetsUniform([])).toBe(true);
  });
});

// ─── uniformRest ─────────────────────────────────────────────────────────────

describe('uniformRest', () => {
  it('returns the rest value when all targets share it', () => {
    const targets: Target[] = [
      { reps: 5, restSeconds: 180 },
      { reps: 5, restSeconds: 180 },
    ];
    expect(uniformRest(targets)).toBe(180);
  });

  it('returns null when rest values differ', () => {
    const targets: Target[] = [
      { reps: 5, restSeconds: 60 },
      { reps: 5, restSeconds: 90 },
    ];
    expect(uniformRest(targets)).toBeNull();
  });

  it('returns null when no targets have rest', () => {
    const targets: Target[] = [{ reps: 5 }, { reps: 5 }];
    expect(uniformRest(targets)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(uniformRest([])).toBeNull();
  });
});

// ─── summaryLine ─────────────────────────────────────────────────────────────

describe('summaryLine', () => {
  it('returns null for empty targets', () => {
    expect(summaryLine([], 'kg')).toBeNull();
  });

  it('formats sets × reps @ weight for uniform targets', () => {
    const targets: Target[] = [
      { reps: 5, weight: 80, restSeconds: 180 },
      { reps: 5, weight: 80, restSeconds: 180 },
      { reps: 5, weight: 80, restSeconds: 180 },
    ];
    expect(summaryLine(targets, 'kg')).toBe('3 × 5 @ 80 kg · rest 3 min');
  });

  it('formats rep range when minReps present', () => {
    const targets: Target[] = [
      { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
      { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
    ];
    expect(summaryLine(targets, 'kg')).toBe('2 × 8–12 @ 40 kg · rest 90s');
  });

  it('shows BW when weight is 0', () => {
    const targets: Target[] = [
      { reps: 6, weight: 0 },
      { reps: 6, weight: 0 },
      { reps: 6, weight: 0 },
    ];
    expect(summaryLine(targets, 'kg')).toBe('3 × 6 BW');
  });

  it('omits weight clause when weight is undefined', () => {
    const targets: Target[] = [{ reps: 8 }, { reps: 8 }];
    expect(summaryLine(targets, 'kg')).toBe('2 × 8');
  });

  it('omits rest when no targets have rest', () => {
    const targets: Target[] = [
      { reps: 5, weight: 80 },
      { reps: 5, weight: 80 },
    ];
    expect(summaryLine(targets, 'kg')).toBe('2 × 5 @ 80 kg');
  });

  it('shows ? for reps when non-uniform', () => {
    const targets: Target[] = [
      { reps: 5, weight: 80 },
      { reps: 3, weight: 80 },
    ];
    expect(summaryLine(targets, 'kg')).toBe('2 × ?');
  });
});
