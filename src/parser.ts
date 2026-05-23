import type { ExerciseEntry, Session, Target, WorkingSet } from './types';

export function parseLiftohistoryText(text: string): Session | null {
  const exercisesMarker = 'exercises: {';
  const markerIdx = text.indexOf(exercisesMarker);
  if (markerIdx === -1) return null;

  const headerStr = text.slice(0, markerIdx);
  const afterMarker = text.slice(markerIdx + exercisesMarker.length);
  const closingBrace = afterMarker.lastIndexOf('}');
  if (closingBrace === -1) return null;
  const exercisesBlock = afterMarker.slice(0, closingBrace);

  const dateMatch = headerStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;
  const date = dateMatch[1];

  const lines = exercisesBlock
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const exercises: ExerciseEntry[] = [];

  for (const line of lines) {
    const entry = parseExerciseLine(line);
    if (entry) exercises.push(entry);
  }

  if (exercises.length === 0) return null;

  return { date, exercises };
}

function parseExerciseLine(line: string): ExerciseEntry | null {
  const segments = line.split(' / ');
  if (segments.length < 2) return null;

  const name = segments[0].trim();
  let completedStr: string | undefined;
  let warmupStr: string | undefined;
  let targetStr: string | undefined;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (seg.startsWith('warmup:')) {
      warmupStr = seg.slice('warmup:'.length).trim();
    } else if (seg.startsWith('target:')) {
      targetStr = seg.slice('target:'.length).trim();
    } else {
      completedStr = seg;
    }
  }

  const warmupSets = warmupStr ? parseWorkingSets(warmupStr, true) : [];
  const workingSets = completedStr ? parseWorkingSets(completedStr, false) : [];
  const targets = targetStr ? parseTargets(targetStr) : [];

  return { name, sets: [...warmupSets, ...workingSets], targets };
}

function parseWorkingSets(str: string, isWarmup: boolean): WorkingSet[] {
  const sets: WorkingSet[] = [];
  for (const descriptor of str.split(', ')) {
    const match = descriptor
      .trim()
      .match(/^(\d+)x([\d\-|+]+)\s*(\d+\.?\d*kg)?\s*(\d+s)?/);
    if (!match) continue;

    const count = parseInt(match[1]);
    const repsSpec = match[2];
    const weight = match[3] ? parseFloat(match[3]) : 0;
    const isBodyweight = weight === 0;

    let reps: number;
    let repsLeft: number | undefined;

    if (repsSpec.includes('|')) {
      const [r, l] = repsSpec.split('|');
      reps = parseInt(r);
      repsLeft = parseInt(l);
    } else if (repsSpec.includes('-')) {
      reps = parseInt(repsSpec.split('-')[1]); // upper bound
    } else {
      reps = parseInt(repsSpec.replace('+', ''));
    }

    for (let i = 0; i < count; i++) {
      sets.push({ reps, repsLeft, weight, isWarmup, isBodyweight });
    }
  }
  return sets;
}

function parseTargets(str: string): Target[] {
  const targets: Target[] = [];
  for (const descriptor of str.split(', ')) {
    const match = descriptor
      .trim()
      .match(/^(\d+)x([\d\-]+)\s*(\d+\.?\d*kg)?\s*(\d+s)?/);
    if (!match) continue;

    const count = parseInt(match[1]);
    const repsSpec = match[2];
    const weight = match[3] ? parseFloat(match[3]) : undefined;
    const restSeconds = match[4] ? parseInt(match[4]) : undefined;

    let reps: number;
    let minReps: number | undefined;

    if (repsSpec.includes('-')) {
      const [min, max] = repsSpec.split('-');
      minReps = parseInt(min);
      reps = parseInt(max);
    } else {
      reps = parseInt(repsSpec);
    }

    for (let i = 0; i < count; i++) {
      targets.push({ reps, minReps, weight, restSeconds });
    }
  }
  return targets;
}
