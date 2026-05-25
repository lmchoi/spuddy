import type { Target } from '../types';

export function fmtRest(s: number): string {
  if (s >= 60 && s % 60 === 0) return `${s / 60} min`;
  return `${s}s`;
}

export function fmtKg(kg: number, unit: 'kg' | 'lb'): string {
  return `${kg} ${unit}`;
}

export function targetsUniform(targets: Target[]): boolean {
  if (targets.length <= 1) return true;
  const t0 = targets[0];
  return targets.every(
    t =>
      t.reps === t0.reps &&
      t.minReps === t0.minReps &&
      t.weight === t0.weight &&
      t.restSeconds === t0.restSeconds
  );
}

export function uniformRest(targets: Target[]): number | null {
  if (targets.length === 0) return null;
  const r0 = targets[0].restSeconds;
  if (r0 == null) return null;
  return targets.every(t => t.restSeconds === r0) ? r0 : null;
}

function fmtReps(t: Target): string {
  if (t.minReps != null) return `${t.minReps}–${t.reps}`;
  return String(t.reps);
}

export function summaryLine(targets: Target[], unit: 'kg' | 'lb'): string | null {
  if (targets.length === 0) return null;
  const sets = targets.length;
  const t0 = targets[0];

  const uniformReps = targets.every(t => t.reps === t0.reps && t.minReps === t0.minReps);
  const repsStr = uniformReps ? fmtReps(t0) : '?';

  const hasWeight = targets.some(t => t.weight !== undefined);
  let weightStr = '';
  if (hasWeight) {
    const uniWeight = targets.every(t => t.weight === t0.weight);
    if (uniWeight && t0.weight !== undefined) {
      weightStr = t0.weight === 0 ? ' BW' : ` @ ${fmtKg(t0.weight, unit)}`;
    } else if (!uniWeight) {
      weightStr = ' @ ?';
    }
  }

  const rest = uniformRest(targets);
  const restStr = rest != null ? ` · rest ${fmtRest(rest)}` : '';

  return `${sets} × ${repsStr}${weightStr}${restStr}`;
}
