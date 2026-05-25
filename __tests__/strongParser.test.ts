import { parseStrongCsv } from '../src/strongParser';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SC_HEADER = '"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"';
const CO_HEADER = '"Workout #","Date","Workout Name","Duration (sec)","Exercise Name","Set Order","Weight (kg)","Reps","RPE","Distance (meters)","Seconds","Notes","Workout Notes"';

const SEMICOLON_CSV = [
  SC_HEADER,
  '"1";"2026-05-20 07:22:32";"Push";"3600";"Bench Press (Barbell)";"1";"80";"5";"8";"";"";"";""',
  '"1";"2026-05-20 07:22:32";"Push";"3600";"Bench Press (Barbell)";"2";"80";"5";"";"";"";"";"" ',
  '"1";"2026-05-20 07:22:32";"Push";"3600";"Rest Timer";"1";"0";"0";"";"";"60";"";"" ',
  '"1";"2026-05-20 07:22:32";"Push";"3600";"Overhead Press (Barbell)";"1";"50";"8";"";"";"";"";"" ',
].join('\n');

const COMMA_CSV = [
  CO_HEADER,
  '"1","2026-05-21 08:00:00","Pull","2400","Lat Pulldown (Cable)","1","60","10","","","","",""',
  '"1","2026-05-21 08:00:00","Pull","2400","Lat Pulldown (Cable)","2","60","8","","","","",""',
].join('\n');

const MULTI_DATE_CSV = [
  SC_HEADER,
  '"1";"2026-05-10 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"75";"5";"";"";"";"";"" ',
  '"2";"2026-05-20 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"80";"5";"";"";"";"";"" ',
].join('\n');

const OPTIONAL_FIELDS_CSV = [
  SC_HEADER,
  '"1";"2026-05-20 07:00:00";"Run";"1800";"Running (Treadmill)";"1";"0";"1";"7";"1000";"300";"";"" ',
  '"1";"2026-05-20 07:00:00";"Run";"1800";"Running (Treadmill)";"2";"0";"1";"";"";"";"";"" ',
].join('\n');

const MULTI_WORKOUT_CSV = [
  SC_HEADER,
  '"1";"2026-05-20 07:00:00";"Push";"1800";"Bench Press (Barbell)";"1";"80";"5";"";"";"";"";"" ',
  '"2";"2026-05-21 08:00:00";"Pull";"1800";"Row (Barbell)";"1";"60";"8";"";"";"";"";"" ',
].join('\n');

