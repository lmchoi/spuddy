import { exactMatch, renameLibraryEntry, parseMuscleGroups } from '../src/domain/exerciseLibrary';
import type { ExerciseLibraryRow } from '../src/exerciseStorage';

describe('exactMatch', () => {
  it('returns the library entry for a known exercise name', () => {
    const entry = exactMatch('Barbell Squat');
    expect(entry).not.toBeNull();
    expect(entry!.name).toBe('Barbell Squat');
    expect(entry!.primaryMuscles).toContain('quadriceps');
    expect(entry!.equipment).toBe('barbell');
    expect(entry!.id).toBe('Barbell_Squat');
  });

  it('returns null for an unknown exercise name', () => {
    expect(exactMatch('unknown exercise')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(exactMatch('barbell squat')).not.toBeNull();
    expect(exactMatch('BARBELL SQUAT')).not.toBeNull();
  });

  it('returns entry with correct force and muscles for a push exercise', () => {
    const entry = exactMatch('Barbell Bench Press - Medium Grip');
    expect(entry).not.toBeNull();
    expect(entry!.force).toBe('push');
    expect(entry!.primaryMuscles).toContain('chest');
  });
});

const makeRow = (name: string): ExerciseLibraryRow => ({
  name,
  libraryId: 'some_id',
  muscleGroups: '["chest","triceps"]',
  equipment: 'barbell',
  libraryConfidence: 95,
});

describe('renameLibraryEntry', () => {
  it('returns a new map with the entry under the new name', () => {
    const map = new Map([['Bench Press', makeRow('Bench Press')]]);
    const result = renameLibraryEntry(map, 'Bench Press', 'Barbell Bench Press');
    expect(result.has('Bench Press')).toBe(false);
    expect(result.has('Barbell Bench Press')).toBe(true);
    expect(result.get('Barbell Bench Press')).toEqual(makeRow('Bench Press'));
  });

  it('returns the same map reference when old name is not present', () => {
    const map = new Map<string, ExerciseLibraryRow>();
    const result = renameLibraryEntry(map, 'Ghost', 'New Name');
    expect(result).toBe(map);
  });

  it('returns the same map reference when old and new names are equal', () => {
    const map = new Map([['Squat', makeRow('Squat')]]);
    const result = renameLibraryEntry(map, 'Squat', 'Squat');
    expect(result).toBe(map);
  });
});

describe('parseMuscleGroups', () => {
  it('parses a valid JSON array', () => {
    expect(parseMuscleGroups('["chest","triceps"]')).toEqual(['chest', 'triceps']);
  });

  it('returns empty array for null', () => {
    expect(parseMuscleGroups(null)).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseMuscleGroups('not json')).toEqual([]);
  });
});
