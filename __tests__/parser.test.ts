import { parseLiftohistoryText, parseLiftohistoryTextDetailed } from '../src/parser';

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

// ─── parseLiftohistoryTextDetailed ────────────────────────────────────────────

describe('parseLiftohistoryTextDetailed', () => {
  const wrap = (lines: string) =>
    `2026-05-19 19:20:52 +01:00 / exercises: {\n${lines}\n}`;

  describe('real export', () => {
    it('ok: true with all 5 lines classified ok', () => {
      const result = parseLiftohistoryTextDetailed(REAL_EXPORT);
      expect(result.ok).toBe(true);
      expect(result.lines).toHaveLength(5);
      result.lines.forEach(l => expect(l.kind).toBe('ok'));
    });

    it('returns the same date and exercise count as the thin wrapper', () => {
      const result = parseLiftohistoryTextDetailed(REAL_EXPORT);
      expect(result.date).toBe('2026-05-19');
      expect(result.exercises).toHaveLength(5);
    });
  });

  describe('structural failures', () => {
    it('no exercises marker → ok: false, empty lines, null date', () => {
      const r = parseLiftohistoryTextDetailed('2026-05-19 19:20:52 no block here');
      expect(r.ok).toBe(false);
      expect(r.date).toBeNull();
      expect(r.lines).toHaveLength(0);
    });

    it('no date → ok: false, null date', () => {
      const r = parseLiftohistoryTextDetailed('no date here / exercises: {\n  Bench Press / 3x8 60kg\n}');
      expect(r.ok).toBe(false);
      expect(r.date).toBeNull();
    });

    it('empty exercises block → ok: false', () => {
      const r = parseLiftohistoryTextDetailed('2026-05-19 19:20:52 +01:00 / exercises: {\n}');
      expect(r.ok).toBe(false);
      expect(r.lines).toHaveLength(0);
    });
  });

  describe('line classification', () => {
    it('ok — name with valid sets', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  Bench Press / 3x8 60kg'));
      expect(r.lines[0]).toMatchObject({ kind: 'ok', raw: 'Bench Press / 3x8 60kg' });
    });

    it('error — line with no separator', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  notanexercise'));
      expect(r.lines[0]).toMatchObject({ kind: 'error', raw: 'notanexercise' });
    });

    it('warn — separator present but no valid set descriptors produced', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  Bench Press / abc xyz'));
      expect(r.lines[0]).toMatchObject({ kind: 'warn', raw: 'Bench Press / abc xyz' });
    });

    it('all-error lines → ok: false', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  bad\n  alsoBad'));
      expect(r.ok).toBe(false);
      expect(r.lines).toHaveLength(2);
      r.lines.forEach(l => expect(l.kind).toBe('error'));
    });

    it('mixed lines — ok: true when at least one line parses', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  Bench Press / 3x8 60kg\n  bad line'));
      expect(r.ok).toBe(true);
      expect(r.lines[0].kind).toBe('ok');
      expect(r.lines[1].kind).toBe('error');
      expect(r.exercises).toHaveLength(1);
    });

    it('warn lines do not contribute to exercises', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  Bench Press / 3x8 60kg\n  Squat / abc xyz'));
      expect(r.exercises).toHaveLength(1);
      expect(r.exercises[0].name).toBe('Bench Press');
    });

    it('all-warn lines → ok: false', () => {
      const r = parseLiftohistoryTextDetailed(wrap('  Bench Press / abc\n  Squat / xyz'));
      expect(r.ok).toBe(false);
      r.lines.forEach(l => expect(l.kind).toBe('warn'));
    });
  });
});
