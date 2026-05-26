import { nextWeight } from '../src/domain/nextWeight';

describe('nextWeight', () => {
  // Values that are in WEIGHT_STEPS
  it('increments a step-aligned value', () => {
    expect(nextWeight(15, 1)).toBe(17.5);
  });

  it('decrements a step-aligned value', () => {
    expect(nextWeight(15, -1)).toBe(12.5);
  });

  it('clamps at the top of the list', () => {
    expect(nextWeight(100, 1)).toBe(100);
  });

  it('clamps at the bottom of the list', () => {
    expect(nextWeight(0, -1)).toBe(0);
  });

  // Values NOT in WEIGHT_STEPS — the bug cases
  it('pressing + from an off-step value snaps UP, not to nearest', () => {
    // 18 is not in WEIGHT_STEPS; nearest is 17.5 but + should go to 20
    expect(nextWeight(18, 1)).toBe(20);
  });

  it('pressing − from an off-step value snaps DOWN', () => {
    // 18 is not in WEIGHT_STEPS; − should go to 17.5
    expect(nextWeight(18, -1)).toBe(17.5);
  });

  it('pressing + from 11 snaps to first step above (12.5)', () => {
    expect(nextWeight(11, 1)).toBe(12.5);
  });

  it('pressing − from 11 snaps to first step below (10)', () => {
    expect(nextWeight(11, -1)).toBe(10);
  });

  it('clamps up when off-step value is above all steps', () => {
    expect(nextWeight(150, 1)).toBe(100);
  });

  it('clamps down when off-step value is below all steps', () => {
    expect(nextWeight(-5, -1)).toBe(0);
  });
});
