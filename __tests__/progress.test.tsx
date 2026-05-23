import { render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress/index';
import type { Session } from '../src/types';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getAllSessions: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { getAllSessions } = jest.requireMock('@/src/storage') as {
  getAllSessions: jest.Mock;
};

const SESSION_A: Session = {
  date: '2026-05-22',
  exercises: [
    { name: 'Squat', sets: [], targets: [] },
    { name: 'Deadlift', sets: [], targets: [] },
  ],
};

const SESSION_B: Session = {
  date: '2026-05-19',
  exercises: [{ name: 'Bench Press', sets: [], targets: [] }],
};

describe('Progress screen', () => {
  it('shows empty state when there are no sessions', async () => {
    getAllSessions.mockResolvedValue([]);
    render(<ProgressScreen />);
    await waitFor(() =>
      expect(screen.getByText('No workouts logged yet')).toBeTruthy()
    );
  });

  it('renders a row for each session', async () => {
    getAllSessions.mockResolvedValue([SESSION_A, SESSION_B]);
    render(<ProgressScreen />);
    // rowMeta combines count + relative date ("2 exercises  ·  1 day ago"), so use regex
    await waitFor(() => {
      expect(screen.getByText(/2 exercises/)).toBeTruthy();
      expect(screen.getByText(/1 exercise/)).toBeTruthy();
    });
  });
});
