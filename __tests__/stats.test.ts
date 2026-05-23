import { computeStats, coachLine } from '../src/domain/stats';
import type { Session } from '../src/types';

const makeSet = (reps: number, weight: number, isWarmup = false, isBodyweight = false) =>
  ({ reps, weight, isWarmup, isBodyweight });

const makeTarget = (reps: number, weight?: number) =>
  ({ reps, ...(weight !== undefined && { weight }) });

describe('computeStats', () => {
  it('returns zeros for an empty session', () => {
    const session: Session = { date: '2026-01-01', exercises: [] };
    expect(computeStats(session)).toEqual({
      working: 0, hits: 0, exceeded: 0, below: 0,
      onTarget: 0, totalReps: 0, volumeKg: 0,
    });
  });

  it('skips warmup sets and aligns targets to working sets only', () => {
    // 2 warmups + 2 working; targets are indexed for working sets
    const session: Session = {
      date: '2026-01-01',
      exercises: [{
        name: 'Squat',
        sets: [
          makeSet(10, 60, true),   // warmup — ignored
          makeSet(5, 80, true),    // warmup — ignored
          makeSet(5, 100, false),  // working set 0 → targets[0] = 5 @ 100 → hit
          makeSet(5, 100, false),  // working set 1 → targets[1] = 5 @ 100 → hit
        ],
        targets: [makeTarget(5, 100), makeTarget(5, 100)],
      }],
    };
    const s = computeStats(session);
    expect(s.working).toBe(2);
    expect(s.hits).toBe(2);
    expect(s.exceeded).toBe(0);
    expect(s.below).toBe(0);
    expect(s.onTarget).toBe(100);
  });

  it('counts hit / exceeded / below correctly', () => {
    const session: Session = {
      date: '2026-01-01',
      exercises: [{
        name: 'Bench',
        sets: [
          makeSet(8, 60),   // hit  (target 8 @ 60)
          makeSet(9, 60),   // exceeded
          makeSet(7, 60),   // below
        ],
        targets: [makeTarget(8, 60), makeTarget(8, 60), makeTarget(8, 60)],
      }],
    };
    const s = computeStats(session);
    expect(s.hits).toBe(1);
    expect(s.exceeded).toBe(1);
    expect(s.below).toBe(1);
    expect(s.onTarget).toBe(67); // 2/3 = 66.6... → rounds to 67
  });

  it('computes volume excluding bodyweight sets', () => {
    const session: Session = {
      date: '2026-01-01',
      exercises: [
        {
          name: 'Bench',
          sets: [makeSet(5, 100)],
          targets: [],
        },
        {
          name: 'Pull-ups',
          sets: [makeSet(8, 0, false, true)], // bodyweight — excluded from volume
          targets: [],
        },
      ],
    };
    // 5 × 100 = 500; pull-ups excluded
    expect(computeStats(session).volumeKg).toBe(500);
  });

  it('accumulates totalReps including bodyweight sets', () => {
    const session: Session = {
      date: '2026-01-01',
      exercises: [{
        name: 'Pull-ups',
        sets: [makeSet(8, 0, false, true), makeSet(6, 0, false, true)],
        targets: [],
      }],
    };
    expect(computeStats(session).totalReps).toBe(14);
  });
});

describe('coachLine', () => {
  const base = { working: 10, totalReps: 50, volumeKg: 1000 };

  it('handles no sets logged', () => {
    expect(coachLine({ ...base, working: 0, hits: 0, exceeded: 0, below: 0, onTarget: 0 }))
      .toBe('No sets logged for this session.');
  });

  it('celebrates a perfect session', () => {
    expect(coachLine({ ...base, hits: 10, exceeded: 0, below: 0, onTarget: 100 }))
      .toBe('Perfect session — every set hit its target.');
  });

  it('returns strong-session line when exceeded dominates', () => {
    // exceeded (6) > hits (3) + below (1)
    const line = coachLine({ ...base, hits: 3, exceeded: 6, below: 1, onTarget: 90 });
    expect(line).toContain('Strong session');
    expect(line).toContain('90%');
  });

  it('returns solid-work line for ≥80% on target', () => {
    const line = coachLine({ ...base, hits: 8, exceeded: 0, below: 2, onTarget: 80 });
    expect(line).toContain('Solid work');
  });

  it('returns focus-on-shortfalls line for <80% on target', () => {
    const line = coachLine({ ...base, hits: 5, exceeded: 0, below: 5, onTarget: 50 });
    expect(line).toContain('50%');
    expect(line).toContain('fell short');
  });
});
