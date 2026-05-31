import { render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress/index';
import SettingsScreen from '../app/(tabs)/settings';
import { getPrograms } from '@/src/programStorage';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({
  getAllSessions: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/src/programStorage', () => ({
  getProgram: jest.fn().mockResolvedValue(null),
  getPrograms: jest.fn().mockResolvedValue([]),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Progress screen', () => {
  it('renders without crashing', async () => {
    render(<ProgressScreen />);
    await waitFor(() =>
      expect(screen.getByText('No workouts logged yet')).toBeTruthy()
    );
  });
});

describe('Settings screen', () => {
  afterEach(() => {
    (getPrograms as jest.Mock).mockResolvedValue([]);
  });

  it('shows "No programs loaded" when storage is empty', async () => {
    render(<SettingsScreen />);
    await waitFor(() => expect(screen.getByText('No programs loaded')).toBeTruthy());
    await waitFor(() => expect(getPrograms).toHaveBeenCalled());
  });

  it('shows program days when a program is loaded', async () => {
    (getPrograms as jest.Mock).mockResolvedValue([{
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
