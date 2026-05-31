import { nextActiveDayIndex } from '../src/domain/programDay';

describe('nextActiveDayIndex', () => {
  it('advances to the next day', () => {
    expect(nextActiveDayIndex(0, 3)).toBe(1);
    expect(nextActiveDayIndex(1, 3)).toBe(2);
  });

  it('wraps to 0 when at the last day', () => {
    expect(nextActiveDayIndex(2, 3)).toBe(0);
  });

  it('wraps with a single-day program', () => {
    expect(nextActiveDayIndex(0, 1)).toBe(0);
  });
});