const NO_SUFFIX_CSV = [
  SC_HEADER,
  '"1";"2026-05-20 07:00:00";"Push";"1800";"Squat";"1";"100";"5";"";"";"";"";"" ',
].join('\n');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseStrongCsv', () => {
  describe('delimiter detection', () => {
    it('parses semicolon-delimited CSV', () => {
      const result = parseStrongCsv(SEMICOLON_CSV);
      expect(result.workoutGroups).toHaveLength(1);
      expect(result.workoutGroups[0].name).toBe('Push');
    });

    it('parses comma-delimited CSV', () => {
      const result = parseStrongCsv(COMMA_CSV);
      expect(result.workoutGroups).toHaveLength(1);
      expect(result.workoutGroups[0].name).toBe('Pull');
    });
  });

  describe('Rest Timer rows', () => {
    it('excludes Rest Timer rows from sets', () => {
      const result = parseStrongCsv(SEMICOLON_CSV);
      const session = result.workoutGroups[0].sessions[0];
      const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
      // Bench Press (2 sets) + OHP (1 set) — Rest Timer excluded
      expect(totalSets).toBe(3);
    });

    it('does not create an exercise entry for Rest Timer', () => {
      const result = parseStrongCsv(SEMICOLON_CSV);
      const names = result.workoutGroups[0].sessions[0].exercises.map(e => e.name);
      expect(names).not.toContain('Rest Timer');
    });
  });

  describe('equipment suffix stripping', () => {
    it('strips (Equipment) suffix from exercise name', () => {
      const result = parseStrongCsv(SEMICOLON_CSV);
      const names = result.workoutGroups[0].sessions[0].exercises.map(e => e.name);
      expect(names).toContain('Bench Press');
      expect(names).not.toContain('Bench Press (Barbell)');
    });

    it('stores equipment hint in equipmentHints map', () => {
      const hints = parseStrongCsv(SEMICOLON_CSV).workoutGroups[0].equipmentHints;
      expect(hints['Bench Press']).toBe('Barbell');
    });

    it('stores null hint for exercise without suffix', () => {
      const hints = parseStrongCsv(NO_SUFFIX_CSV).workoutGroups[0].equipmentHints;
      expect(hints['Squat']).toBeNull();
    });
  });

  describe('date parsing', () => {
    it('truncates datetime to YYYY-MM-DD for session date', () => {
      const result = parseStrongCsv(SEMICOLON_CSV);
      expect(result.workoutGroups[0].sessions[0].date).toBe('2026-05-20');
    });

    it('preserves multiple sessions on different dates', () => {
      const sessions = parseStrongCsv(MULTI_DATE_CSV).workoutGroups[0].sessions;
      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.date).sort()).toEqual(['2026-05-10', '2026-05-20']);
    });
  });

  describe('workout group metadata', () => {
    it('sets sessionCount correctly', () => {
      expect(parseStrongCsv(MULTI_DATE_CSV).workoutGroups[0].sessionCount).toBe(2);
    });

    it('sets lastUsed to the most recent date', () => {
      expect(parseStrongCsv(MULTI_DATE_CSV).workoutGroups[0].lastUsed).toBe('2026-05-20');
    });
  });

  describe('WorkingSet field mapping', () => {
    it('maps weight and reps', () => {
      const set = parseStrongCsv(SEMICOLON_CSV).workoutGroups[0].sessions[0].exercises[0].sets[0];
      expect(set.weight).toBe(80);
      expect(set.reps).toBe(5);
    });

    it('maps RPE when present', () => {
      const set = parseStrongCsv(OPTIONAL_FIELDS_CSV).workoutGroups[0].sessions[0].exercises[0].sets[0];
      expect(set.rpe).toBe(7);
    });

    it('leaves RPE undefined when empty', () => {
      const set = parseStrongCsv(OPTIONAL_FIELDS_CSV).workoutGroups[0].sessions[0].exercises[0].sets[1];
      expect(set.rpe).toBeUndefined();
    });

    it('maps distanceMeters when present', () => {
      const set = parseStrongCsv(OPTIONAL_FIELDS_CSV).workoutGroups[0].sessions[0].exercises[0].sets[0];
      expect(set.distanceMeters).toBe(1000);
    });

    it('maps durationSeconds when present', () => {
      const set = parseStrongCsv(OPTIONAL_FIELDS_CSV).workoutGroups[0].sessions[0].exercises[0].sets[0];
      expect(set.durationSeconds).toBe(300);
    });

    it('sets isWarmup: false for all imported sets', () => {
      const sets = parseStrongCsv(SEMICOLON_CSV).workoutGroups[0].sessions[0].exercises.flatMap(e => e.sets);
      sets.forEach(s => expect(s.isWarmup).toBe(false));
    });

    it('sets isBodyweight: false for all imported sets', () => {
      const sets = parseStrongCsv(SEMICOLON_CSV).workoutGroups[0].sessions[0].exercises.flatMap(e => e.sets);
      sets.forEach(s => expect(s.isBodyweight).toBe(false));
    });

    it('sets targets: [] for all imported exercises', () => {
      const exercises = parseStrongCsv(SEMICOLON_CSV).workoutGroups[0].sessions[0].exercises;
      exercises.forEach(e => expect(e.targets).toEqual([]));
    });
  });

  describe('edge cases', () => {
    it('returns empty workoutGroups for empty input', () => {
      expect(parseStrongCsv('').workoutGroups).toHaveLength(0);
    });

    it('returns empty workoutGroups for header-only CSV', () => {
      expect(parseStrongCsv(SC_HEADER + '\n').workoutGroups).toHaveLength(0);
    });

    it('groups multiple workout names into separate groups', () => {
      const result = parseStrongCsv(MULTI_WORKOUT_CSV);
      expect(result.workoutGroups).toHaveLength(2);
      expect(result.workoutGroups.map(g => g.name).sort()).toEqual(['Pull', 'Push']);
    });
  });
});
