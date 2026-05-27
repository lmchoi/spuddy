import {
  initSession,
  logSet,
  skipRest,
  jumpToExercise,
  isExerciseDone,
  isSessionDone,
  getActiveTarget,
  buildSavePayload,
  addExtraSet,
} from '../src/domain/sessionLogger';
import type { ProgramDay } from '../src/types';

const day: ProgramDay = {
  name: 'Day A',
  exercises: [
    {
      name: 'Squat',
      targets: [
        { reps: 5, weight: 100 },
        { reps: 5, weight: 100 },
        { reps: 5, weight: 100 },
      ],
    },
    {
      name: 'Bench',
      targets: [
        { reps: 8, weight: 60 },
        { reps: 8, weight: 60 },
      ],
    },
  ],
};

describe('initSession', () => {
  it('starts at exercise 0, not resting, empty logged sets', () => {
    const state = initSession(day);
    expect(state.currentExerciseIdx).toBe(0);
    expect(state.isResting).toBe(false);
    expect(state.loggedSets).toEqual([[], []]);
    expect(typeof state.startedAt).toBe('number');
  });
});

describe('logSet', () => {
  it('appends to the correct exercise', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    expect(state.loggedSets[0]).toEqual([{ reps: 5, weight: 100 }]);
    expect(state.loggedSets[1]).toEqual([]);
  });

  it('sets isResting true when more sets remain in that exercise', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    expect(state.isResting).toBe(true);
  });

  it('does not set isResting when the exercise is now done', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    expect(state.isResting).toBe(false);
  });

  it('preserves logged values when switching exercises', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 1, 8, 60);
    expect(state.loggedSets[0]).toEqual([{ reps: 5, weight: 100 }]);
    expect(state.loggedSets[1]).toEqual([{ reps: 8, weight: 60 }]);
  });
});

describe('skipRest', () => {
  it('clears isResting', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    expect(state.isResting).toBe(true);
    state = skipRest(state);
    expect(state.isResting).toBe(false);
  });
});

describe('jumpToExercise', () => {
  it('sets currentExerciseIdx and clears isResting', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = jumpToExercise(state, 1);
    expect(state.currentExerciseIdx).toBe(1);
    expect(state.isResting).toBe(false);
  });
});

describe('isExerciseDone', () => {
  it('returns false when no sets logged', () => {
    const state = initSession(day);
    expect(isExerciseDone(state, day, 0)).toBe(false);
  });

  it('returns true when all sets logged', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    expect(isExerciseDone(state, day, 0)).toBe(true);
  });
});

describe('isSessionDone', () => {
  it('returns false when some exercises incomplete', () => {
    const state = initSession(day);
    expect(isSessionDone(state, day)).toBe(false);
  });

  it('returns true when all exercises complete', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 1, 8, 60);
    state = logSet(state, 1, 8, 60);
    expect(isSessionDone(state, day)).toBe(true);
  });
});

describe('getActiveTarget', () => {
  it('returns the next unlogged target', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    const target = getActiveTarget(state, day, 0);
    expect(target).toEqual({ reps: 5, weight: 100 });
  });

  it('defaults reps to 10 when target has no reps', () => {
    const noRepDay: ProgramDay = {
      name: 'Day B',
      exercises: [
        { name: 'Plank', targets: [{ reps: 0, weight: 0 }] },
      ],
    };
    const state = initSession(noRepDay);
    const target = getActiveTarget(state, noRepDay, 0);
    expect(target.reps).toBe(10);
  });

  it('returns first target when exercise just started', () => {
    const state = initSession(day);
    const target = getActiveTarget(state, day, 0);
    expect(target).toEqual({ reps: 5, weight: 100 });
  });
});

describe('buildSavePayload', () => {
  it('assembles a Session with exercises matching logged sets', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 4, 100);
    state = logSet(state, 1, 8, 60);

    const session = buildSavePayload(state, day, '2026-05-25');

    expect(session.date).toBe('2026-05-25');
    expect(session.exercises).toHaveLength(2);

    const squat = session.exercises[0];
    expect(squat.name).toBe('Squat');
    expect(squat.sets).toHaveLength(2);
    expect(squat.sets[0]).toMatchObject({ reps: 5, weight: 100 });
    expect(squat.sets[1]).toMatchObject({ reps: 4, weight: 100 });

    const bench = session.exercises[1];
    expect(bench.name).toBe('Bench');
    expect(bench.sets).toHaveLength(1);
  });

  it('omits exercises with no logged sets', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);

    const session = buildSavePayload(state, day, '2026-05-25');
    expect(session.exercises).toHaveLength(1);
    expect(session.exercises[0].name).toBe('Squat');
  });

  it('extra logged sets appear in the payload unchanged', () => {
    let state = initSession(day);
    // Log all 3 planned Squat sets
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    // Add an extra set and log it
    state = addExtraSet(state, 0);
    state = logSet(state, 0, 4, 100);

    const session = buildSavePayload(state, day, '2026-05-25');
    const squat = session.exercises[0];
    expect(squat.sets).toHaveLength(4);
    expect(squat.sets[3]).toMatchObject({ reps: 4, weight: 100 });
  });
});

// ─── addExtraSet ──────────────────────────────────────────────────────────────

describe('addExtraSet', () => {
  it('increments extraSetCounts for the target exercise only', () => {
    let state = initSession(day);
    // Log all sets for exercise 0 so it is done
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = addExtraSet(state, 0);
    expect(state.extraSetCounts[0]).toBe(1);
    expect(state.extraSetCounts[1]).toBe(0);
  });

  it('clears isResting', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    // isResting is false after last set; set it manually to test
    state = { ...state, isResting: true };
    state = addExtraSet(state, 0);
    expect(state.isResting).toBe(false);
  });

  it('makes isExerciseDone return false again', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    expect(isExerciseDone(state, day, 0)).toBe(true);
    state = addExtraSet(state, 0);
    expect(isExerciseDone(state, day, 0)).toBe(false);
  });

  it('isExerciseDone returns true again after logging the extra set', () => {
    let state = initSession(day);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = addExtraSet(state, 0);
    state = logSet(state, 0, 4, 100);
    expect(isExerciseDone(state, day, 0)).toBe(true);
  });
});

// ─── initSession — extraSetCounts ─────────────────────────────────────────────

describe('initSession extraSetCounts', () => {
  it('initialises extraSetCounts to all zeros', () => {
    const state = initSession(day);
    expect(state.extraSetCounts).toEqual([0, 0]);
  });
});

// ─── getActiveTarget — extra-set territory ────────────────────────────────────

describe('getActiveTarget in extra-set territory', () => {
  it('pre-fills from the last logged set when beyond planned targets', () => {
    let state = initSession(day);
    // Log all 3 planned sets (last at 4 reps instead of 5)
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 5, 100);
    state = logSet(state, 0, 4, 100);
    state = addExtraSet(state, 0);
    const target = getActiveTarget(state, day, 0);
    expect(target).toEqual({ reps: 4, weight: 100 });
  });
});
