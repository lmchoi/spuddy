import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../app/_layout';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

const capturedScreens: { name: string; options?: Record<string, unknown> }[] = [];

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
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
  };
});

jest.mock('../src/global.css', () => ({}));
jest.mock('react-native-reanimated', () => ({}));

beforeEach(() => {
  capturedScreens.length = 0;
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
});
