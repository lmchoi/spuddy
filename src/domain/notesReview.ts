import type { ParsedExercise } from '../notesParser';

export function formatExerciseMeta(
  ex: ParsedExercise,
  inferredUnit: 'kg' | 'lbs' | null,
): string {
  const unit = ex.explicitUnit ?? inferredUnit ?? '';
  const weightStr = ex.weight > 0 ? `${ex.weight}${unit}` : null;

  const countStr = (() => {
    if (ex.sets !== null && ex.reps !== null) return `${ex.sets}×${ex.reps}`;
    if (ex.sets !== null) return `${ex.sets} ${ex.sets === 1 ? 'set' : 'sets'}`;
    if (ex.reps !== null) return `${ex.reps} ${ex.reps === 1 ? 'rep' : 'reps'}`;
    return null;
  })();

  if (!countStr && !weightStr) return '—';
  if (!countStr) return weightStr!;
  if (!weightStr) return countStr;
  return `${countStr} · ${weightStr}`;
}
