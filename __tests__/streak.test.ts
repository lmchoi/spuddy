import { getCurrentStreak, getLongestStreak } from '../src/domain/streak';

const TODAY = '2026-05-23';

describe('getCurrentStreak', () => {
  it('returns 0 for empty sessions', () => {
    expect(getCurrentStreak([], TODAY)).toBe(0);
  });

  it('returns 1 when only today has a session', () => {
    expect(getCurrentStreak(['2026-05-23'], TODAY)).toBe(1);
  });

  it('returns 1 when only yesterday has a session (today not yet logged)', () => {
    expect(getCurrentStreak(['2026-05-22'], TODAY)).toBe(1);
  });

  it('returns 0 when last session was 2+ days ago', () => {
    expect(getCurrentStreak(['2026-05-21'], TODAY)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(getCurrentStreak(['2026-05-21', '2026-05-22', '2026-05-23'], TODAY)).toBe(3);
  });

  it('counts consecutive days ending yesterday', () => {
    expect(getCurrentStreak(['2026-05-20', '2026-05-21', '2026-05-22'], TODAY)).toBe(3);
  });

  it('stops counting at a gap', () => {
    const dates = ['2026-05-19', '2026-05-21', '2026-05-22', '2026-05-23'];
    expect(getCurrentStreak(dates, TODAY)).toBe(3);
  });

  it('counts multiple sessions on the same day as 1', () => {
    const dates = ['2026-05-22', '2026-05-22', '2026-05-23'];
    expect(getCurrentStreak(dates, TODAY)).toBe(2);
  });
});

describe('getLongestStreak', () => {
  it('returns 0 for empty sessions', () => {
    expect(getLongestStreak([])).toBe(0);
  });

  it('returns 1 for a single session', () => {
    expect(getLongestStreak(['2026-05-23'])).toBe(1);
  });

  it('returns the longer of two separated runs', () => {
    const dates = [
      '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
      '2026-05-10', '2026-05-11', '2026-05-12',
    ];
    expect(getLongestStreak(dates)).toBe(5);
  });

  it('deduplicates same-day sessions before counting', () => {
    const dates = ['2026-05-01', '2026-05-01', '2026-05-02'];
    expect(getLongestStreak(dates)).toBe(2);
  });
});
