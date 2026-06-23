import { searchLibrary } from '../src/domain/searchLibrary';

describe('searchLibrary', () => {
  it('empty query returns empty array', () => {
    expect(searchLibrary('')).toEqual([]);
  });

  it('matches mid-word substring case-insensitively', () => {
    const results = searchLibrary('sit');
    expect(results.some(r => r.name.toLowerCase().includes('sit'))).toBe(true);
  });

  it('results are capped at 20', () => {
    const results = searchLibrary('e');
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('results are in alphabetical order', () => {
    const results = searchLibrary('press');
    const sorted = [...results].sort((a, b) => a.name.localeCompare(b.name));
    expect(results).toEqual(sorted);
  });

  it('returns libraryId alongside name', () => {
    const results = searchLibrary('3/4 sit');
    expect(results).toContainEqual({ name: '3/4 Sit-Up', libraryId: '3_4_Sit-Up' });
  });
});
