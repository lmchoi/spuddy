import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RootLayout from '../app/_layout';

// Mock dependencies
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Stack: Object.assign(({ children }: any) => children, {
      Screen: () => null,
    }),
    ThemeProvider: ({ children }: any) => children,
    DarkTheme: { colors: { background: '#000' } },
  };
});

jest.mock('../src/global.css', () => ({}));
jest.mock('react-native-reanimated', () => ({}));

// Mock Storybook
jest.mock('../.storybook', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockStorybook = () => <Text>Storybook</Text>;
  return {
    __esModule: true,
    default: MockStorybook,
  };
});

describe('RootLayout', () => {
  const originalEnv = process.env.EXPO_PUBLIC_STORYBOOK;

  afterEach(() => {
    process.env.EXPO_PUBLIC_STORYBOOK = originalEnv;
  });

  it('renders Storybook when EXPO_PUBLIC_STORYBOOK is 1', () => {
    process.env.EXPO_PUBLIC_STORYBOOK = '1';
    render(<RootLayout />);
    expect(screen.queryByText('Storybook')).toBeTruthy();
  });

  it('does not render Storybook when EXPO_PUBLIC_STORYBOOK is not 1', () => {
    process.env.EXPO_PUBLIC_STORYBOOK = '0';
    render(<RootLayout />);
    expect(screen.queryByText('Storybook')).toBeNull();
  });
});
