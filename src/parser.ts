import type { ExerciseEntry, Session, Target, WorkingSet } from './types';

export type ParseLine = { raw: string; kind: 'ok' | 'warn' | 'error'; note?: string };

export type ParseResult =
  | { ok: true; date: string; exercises: ExerciseEntry[]; lines: ParseLine[] }
  | { ok: false; date: string | null; exercises: ExerciseEntry[]; lines: ParseLine[] };

export function parseLiftohistoryTextDetailed(text: string): ParseResult {
  const exercisesMarker = 'exercises: {';
  const markerIdx = text.indexOf(exercisesMarker);
  if (markerIdx === -1) return { ok: false, date: null, exercises: [], lines: [] };

  const headerStr = text.slice(0, markerIdx);
  const afterMarker = text.slice(markerIdx + exercisesMarker.length);
  const closingBrace = afterMarker.lastIndexOf('}');
  if (closingBrace === -1) return { ok: false, date: null, exercises: [], lines: [] };
  const exercisesBlock = afterMarker.slice(0, closingBrace);

  const dateMatch = headerStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return { ok: false, date: null, exercises: [], lines: [] };
  const date = dateMatch[1];

  const rawLines = exercisesBlock
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const lines: ParseLine[] = [];
  const exercises: ExerciseEntry[] = [];

  for (const raw of rawLines) {
    const classified = classifyExerciseLine(raw);
    lines.push({ raw, kind: classified.kind, note: classified.note });
    if (classified.kind === 'ok') exercises.push(classified.entry);
  }

  const ok = exercises.length > 0;
  return ok ? { ok: true, date, exercises, lines } : { ok: false, date, exercises, lines };
}

export function parseLiftohistoryText(text: string): Session | null {
  const result = parseLiftohistoryTextDetailed(text);
  if (!result.ok) return null;
  return { date: result.date, exercises: result.exercises };
}

type ClassifiedLine =
  | { kind: 'ok'; entry: ExerciseEntry; note?: undefined }
  | { kind: 'warn'; note: string }
  | { kind: 'error'; note: string };

function classifyExerciseLine(line: string): ClassifiedLine {
  const segments = line.split(' / ');
  if (segments.length < 2) {
    return { kind: 'error', note: 'Missing separator — expected "Name / sets"' };
  }

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
  const sets = [...warmupSets, ...workingSets];

  if (sets.length === 0) {
    return { kind: 'warn', note: 'No sets found — check format (e.g. 3x8 60kg)' };
  }

  return { kind: 'ok', entry: { name, sets, targets } };
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
