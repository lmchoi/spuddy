import type { Program, ProgramDay, ProgramExercise, Target } from './types';

type ParseError = { error: string };

// Parses a single exerciseText line into a name + raw targets.
// ...Reference lines are returned with empty targets — resolution happens in parseProgramFromBackup.
function parseLine(line: string): ProgramExercise | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;

  const segments = trimmed.split(' / ');
  if (segments.length < 2) return null;

  // Strip optional "label: " prefix from the exercise name
  let name = segments[0].trim();
  const labelMatch = name.match(/^[^/]+:\s+(.+)$/);
  if (labelMatch) name = labelMatch[1].trim();

  // ...Reference — defer resolution to parseProgramFromBackup
  const refSegment = segments.find(s => s.trim().startsWith('...'));
  if (refSegment) {
    return { name, targets: [] };
  }

  // Find the NxM or NxM-M or NxM+ set spec
  const setSegment = segments.find(s => /^\d+x\d/.test(s.trim()));
  if (!setSegment) return null;

  const targets = parseSetSpec(setSegment.trim(), segments);
  return { name, targets };
}

function parseSetSpec(setSpec: string, segments: string[]): Target[] {
  // NxM+, NxM-N, NxM
  const match = setSpec.match(/^(\d+)x(\d+)(?:-(\d+))?(\+)?$/);
  if (!match) return [];

  const sets = parseInt(match[1], 10);
  const minReps = match[3] !== undefined ? parseInt(match[2], 10) : undefined;
  const reps = match[3] !== undefined ? parseInt(match[3], 10) : parseInt(match[2], 10);

  const weightKg = parseWeight(segments);

  const target: Target = { reps };
  if (minReps !== undefined) target.minReps = minReps;
  if (weightKg !== undefined) target.weight = weightKg;

  return Array.from({ length: sets }, () => ({ ...target }));
}

function parseWeight(segments: string[]): number | undefined {
  for (const seg of segments) {
    const t = seg.trim();
    // e.g. "13.5kg" or "100lb"
    const kg = t.match(/^([\d.]+)kg$/);
    if (kg) return parseFloat(kg[1]);
    const lb = t.match(/^([\d.]+)lb$/);
    if (lb) return parseFloat(lb[1]) * 0.453592;
  }
  return undefined;
}

// Parses a multi-line exerciseText blob into raw ProgramExercise[].
// ...Reference lines get empty targets — call parseProgramFromBackup to resolve them.
export function parsePlannerDay(exerciseText: string): ProgramExercise[] {
  const exercises: ProgramExercise[] = [];
  for (const line of exerciseText.split('\n')) {
    const entry = parseLine(line);
    if (entry) exercises.push(entry);
  }
  return exercises;
}

// Extracts the reference name from a "...Name" segment.
function extractRefName(segments: string[]): string | null {
  const refSeg = segments.find(s => s.trim().startsWith('...'));
  if (!refSeg) return null;
  return refSeg.trim().slice(3).trim();
}

function parseSingleProgram(program: Record<string, unknown>): Program | ParseError {
  const name = program.name as string;
  const nextDay = typeof program.nextDay === 'number' ? program.nextDay : 0;

  const planner = program.planner as Record<string, unknown>;
  const weeks = planner?.weeks as unknown[];
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return { error: `No weeks found in program "${name}"` };
  }

  const week0 = weeks[0] as Record<string, unknown>;
  const rawDays = week0.days as Array<Record<string, unknown>>;
  if (!Array.isArray(rawDays)) {
    return { error: `No days found in program "${name}"` };
  }

  // Pass 1: build name → targets map across all days for reference resolution
  const nameToTargets = new Map<string, Target[]>();
  for (const day of rawDays) {
    const text = day.exerciseText as string;
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      const segments = trimmed.split(' / ');
      if (segments.length < 2) continue;
      if (segments.some(s => s.trim().startsWith('...'))) continue;

      let rawName = segments[0].trim();
      const labelMatch = rawName.match(/^[^/]+:\s+(.+)$/);
      if (labelMatch) rawName = labelMatch[1].trim();

      const setSegment = segments.find(s => /^\d+x\d/.test(s.trim()));
      if (!setSegment) continue;

      const targets = parseSetSpec(setSegment.trim(), segments);
      nameToTargets.set(rawName, targets);
    }
  }

  // Pass 2: parse each day, resolving ...References
  const days: ProgramDay[] = rawDays.map(day => {
    const text = day.exerciseText as string;
    const rawExercises: ProgramExercise[] = [];

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const segments = trimmed.split(' / ');
      if (segments.length < 2) continue;

      let exName = segments[0].trim();
      const labelMatch = exName.match(/^[^/]+:\s+(.+)$/);
      if (labelMatch) exName = labelMatch[1].trim();

      const refName = extractRefName(segments);
      if (refName !== null) {
        const resolved = nameToTargets.get(refName) ?? [];
        rawExercises.push({ name: exName, targets: resolved.map(t => ({ ...t })) });
        continue;
      }

      const setSegment = segments.find(s => /^\d+x\d/.test(s.trim()));
      if (!setSegment) continue;

      const targets = parseSetSpec(setSegment.trim(), segments);
      rawExercises.push({ name: exName, targets });
    }

    return { name: day.name as string, exercises: rawExercises };
  });

  return { name, days, activeDayIndex: nextDay };
}

export function parseProgramFromBackup(json: unknown): Program[] | ParseError {
  try {
    const data = json as Record<string, unknown>;
    const programs = data?.programs as unknown[];
    if (!Array.isArray(programs) || programs.length === 0) {
      return { error: 'No programs found in backup' };
    }

    const results: Program[] = [];
    for (const program of programs) {
      const parsed = parseSingleProgram(program as Record<string, unknown>);
      if (!('error' in parsed)) results.push(parsed);
    }

    if (results.length === 0) {
      return { error: 'No valid programs found in backup' };
    }

    return results;
  } catch {
    return { error: 'Failed to parse backup JSON' };
  }
}
