import { styles } from '../styles/log-session.styles';

describe('log-session styles — a11y', () => {
  it('backBtn meets 48dp minimum touch target', () => {
    expect(styles.backBtn.minHeight).toBeGreaterThanOrEqual(48);
    expect(styles.backBtn.minWidth).toBeGreaterThanOrEqual(48);
  });
});
