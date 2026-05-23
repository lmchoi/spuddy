import { sessionColor } from '../components/spuddy/SessionRow';
import { C } from '../components/spuddy/palette';
import type { Session } from '../src/types';

const makeSet = (reps: number, weight: number) => ({ reps, weight, isWarmup: false, isBodyweight: false });
const makeTarget = (reps: number, weight: number) => ({ reps, weight });

function makeSession(sets: ReturnType<typeof makeSet>[], targets: ReturnType<typeof makeTarget>[]): Session {
  return { date: '2026-01-01', exercises: [{ name: 'Squat', sets, targets }] };
}

describe('sessionColor', () => {
  it('returns noTarget when all working sets have no targets', () => {
    const session = makeSession([makeSet(5, 100), makeSet(5, 100)], []);
    expect(sessionColor(session)).toBe(C.noTarget);
  });

  it('returns noTarget when session has no exercises', () => {
    const session: Session = { date: '2026-01-01', exercises: [] };
    expect(sessionColor(session)).toBe(C.noTarget);
  });

  it('returns below when any set is below target', () => {
    const session = makeSession(
      [makeSet(4, 100), makeSet(5, 100)],
      [makeTarget(5, 100), makeTarget(5, 100)],
    );
    expect(sessionColor(session)).toBe(C.below);
  });

  it('returns exceeded when every set exceeded target', () => {
    const session = makeSession(
      [makeSet(6, 100), makeSet(6, 100)],
      [makeTarget(5, 100), makeTarget(5, 100)],
    );
    expect(sessionColor(session)).toBe(C.exceeded);
  });

  it('returns hit when all sets hit or exceeded target (mixed)', () => {
    const session = makeSession(
      [makeSet(5, 100), makeSet(6, 100)],
      [makeTarget(5, 100), makeTarget(5, 100)],
    );
    expect(sessionColor(session)).toBe(C.hit);
  });
});
