import { parseLiftohistoryText } from '../src/parser';

const REAL_EXPORT = `2026-05-19 19:20:52 +01:00 / program: "starter" / dayName: "Day 1" / week: 1 / dayInWeek: 1 / duration: 2811s / exercises: {
  Face Pull / 1x20 9kg, 1x18 9kg, 1x20 9kg / target: 3x15-20 10kg 45s
  Goblet Squat / 1x6 13.5kg, 2x10 13.5kg / warmup: 1x5 13.5kg / target: 3x10-12 14kg 60s
  Lunge, Dumbbell / 1x3|3 11kg / target: 2x10 60s, 1x10 10kg 60s
  Romanian Deadlift / 3x10 22kg / warmup: 1x5 11kg, 1x5 17kg / target: 3x10-12 22kg 60s
  Plank / 3x30 0kg / target: 3x30 45s
}`;

describe('parseLiftohistoryText', () => {
  describe('real export', () => {
    it('parses the date', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-05-19');
    });

    it('parses all five exercises', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      expect(result!.exercises).toHaveLength(5);
      expect(result!.exercises.map(e => e.name)).toEqual([
        'Face Pull',
        'Goblet Squat',
        'Lunge, Dumbbell',
        'Romanian Deadlift',
        'Plank',
      ]);
    });

    it('parses Face Pull working sets', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const sets = result!.exercises[0].sets.filter(s => !s.isWarmup);
      expect(sets).toHaveLength(3);
      expect(sets[0]).toMatchObject({ reps: 20, weight: 9, isWarmup: false });
      expect(sets[1]).toMatchObject({ reps: 18, weight: 9 });
      expect(sets[2]).toMatchObject({ reps: 20, weight: 9 });
    });

    it('expands grouped sets — Goblet Squat 2x10 becomes two sets', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const sets = result!.exercises[1].sets.filter(s => !s.isWarmup);
      expect(sets).toHaveLength(3); // 1x6 + 2x10
      expect(sets[1]).toMatchObject({ reps: 10, weight: 13.5 });
      expect(sets[2]).toMatchObject({ reps: 10, weight: 13.5 });
    });

    it('separates warmup sets — Goblet Squat', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const warmup = result!.exercises[1].sets.filter(s => s.isWarmup);
      expect(warmup).toHaveLength(1);
      expect(warmup[0]).toMatchObject({ reps: 5, weight: 13.5, isWarmup: true });
    });

    it('separates warmup sets — Romanian Deadlift has two warmup sets', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const ex = result!.exercises[3];
      const warmup = ex.sets.filter(s => s.isWarmup);
      const working = ex.sets.filter(s => !s.isWarmup);
      expect(warmup).toHaveLength(2);
      expect(warmup[0]).toMatchObject({ reps: 5, weight: 11, isWarmup: true });
      expect(warmup[1]).toMatchObject({ reps: 5, weight: 17, isWarmup: true });
      expect(working).toHaveLength(3);
    });

    it('parses unilateral sets — Lunge', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const sets = result!.exercises[2].sets;
      expect(sets).toHaveLength(1);
      expect(sets[0]).toMatchObject({ reps: 3, repsLeft: 3, weight: 11 });
    });

    it('flags bodyweight sets — Plank 0kg', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const sets = result!.exercises[4].sets;
      expect(sets).toHaveLength(3);
      sets.forEach(s => expect(s).toMatchObject({ reps: 30, weight: 0, isBodyweight: true }));
    });

    it('parses rep range targets — Goblet Squat target 3x10-12', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const targets = result!.exercises[1].targets;
      expect(targets).toHaveLength(3);
      targets.forEach(t =>
        expect(t).toMatchObject({ reps: 12, minReps: 10, weight: 14, restSeconds: 60 })
      );
    });

    it('parses targets with no weight — Lunge first target has no weight', () => {
      const result = parseLiftohistoryText(REAL_EXPORT);
      const targets = result!.exercises[2].targets;
      expect(targets).toHaveLength(3); // 2x10 + 1x10
      expect(targets[0].weight).toBeUndefined();
      expect(targets[0].restSeconds).toBe(60);
      expect(targets[2]).toMatchObject({ weight: 10, restSeconds: 60 });
    });
  });

  describe('malformed input', () => {
    it('returns null for empty string', () => {
      expect(parseLiftohistoryText('')).toBeNull();
    });

    it('returns null when exercises block is missing', () => {
      expect(parseLiftohistoryText('2026-05-19 19:20:52 +01:00 / duration: 100s')).toBeNull();
    });

    it('returns null when no exercises are parsed', () => {
      expect(
        parseLiftohistoryText('2026-05-19 19:20:52 +01:00 / exercises: {\n}')
      ).toBeNull();
    });
  });
});
