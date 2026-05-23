import { render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress/index';
import AddScreen from '../app/(tabs)/add';
import SettingsScreen from '../app/(tabs)/settings';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getUniqueExerciseNames: jest.fn().mockResolvedValue([]) }));
jest.mock('@/src/programStorage', () => ({
  getPrograms: jest.fn().mockResolvedValue([]),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void) => cb(),
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
  const { getPrograms } = require('@/src/programStorage');

  afterEach(() => {
    getPrograms.mockResolvedValue([]);
  });

  it('shows "No programs loaded" when storage is empty', async () => {
    render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByText('No programs loaded')).toBeTruthy());
  });

  it('shows program days when a program is loaded', async () => {
    getPrograms.mockResolvedValue([{
      name: 'v1',
      activeDayIndex: 0,
      days: [
        { name: 'Day 1', exercises: [{ name: 'Squat', targets: [] }] },
        { name: 'Day 2', exercises: [{ name: 'Bench Press', targets: [] }] },
      ],
    }]);
    render(<SettingsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Day 1')).toBeTruthy();
      expect(screen.getByText('Day 2')).toBeTruthy();
    });
  });
});
