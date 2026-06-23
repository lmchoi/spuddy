import React from 'react';
import { render } from '@testing-library/react-native';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../src/config/posthog';
import RootLayout, { unstable_settings } from '../app/_layout';
import * as notifications from '../src/notifications';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: jest.fn((component: unknown) => component),
  reactNavigationIntegration: jest.fn(() => ({ name: 'ReactNavigation', registerNavigationContainer: jest.fn() })),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

const capturedScreens: { name: string; options?: Record<string, unknown> }[] = [];
let capturedScreenOptions: Record<string, unknown> = {};
const mockNavigate = jest.fn();

jest.mock('expo-router', () => {
  const MockScreen = ({ name, options }: any) => {
    capturedScreens.push({ name, options });
    return null;
  };
  return {
    Stack: Object.assign(({ screenOptions, children }: any) => {
      capturedScreenOptions = screenOptions ?? {};
      return <>{children}</>;
    }, {
      Screen: MockScreen,
    }),
    ThemeProvider: ({ children }: any) => <>{children}</>,
    DarkTheme: { colors: { background: '#000' } },
    useRouter: () => ({ push: jest.fn(), navigate: mockNavigate }),
    useNavigationContainerRef: () => ({ current: null, addListener: jest.fn(() => () => {}), getCurrentRoute: jest.fn() }),
  };
});

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(() => false),
}));

jest.mock('../src/global.css', () => ({}));
jest.mock('react-native-reanimated', () => ({}));
jest.mock('posthog-react-native', () => ({
  PostHogProvider: jest.fn(({ children }: any) => children),
}));
jest.mock('../src/config/posthog', () => ({ posthog: {} }));

beforeEach(() => {
  capturedScreens.length = 0;
  capturedScreenOptions = {};
  mockNavigate.mockReset();
});

describe('Sentry initialisation', () => {
  it('initialises Sentry with the project DSN', () => {
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN }),
    );
  });

  it('does not enable sendDefaultPii to avoid PII collection without consent', () => {
    const call = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(call.sendDefaultPii).toBeFalsy();
  });

  it('wraps RootLayout with Sentry.wrap', () => {
    expect(Sentry.wrap).toHaveBeenCalledWith(expect.any(Function));
    expect(RootLayout).toBe((Sentry.wrap as jest.Mock).mock.results[0].value);
  });

  it('passes the navigation integration to Sentry.init', () => {
    const call = (Sentry.init as jest.Mock).mock.calls[0][0];
    const navIntegration = (Sentry.reactNavigationIntegration as jest.Mock).mock.results[0].value;
    expect(call.integrations).toContainEqual(navIntegration);
  });

  it('sets tracesSampleRate to 1.0', () => {
    const call = (Sentry.init as jest.Mock).mock.calls[0][0];
    expect(call.tracesSampleRate).toBe(1.0);
  });
});

describe('unstable_settings', () => {
  it('sets initialRouteName to index so the first-run redirect in app/index.tsx runs on boot', () => {
    expect(unstable_settings.initialRouteName).toBe('index');
  });
});

describe('PostHog provider', () => {
  it('renders PostHogProvider with the posthog client', () => {
    render(<RootLayout />);
    expect(PostHogProvider as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ client: posthog, autocapture: true }),
      undefined,
    );
  });
});

describe('notification response listener', () => {
  it('uses router.navigate (not push) so tapping a rest notification while on log-session does not stack a duplicate', () => {
    let capturedCallback: (() => void) | undefined;
    jest.spyOn(notifications, 'setupNotificationResponseListener').mockImplementation((cb) => {
      capturedCallback = cb;
      return () => {};
    });

    render(<RootLayout />);
    expect(capturedCallback).toBeDefined();
    capturedCallback!();
    expect(mockNavigate).toHaveBeenCalledWith('/log-session');
  });
});

describe('RootLayoutNav screen registration', () => {
  it('defaults all screens to headerShown: false via screenOptions', () => {
    render(<RootLayout />);
    expect(capturedScreenOptions).toMatchObject({ headerShown: false });
  });

  it('registers index as the first entry to anchor the initial route', () => {
    render(<RootLayout />);
    expect(capturedScreens[0]?.name).toBe('index');
  });

});
