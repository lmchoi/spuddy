/**
 * Faithful record of what the user wrote for one exercise line.
 * Null means the user did not specify that value — it is NOT a default.
 * Defaults are applied downstream in notesImport.ts when building program targets.
 */
export type ParsedExercise = {
  name: string;
  sets: number | null;   // null when no explicit set count was written
  reps: number | null;   // null when no explicit rep count was written
  weight: number;        // 0 when no weight could be found in the line
  explicitUnit: 'kg' | 'lbs' | null;
};

/** One section header and its exercises, mirroring the structure of the user's notes. */
export type ParsedSection = {
  name: string;
  exercises: ParsedExercise[];
};

/**
 * Output of parseWorkoutNotes — a structured view of the raw text.
 * This is a read-only snapshot; nothing here is stored directly to the database.
 * Pass it to importFromNotes (notesImport.ts) to turn it into programs.
 */
export type ParsedNotes = {
  sections: ParsedSection[];
  inferredUnit: 'kg' | 'lbs' | null; // set when all explicit units in the notes agree
  skippedLines: number;
};

const BULLET_RE = /^[-•*]\s*/;

// NxM weight[unit] — x directly between two numbers, then weight: "3x10 80kg"
const NXM_WEIGHT_RE = /^(.+?)\s+(\d+)[xX](\d+)\s+(\d+\.?\d*)\s*(kg|lbs)?$/i;

// NxM — sets × reps but no weight: "3x12"
const NXM_NO_WEIGHT_RE = /^(.+?)\s+(\d+)[xX](\d+)$/i;

// weight[unit] x N — unit on the left of x makes weight unambiguous: "80kg x 3"
const WEIGHT_UNIT_X_REPS_RE = /^(.+?)\s+(\d+\.?\d*)\s*(kg|lbs)\s+[xX]\s*(\d+)$/i;

// N x weight[unit] or N x N — reps × weight or heuristic: "3x 80kg", "3 x 80", "80 x 3"
// For no-unit case apply smaller=reps / larger=weight heuristic.
const N_X_WEIGHT_RE = /^(.+?)\s+(\d+\.?\d*)\s*[xX]\s+(\d+\.?\d*)\s*(kg|lbs)?$/i;

// name - weight[unit]: "Bench press - 80kg"
const NAME_DASH_WEIGHT_RE = /^(.+?)\s*-\s*(\d+\.?\d*)\s*(kg|lbs)?$/i;

// name weight[unit] with explicit unit: "Bench 80kg"
const NAME_WEIGHT_UNIT_RE = /^(.+?)\s+(\d+\.?\d*)\s*(kg|lbs)$/i;

// Two bare numbers — smaller=reps, larger=weight: "10 80", "80 10"
const TWO_NUMBERS_RE = /^(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/;

// Single bare number — treat as weight: "Bench 80"
const SINGLE_NUMBER_RE = /^(.+?)\s+(\d+\.?\d*)$/;

function parseUnit(raw: string | undefined): 'kg' | 'lbs' | null {
  if (!raw) return null;
  return raw.toLowerCase() === 'lbs' ? 'lbs' : 'kg';
}

function cleanName(raw: string): string {
  return raw.replace(/[-\s]+$/, '').trim();
}

function parseBulletLine(stripped: string): ParsedExercise {
  // NxM weight — sets × reps × weight
  const nxmW = stripped.match(NXM_WEIGHT_RE);
  if (nxmW) {
    return { name: cleanName(nxmW[1]), sets: parseInt(nxmW[2]), reps: parseInt(nxmW[3]), weight: parseFloat(nxmW[4]), explicitUnit: parseUnit(nxmW[5]) };
  }

  // NxM (no weight) — sets × reps, weight unknown
  const nxm = stripped.match(NXM_NO_WEIGHT_RE);
  if (nxm) {
    return { name: cleanName(nxm[1]), sets: parseInt(nxm[2]), reps: parseInt(nxm[3]), weight: 0, explicitUnit: null };
  }

  // weight[unit] x N — unit disambiguates which side is weight
  const wXn = stripped.match(WEIGHT_UNIT_X_REPS_RE);
  if (wXn) {
    return { name: cleanName(wXn[1]), sets: null, reps: parseInt(wXn[4]), weight: parseFloat(wXn[2]), explicitUnit: parseUnit(wXn[3]) };
  }

  // N x weight[unit] or N x N — if unit present it's on weight; otherwise heuristic
  const nXw = stripped.match(N_X_WEIGHT_RE);
  if (nXw) {
    const a = parseFloat(nXw[2]);
    const b = parseFloat(nXw[3]);
    const explicitUnit = parseUnit(nXw[4]);
    const weight = explicitUnit ? b : Math.max(a, b);
    const reps = explicitUnit ? a : Math.min(a, b);
    return { name: cleanName(nXw[1]), sets: null, reps, weight, explicitUnit };
  }

  // name - weight[unit]
  const nd = stripped.match(NAME_DASH_WEIGHT_RE);
  if (nd) {
    return { name: nd[1].trim(), sets: null, reps: null, weight: parseFloat(nd[2]), explicitUnit: parseUnit(nd[3]) };
  }

  // name weight[unit] (explicit unit required)
  const nw = stripped.match(NAME_WEIGHT_UNIT_RE);
  if (nw) {
    return { name: nw[1].trim(), sets: null, reps: null, weight: parseFloat(nw[2]), explicitUnit: parseUnit(nw[3]) };
  }

  // Two bare numbers — smaller=reps, larger=weight
  const two = stripped.match(TWO_NUMBERS_RE);
  if (two) {
    const a = parseFloat(two[2]);
    const b = parseFloat(two[3]);
    return { name: cleanName(two[1]), sets: null, reps: Math.min(a, b), weight: Math.max(a, b), explicitUnit: null };
  }

  // Single bare number — weight
  const one = stripped.match(SINGLE_NUMBER_RE);
  if (one) {
    return { name: cleanName(one[1]), sets: null, reps: null, weight: parseFloat(one[2]), explicitUnit: null };
  }

  // No numbers at all — weight=0
  return { name: stripped.trim(), sets: null, reps: null, weight: 0, explicitUnit: null };
}

export function parseWorkoutNotes(text: string): ParsedNotes {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return { sections: [], inferredUnit: null, skippedLines: 0 };
  }

  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  const units: Set<'kg' | 'lbs'> = new Set();

  for (const line of lines) {
    if (BULLET_RE.test(line)) {
      if (!current) {
        current = { name: 'My Workout', exercises: [] };
        sections.push(current);
      }
      const stripped = line.replace(BULLET_RE, '');
      const result = parseBulletLine(stripped);
      if (result.explicitUnit) units.add(result.explicitUnit);
      current.exercises.push(result);
    } else {
      current = { name: line, exercises: [] };
      sections.push(current);
    }
  }

  let inferredUnit: 'kg' | 'lbs' | null = null;
  if (units.size === 1) {
    inferredUnit = Array.from(units)[0];
  }

  return { sections, inferredUnit, skippedLines: 0 };
}
