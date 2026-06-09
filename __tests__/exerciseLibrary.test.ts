import {
  exactMatch,
  lookupById,
  classifyMuscle,
} from '../src/domain/exerciseLibrary';

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

describe('lookupById', () => {
  it('returns the library entry for a known id', () => {
    const entry = lookupById('Barbell_Squat');
    expect(entry).not.toBeNull();
    expect(entry!.name).toBe('Barbell Squat');
  });

  it('returns null for an unknown id', () => {
    expect(lookupById('does_not_exist')).toBeNull();
  });
});

describe('classifyMuscle', () => {
  it('classifies chest as push', () => expect(classifyMuscle('chest')).toBe('push'));
  it('classifies lats as pull', () => expect(classifyMuscle('lats')).toBe('pull'));
  it('classifies quadriceps as legs', () => expect(classifyMuscle('quadriceps')).toBe('legs'));
  it('classifies abdominals as core', () => expect(classifyMuscle('abdominals')).toBe('core'));
  it('classifies unknown muscle as core', () => expect(classifyMuscle('neck')).toBe('core'));
});

