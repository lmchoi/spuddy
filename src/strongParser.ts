import type { ImportedHistory, ImportedWorkoutGroup, Session, ExerciseEntry, WorkingSet } from './types';

export function parseStrongCsv(text: string): ImportedHistory {
  if (!text.trim()) return { workoutGroups: [] };

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { workoutGroups: [] };

  const header = lines[0];
  const delim = header.split(';').length >= header.split(',').length ? ';' : ',';

  const cols = parseRow(header, delim);
  const idx = {
    date: cols.indexOf('Date'),
    workoutName: cols.indexOf('Workout Name'),
    exerciseName: cols.indexOf('Exercise Name'),
    setOrder: cols.indexOf('Set Order'),
    weight: findCol(cols, ['Weight (kg)', 'Weight (lbs)', 'Weight']),
    reps: cols.indexOf('Reps'),
    rpe: cols.indexOf('RPE'),
    distance: cols.indexOf('Distance (meters)'),
    seconds: cols.indexOf('Seconds'),
  };

  // workoutName → date → exerciseName → rows[]
  const workoutMap = new Map<string, Map<string, Map<string, Row[]>>>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseRow(lines[i], delim);
    if (fields.length < 8) continue;

    const exerciseNameRaw = fields[idx.exerciseName] ?? '';
    const setOrder = fields[idx.setOrder] ?? '';
    if (exerciseNameRaw === 'Rest Timer' || setOrder === 'Rest Timer') continue;

    const workoutName = fields[idx.workoutName] ?? '';
    const dateRaw = fields[idx.date] ?? '';
    const date = dateRaw.slice(0, 10); // YYYY-MM-DD

    if (!workoutName || !date) continue;

    if (!workoutMap.has(workoutName)) workoutMap.set(workoutName, new Map());
    const dateMap = workoutMap.get(workoutName)!;

    if (!dateMap.has(date)) dateMap.set(date, new Map());
    const exerciseMap = dateMap.get(date)!;

    if (!exerciseMap.has(exerciseNameRaw)) exerciseMap.set(exerciseNameRaw, []);
    exerciseMap.get(exerciseNameRaw)!.push({
      weight: parseFloat(fields[idx.weight] ?? '0') || 0,
      reps: parseInt(fields[idx.reps] ?? '0', 10) || 0,
      rpe: parseOptionalNumber(fields[idx.rpe]),
      distance: parseOptionalNumber(fields[idx.distance]),
      seconds: parseOptionalNumber(fields[idx.seconds]),
    });
  }

  if (workoutMap.size === 0) return { workoutGroups: [] };

  const workoutGroups: ImportedWorkoutGroup[] = [];

  for (const [workoutName, dateMap] of workoutMap) {
    const equipmentHints: Record<string, string | null> = {};
    const sessions: Session[] = [];

    for (const [date, exerciseMap] of dateMap) {
      const exercises: ExerciseEntry[] = [];

      for (const [exerciseNameRaw, rows] of exerciseMap) {
        const { name, hint } = stripEquipmentSuffix(exerciseNameRaw);
        if (!(name in equipmentHints)) {
          equipmentHints[name] = hint;
        }

        const sets: WorkingSet[] = rows.map(r => {
          const set: WorkingSet = {
            reps: r.reps,
            weight: r.weight,
            isWarmup: false,
            isBodyweight: false,
          };
          if (r.rpe !== undefined) set.rpe = r.rpe;
          if (r.distance !== undefined) set.distanceMeters = r.distance;
          if (r.seconds !== undefined) set.durationSeconds = r.seconds;
          return set;
        });

        exercises.push({ name, sets, targets: [] });
      }

      sessions.push({ date, exercises });
    }

    const dates = sessions.map(s => s.date).sort();
    workoutGroups.push({
      name: workoutName,
      sessionCount: sessions.length,
      lastUsed: dates[dates.length - 1],
      sessions,
      equipmentHints,
    });
  }

  return { workoutGroups };
}

type Row = {
  weight: number;
  reps: number;
  rpe?: number;
  distance?: number;
  seconds?: number;
};

function findCol(cols: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = cols.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

function stripEquipmentSuffix(name: string): { name: string; hint: string | null } {
  const match = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { name: name.trim(), hint: null };
  return { name: match[1].trim(), hint: match[2].trim() };
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value || value.trim() === '') return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

function parseRow(line: string, delim: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
