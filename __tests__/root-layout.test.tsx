import React from 'react';
import { render } from '@testing-library/react-native';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '../src/config/posthog';
import RootLayout, { unstable_settings } from '../app/_layout';

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

jest.mock('expo-router', () => {
  const MockScreen = ({ name, options }: any) => {
    capturedScreens.push({ name, options });
    return null;
  };
  return {
    Stack: Object.assign(({ children }: any) => <>{children}</>, {
      Screen: MockScreen,
    }),
    ThemeProvider: ({ children }: any) => <>{children}</>,
    DarkTheme: { colors: { background: '#000' } },
    useRouter: () => ({ push: jest.fn() }),
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

describe('RootLayoutNav screen registration', () => {
  it('registers notes-import with headerShown: false', () => {
    render(<RootLayout />);
    const screen = capturedScreens.find((s) => s.name === 'notes-import');
    expect(screen).toBeDefined();
    expect(screen?.options?.headerShown).toBe(false);
  });

  it('registers notes-import-review with headerShown: false', () => {
    render(<RootLayout />);
    const screen = capturedScreens.find((s) => s.name === 'notes-import-review');
    expect(screen).toBeDefined();
    expect(screen?.options?.headerShown).toBe(false);
  });

  it('registers select-day with headerShown: false', () => {
    render(<RootLayout />);
    const screen = capturedScreens.find((s) => s.name === 'select-day');
    expect(screen).toBeDefined();
    expect(screen?.options?.headerShown).toBe(false);
  });
});
