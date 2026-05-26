export const WEIGHT_STEPS = [
  0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30,
  32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60,
  62.5, 65, 67.5, 70, 72.5, 75, 80, 82.5, 85, 87.5, 90, 95, 100,
];

export function nextWeight(current: number, dir: 1 | -1): number {
  const idx = WEIGHT_STEPS.indexOf(current);
  if (idx === -1) {
    if (dir === 1) {
      return WEIGHT_STEPS.find(w => w > current) ?? WEIGHT_STEPS[WEIGHT_STEPS.length - 1];
    }
    const below = WEIGHT_STEPS.filter(w => w < current);
    return below.length > 0 ? below[below.length - 1] : WEIGHT_STEPS[0];
  }
  const next = idx + dir;
  if (next < 0) return WEIGHT_STEPS[0];
  if (next >= WEIGHT_STEPS.length) return WEIGHT_STEPS[WEIGHT_STEPS.length - 1];
  return WEIGHT_STEPS[next];
}
