import type { ProgramDay, Session, Target } from '../types';

export type LoggedSet = { reps: number; weight: number };

export type SessionState = {
  loggedSets: LoggedSet[][];
  targetCounts: number[];
  extraSetCounts: number[];   // sets added beyond program targets, per exercise
  currentExerciseIdx: number;
  isResting: boolean;
  startedAt: number;
};

export function initSession(day: ProgramDay): SessionState {
  return {
    loggedSets: day.exercises.map(() => []),
    targetCounts: day.exercises.map(ex => ex.targets.length),
    extraSetCounts: day.exercises.map(() => 0),
    currentExerciseIdx: 0,
    isResting: false,
    startedAt: Date.now(),
  };
}

export function addExtraSet(state: SessionState, exIdx: number): SessionState {
  const extraSetCounts = state.extraSetCounts.map((c, i) => i === exIdx ? c + 1 : c);
  return { ...state, extraSetCounts, isResting: false };
}

export function logSet(
  state: SessionState,
  exIdx: number,
  reps: number,
  weight: number
): SessionState {
  const newLoggedSets = state.loggedSets.map((sets, i) =>
    i === exIdx ? [...sets, { reps, weight }] : sets
  );
  const logged = newLoggedSets[exIdx].length;
  const required = state.targetCounts[exIdx] + state.extraSetCounts[exIdx];
  const isResting = logged < required;
  return { ...state, loggedSets: newLoggedSets, isResting };
}

export function skipRest(state: SessionState): SessionState {
  return { ...state, isResting: false };
}

export function reconcileDraft(draft: SessionState, day: ProgramDay): SessionState {
  const n = day.exercises.length;
  return {
    ...draft,
    targetCounts: day.exercises.map(ex => ex.targets.length),
    loggedSets: day.exercises.map((_, i) => draft.loggedSets[i] ?? []),
    extraSetCounts: day.exercises.map((_, i) => draft.extraSetCounts[i] ?? 0),
    currentExerciseIdx: Math.min(draft.currentExerciseIdx, n - 1),
  };
}

export function jumpToExercise(state: SessionState, idx: number): SessionState {
  return { ...state, currentExerciseIdx: idx, isResting: false };
}

export function totalSetCount(state: SessionState, day: ProgramDay, exIdx: number): number {
  return day.exercises[exIdx].targets.length + state.extraSetCounts[exIdx];
}

export function isExerciseDone(
  state: SessionState,
  day: ProgramDay,
  exIdx: number
): boolean {
  return state.loggedSets[exIdx].length >= totalSetCount(state, day, exIdx);
}

export function sessionProgress(
  state: SessionState,
  day: ProgramDay,
): { done: number; total: number } {
  const done = state.loggedSets.reduce((n, sets) => n + sets.length, 0);
  const total = day.exercises.reduce((n, _, i) => n + totalSetCount(state, day, i), 0);
  return { done, total };
}

export function isSessionDone(state: SessionState, day: ProgramDay): boolean {
  return day.exercises.every((_, i) => isExerciseDone(state, day, i));
}

export function getActiveTarget(
  state: SessionState,
  day: ProgramDay,
  exIdx: number
): Target {
  const logged = state.loggedSets[exIdx].length;
  const targets = day.exercises[exIdx].targets;
  if (logged >= targets.length && logged > 0) {
    const last = state.loggedSets[exIdx][logged - 1];
    return { reps: last.reps, weight: last.weight };
  }
  const raw = targets[Math.min(logged, targets.length - 1)];
  if (!raw.reps) return { ...raw, reps: 10 };
  return raw;
}

export function buildNewDay(state: SessionState, day: ProgramDay, name: string): ProgramDay {
  const exercises = day.exercises.flatMap((ex, i) => {
    if (state.loggedSets[i].length === 0 && state.extraSetCounts[i] === 0) return [];
    const extra = state.extraSetCounts[i];
    const extraTargets = extra > 0
      ? Array.from({ length: extra }, () => ex.targets[ex.targets.length - 1])
      : [];
    return [{ name: ex.name, targets: [...ex.targets, ...extraTargets] }];
  });
  return { name, exercises };
}

export function detectSessionChanges(state: SessionState): boolean {
  return state.loggedSets.some(sets => sets.length === 0) ||
    state.extraSetCounts.some(c => c > 0);
}

export function resolvePostSessionAction(state: SessionState): 'prompt' | 'navigate' {
  return detectSessionChanges(state) ? 'prompt' : 'navigate';
}

export function shouldPromptOnExit(): boolean {
  return true;
}

export function addExercise(
  state: SessionState,
  day: ProgramDay,
  name: string,
): { session: SessionState; day: ProgramDay } {
  const newDay: ProgramDay = {
    ...day,
    exercises: [...day.exercises, { name, targets: [{ reps: 10, weight: 0 }] }],
  };
  const session: SessionState = {
    ...state,
    loggedSets: [...state.loggedSets, []],
    targetCounts: [...state.targetCounts, 1],
    extraSetCounts: [...state.extraSetCounts, 0],
  };
  return { session, day: newDay };
}

export function buildSavePayload(
  state: SessionState,
  day: ProgramDay,
  date: string
): Session {
  const exercises = day.exercises
    .map((ex, i) => ({
      name: ex.name,
      sets: state.loggedSets[i].map(s => ({
        reps: s.reps,
        weight: s.weight,
        isWarmup: false,
        isBodyweight: s.weight === 0,
      })),
      targets: ex.targets,
    }))
    .filter(ex => ex.sets.length > 0);

  return { date, exercises };
}
