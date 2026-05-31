import { styles } from '../styles/log-session.styles';
import { T } from '../src/theme';

describe('log-session styles — spacing', () => {
  it('uses screen-edge token everywhere', () => {
    expect(styles.header.paddingHorizontal).toBe(T.spacing.screenEdge);
    expect(styles.strip.paddingHorizontal).toBe(T.spacing.screenEdge);
    expect(styles.scrollContent.paddingHorizontal).toBe(T.spacing.screenEdge);
    expect(styles.bottom.paddingHorizontal).toBe(T.spacing.screenEdge);
  });
});
