import { styles } from '../styles/tabs/add.styles';
import { T } from '../src/theme';

describe('add screen styles — spacing', () => {
  it('uses screen-edge token everywhere', () => {
    expect(styles.header.paddingHorizontal).toBe(T.spacing.screenEdge);
    expect(styles.scrollContent.paddingHorizontal).toBe(T.spacing.screenEdge);
    expect(styles.stickyBar.paddingHorizontal).toBe(T.spacing.screenEdge);
  });
});
