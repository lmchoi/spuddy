import { render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress/index';
import AddScreen from '../app/(tabs)/add';
import SettingsScreen from '../app/(tabs)/settings';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getAllSessions: jest.fn().mockResolvedValue([]) }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Add screen', () => {
  it('renders a text input', () => {
    render(<AddScreen />);
    expect(screen.getByPlaceholderText('Paste your Liftosaur workout here')).toBeTruthy();
  });

  it('renders a disabled Save button', () => {
    render(<AddScreen />);
    expect(screen.getByText('Save')).toBeTruthy();
  });
});

describe('Progress screen', () => {
  it('renders without crashing', async () => {
    render(<ProgressScreen />);
    await waitFor(() =>
      expect(screen.getByText('No workouts logged yet')).toBeTruthy()
    );
  });
});

describe('Settings screen', () => {
  it('renders without crashing', () => {
    render(<SettingsScreen />);
  });
});
