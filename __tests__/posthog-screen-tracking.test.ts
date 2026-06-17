jest.mock('@/src/config/posthog', () => ({
  posthog: { screen: jest.fn(), capture: jest.fn(), debug: jest.fn() },
}));

import { posthog } from '@/src/config/posthog';
import { trackScreen } from '@/src/analytics/screenTracking';

beforeEach(() => { (posthog.screen as jest.Mock).mockClear(); });

describe('trackScreen', () => {
  it('calls posthog.screen with the route name', () => {
    trackScreen('HomeScreen');
    expect(posthog.screen).toHaveBeenCalledWith('HomeScreen');
  });

  it('does not call posthog.screen when route name is undefined', () => {
    trackScreen(undefined);
    expect(posthog.screen).not.toHaveBeenCalled();
  });
});
