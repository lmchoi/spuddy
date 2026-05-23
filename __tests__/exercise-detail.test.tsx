import { render, screen, waitFor } from '@testing-library/react-native';
import SessionDetailScreen from '../app/(tabs)/progress/[date]';
import type { Session } from '../src/types';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getSessionByDate: jest.fn() }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({ date: '2026-05-10' }),
  router: { back: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { getSessionByDate } = jest.requireMock('@/src/storage') as {
  getSessionByDate: jest.Mock;
};

const SESSION: Session = {
  date: '2026-05-10',
  exercises: [
    {
      name: 'Squat',
      sets: [
        { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
        { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
        { reps: 5, weight: 100, isWarmup: false, isBodyweight: false },
      ],
      targets: [
        { reps: 5, weight: 100 },
        { reps: 5, weight: 100 },
        { reps: 5, weight: 100 },
      ],
    },
    {
      name: 'Bench Press',
      sets: [
        { reps: 4, weight: 80, isWarmup: false, isBodyweight: false },
      ],
      targets: [{ reps: 5, weight: 80 }],
    },
  ],
};

describe('Session detail screen', () => {
  it('shows all exercises from the session', async () => {
    getSessionByDate.mockResolvedValue(SESSION);
    render(<SessionDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText('Squat')).toBeTruthy();
      expect(screen.getByText('Bench Press')).toBeTruthy();
    });
  });

  it('shows hit indicator when all sets meet target', async () => {
    getSessionByDate.mockResolvedValue(SESSION);
    render(<SessionDetailScreen />);
    // Squat: all 3 sets hit — expects at least one ● symbol
    await waitFor(() => expect(screen.getAllByText('●').length).toBeGreaterThan(0));
  });

  it('shows below indicator when a set falls short of target', async () => {
    getSessionByDate.mockResolvedValue(SESSION);
    render(<SessionDetailScreen />);
    // Bench Press: 4 reps vs target 5 — below
    await waitFor(() => expect(screen.getByText('↓')).toBeTruthy());
  });

  it('shows empty state when session not found', async () => {
    getSessionByDate.mockResolvedValue(null);
    render(<SessionDetailScreen />);
    await waitFor(() =>
      expect(screen.getByText('No data for this session')).toBeTruthy()
    );
  });
});
