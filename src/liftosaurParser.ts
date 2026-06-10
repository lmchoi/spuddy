import type { Session, ExerciseEntry, WorkingSet, Target } from './types';

type ParseError = { error: string };

const LBS_TO_KG = 0.453592;

type LiftosaurWeight = { value: number; unit: 'kg' | 'lb' };

type LiftosaurSet = {
  reps?: number;
  minReps?: number;
  weight?: LiftosaurWeight | null;
  isCompleted?: boolean;
  completedReps?: number;
  completedWeight?: LiftosaurWeight | null;
};

function toKg(w: LiftosaurWeight | null | undefined): number {
  if (!w) return 0;
  return w.unit === 'lb' ? w.value * LBS_TO_KG : w.value;
}

function parseSet(raw: LiftosaurSet, isWarmup: boolean): WorkingSet | null {
  if (raw.isCompleted !== true) return null;
  if (raw.completedWeight == null) {
    console.warn('[liftosaur] completed set has no completedWeight — storing weight as 0');
  }
  return {
    reps: raw.completedReps ?? null,
    weight: toKg(raw.completedWeight),
    isWarmup,
    isBodyweight: false,
  };
}

function parseTarget(raw: LiftosaurSet): Target | null {
  if (raw.isCompleted !== true) return null;
  const target: Target = { reps: raw.reps ?? 0 };
  if (raw.minReps !== undefined) target.minReps = raw.minReps;
  if (raw.weight != null) target.weight = toKg(raw.weight);
  return target;
}

function parseEntry(entry: Record<string, unknown>): ExerciseEntry | null {
  const exercise = entry.exercise as Record<string, unknown> | undefined;
  const name = exercise?.name as string | undefined;
  if (!name) {
    console.warn('[liftosaur] entry has no exercise name — skipping');
    return null;
  }

  const warmupSets = (entry.warmupSets as LiftosaurSet[] | undefined) ?? [];
  const workingSets = (entry.sets as LiftosaurSet[] | undefined) ?? [];

  const sets: WorkingSet[] = [];
  const targets: Target[] = [];

  for (const ws of warmupSets) {
    const parsed = parseSet(ws, true);
    if (parsed) sets.push(parsed);
  }

  for (const s of workingSets) {
    const parsed = parseSet(s, false);
    if (parsed) sets.push(parsed);
    const target = parseTarget(s);
    if (target) targets.push(target);
  }

  return { name, sets, targets };
}

export function parseHistoryFromBackup(json: unknown): Session[] | ParseError {
  try {
    if (json === null || typeof json !== 'object') {
      return { error: 'Invalid backup: expected an object' };
    }

    const data = json as Record<string, unknown>;
    const history = data.history;

    if (!Array.isArray(history)) {
      return { error: 'Invalid backup: history field is not an array' };
    }

    const sessions: Session[] = [];

    for (const record of history) {
      const hr = record as Record<string, unknown>;
      const id = hr.id;
      const dateRaw = hr.date as string | undefined;
      const date = dateRaw?.slice(0, 10);
      const entries = hr.entries as unknown[] | undefined;

      if (id == null || !date || !Array.isArray(entries)) {
        console.warn('[liftosaur] skipping record missing id, date, or entries', { id, date, hasEntries: Array.isArray(entries) });
        continue;
      }

      const exercises: ExerciseEntry[] = [];
      for (const entry of entries) {
        const parsed = parseEntry(entry as Record<string, unknown>);
        if (parsed) exercises.push(parsed);
      }

      if (exercises.length === 0) {
        console.warn('[liftosaur] session has no valid exercises after filtering — skipping', { id, date });
        continue;
      }

      sessions.push({
        date,
        exercises,
        source: 'liftosaur',
        sourceId: String(id),
      });
    }

    return sessions;
  } catch {
    return { error: 'Failed to parse backup JSON' };
  }
}
