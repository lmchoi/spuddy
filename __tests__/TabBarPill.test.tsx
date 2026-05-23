import { render, screen } from '@testing-library/react-native';
import { TabBarPill } from '../components/spuddy/TabBarPill';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const ROUTES = [
  { key: 'progress-tab', name: 'progress' },
  { key: 'add-tab',      name: 'add' },
  { key: 'settings-tab', name: 'settings' },
] as const;

function makeNav() {
  return {
    emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
    navigate: jest.fn(),
  };
}

describe('TabBarPill', () => {
  it('renders all three tab buttons', () => {
    render(<TabBarPill state={{ index: 0, routes: [...ROUTES] }} navigation={makeNav()} />);
    expect(screen.getByLabelText('Progress')).toBeTruthy();
    expect(screen.getByLabelText('Add workout')).toBeTruthy();
    expect(screen.getByLabelText('Settings')).toBeTruthy();
  });

  describe('add button accessibilityState', () => {
    it('is selected when the add tab is focused', () => {
      render(<TabBarPill state={{ index: 1, routes: [...ROUTES] }} navigation={makeNav()} />);
      expect(screen.getByLabelText('Add workout')).toHaveAccessibilityState({ selected: true });
    });

    it('is not selected when another tab is focused', () => {
      render(<TabBarPill state={{ index: 0, routes: [...ROUTES] }} navigation={makeNav()} />);
      expect(screen.getByLabelText('Add workout')).toHaveAccessibilityState({ selected: false });
    });
  });

  it('renders nothing for an unknown route and does not crash', () => {
    const routes = [
      ...ROUTES,
      { key: 'history-tab', name: 'history' },
    ];
    render(<TabBarPill state={{ index: 0, routes }} navigation={makeNav()} />);
    // Known tabs still render; unknown route silently returns null
    expect(screen.getByLabelText('Progress')).toBeTruthy();
    expect(screen.getByLabelText('Add workout')).toBeTruthy();
    expect(screen.getByLabelText('Settings')).toBeTruthy();
  });
});
