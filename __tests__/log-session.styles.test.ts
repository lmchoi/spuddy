import { styles } from '../styles/log-session.styles';

describe('log-session styles — a11y', () => {
  it('backBtn meets 48dp minimum touch target', () => {
    expect(styles.backBtn.minHeight).toBeGreaterThanOrEqual(48);
    expect(styles.backBtn.minWidth).toBeGreaterThanOrEqual(48);
  });
});

describe('log-session styles — spacing', () => {
  it('uses 16dp screen-edge margin everywhere', () => {
    expect(styles.header.paddingHorizontal).toBe(16);
    expect(styles.strip.paddingHorizontal).toBe(16);
    expect(styles.scrollContent.paddingHorizontal).toBe(16);
    expect(styles.bottom.paddingHorizontal).toBe(16);
  });
});
