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
};

const BULLET_RE = /^[-•*]\s*/;

// Extracts one number token: optional leading x (set/rep marker), number, optional unit.
const TOKEN_RE = /([xX])?\s*(\d+\.?\d*)\s*(kg|lbs)?/gi;

// Detects compact NxM with no spaces (e.g. "3x12") — distinguishes sets×reps from two bare numbers.
const COMPACT_NXM_RE = /\d+[xX]\d+/i;

function parseUnit(raw: string | undefined): 'kg' | 'lbs' | null {
  if (!raw) return null;
  return raw.toLowerCase() === 'lbs' ? 'lbs' : 'kg';
}

function parseBulletLine(stripped: string): ParsedExercise {
  type Token = { value: number; unit: 'kg' | 'lbs' | null; hasX: boolean };

  const tokens: Token[] = [];
  for (const m of stripped.matchAll(TOKEN_RE)) {
    if (!m[2]) continue;
    tokens.push({ value: parseFloat(m[2]), unit: parseUnit(m[3]), hasX: !!m[1] });
  }

  // Name = strip all tokens (numbers, units, x markers) then clean trailing punctuation.
  const name = stripped.replace(TOKEN_RE, ' ').replace(/\s+/g, ' ').replace(/[-\s]+$/, '').trim();

  if (tokens.length === 0) {
    return { name: stripped.trim(), sets: null, reps: null, weight: 0, explicitUnit: null };
  }

  if (tokens.length === 1) {
    const [t] = tokens;
    return { name, sets: null, reps: null, weight: t.value, explicitUnit: t.unit };
  }

  if (tokens.length === 2) {
    const [a, b] = tokens;
    // Compact NxM with no following weight (e.g. "3x12") — sets × reps, weight unknown.
    if (!a.unit && !b.unit && COMPACT_NXM_RE.test(stripped)) {
      return { name, sets: a.value, reps: b.value, weight: 0, explicitUnit: null };
    }
    // Unit identifies which side is weight.
    if (a.unit) return { name, sets: null, reps: b.value, weight: a.value, explicitUnit: a.unit };
    if (b.unit) return { name, sets: null, reps: a.value, weight: b.value, explicitUnit: b.unit };
    // Two bare numbers — smaller=reps, larger=weight.
    return { name, sets: null, reps: Math.min(a.value, b.value), weight: Math.max(a.value, b.value), explicitUnit: null };
  }

  // 3 tokens: second has x → NxM weight (sets × reps × weight).
  if (tokens[1].hasX) {
    const [s, r, w] = tokens;
    return { name, sets: s.value, reps: r.value, weight: w.value, explicitUnit: w.unit };
  }

  // 3 bare numbers fallback — smallest=sets, middle=reps, largest=weight.
  const [small, mid, large] = [...tokens].sort((a, b) => a.value - b.value);
  return { name, sets: small.value, reps: mid.value, weight: large.value, explicitUnit: large.unit };
}

export function parseWorkoutNotes(text: string): ParsedNotes {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return { sections: [], inferredUnit: null };
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

  return { sections, inferredUnit };
}
