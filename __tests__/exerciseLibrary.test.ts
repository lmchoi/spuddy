import { exactMatch } from '../src/domain/exerciseLibrary';

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


