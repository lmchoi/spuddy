export type ParsedExercise = {
  name: string;
  sets: number;
  weight: number;
  explicitUnit: 'kg' | 'lbs' | null;
};

export type ParsedSection = {
  name: string;
  exercises: ParsedExercise[];
};

export type ParsedNotes = {
  sections: ParsedSection[];
  inferredUnit: 'kg' | 'lbs' | null;
  skippedLines: number;
};

const BULLET_RE = /^[-•*]\s*/;

// Pattern 1: "Nx weight[unit]" — e.g. "2x 15kg", "3 x 80"
// Requires whitespace between x and the weight number so reps-only like "3x12" are not matched.
const NX_WEIGHT_RE = /^(.+?)\s+(\d+)\s*[xX]\s+(\d+\.?\d*)\s*(kg|lbs)?$/i;

// Pattern 2: "name - weight[unit]" — e.g. "Bench press - 80kg", "Leg press - 68.3"
const NAME_DASH_WEIGHT_RE = /^(.+?)\s*-\s*(\d+\.?\d*)\s*(kg|lbs)?$/i;

// Pattern 3: "name weight[unit]" with explicit unit — e.g. "Bench 80kg", "Squat 225lbs"
const NAME_WEIGHT_UNIT_RE = /^(.+?)\s+(\d+\.?\d*)\s*(kg|lbs)$/i;

function parseUnit(raw: string | undefined): 'kg' | 'lbs' | null {
  if (!raw) return null;
  return raw.toLowerCase() === 'lbs' ? 'lbs' : 'kg';
}

function parseBulletLine(
  stripped: string
): ParsedExercise | 'skipped' {
  // Try pattern 1: Nx weight[unit]
  const nx = stripped.match(NX_WEIGHT_RE);
  if (nx) {
    const name = nx[1].replace(/[-\s]+$/, '').trim();
    const sets = parseInt(nx[2]);
    const weight = parseFloat(nx[3]);
    const explicitUnit = parseUnit(nx[4]);
    return { name, sets, weight, explicitUnit };
  }

  // Try pattern 2: name - weight[unit]
  const nd = stripped.match(NAME_DASH_WEIGHT_RE);
  if (nd) {
    const name = nd[1].trim();
    const weight = parseFloat(nd[2]);
    const explicitUnit = parseUnit(nd[3]);
    return { name, sets: 1, weight, explicitUnit };
  }

  // Try pattern 3: name weight[unit] (explicit unit required)
  const nw = stripped.match(NAME_WEIGHT_UNIT_RE);
  if (nw) {
    const name = nw[1].trim();
    const weight = parseFloat(nw[2]);
    const explicitUnit = parseUnit(nw[3]);
    return { name, sets: 1, weight, explicitUnit };
  }

  return 'skipped';
}

export function parseWorkoutNotes(text: string): ParsedNotes {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return { sections: [], inferredUnit: null, skippedLines: 0 };
  }

  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let skippedLines = 0;
  const units: Set<'kg' | 'lbs'> = new Set();

  for (const line of lines) {
    if (BULLET_RE.test(line)) {
      // Bullet line — parse as exercise
      if (!current) {
        current = { name: 'My Workout', exercises: [] };
        sections.push(current);
      }
      const stripped = line.replace(BULLET_RE, '');
      const result = parseBulletLine(stripped);
      if (result === 'skipped') {
        skippedLines++;
      } else {
        if (result.explicitUnit) units.add(result.explicitUnit);
        current.exercises.push(result);
      }
    } else {
      // Section header
      current = { name: line, exercises: [] };
      sections.push(current);
    }
  }

  let inferredUnit: 'kg' | 'lbs' | null = null;
  if (units.size === 1) {
    inferredUnit = Array.from(units)[0];
  }

  return { sections, inferredUnit, skippedLines };
}
