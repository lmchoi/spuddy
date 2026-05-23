import { render, screen, waitFor } from '@testing-library/react-native';
import ExerciseDetailScreen from '../app/(tabs)/progress/[name]';
import type { Session } from '../src/types';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getSessionsForExercise: jest.fn() }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({ name: 'Squat' }),
}));

const { getSessionsForExercise } = jest.requireMock('@/src/storage') as {
  getSessionsForExercise: jest.Mock;
};

const SESSION_OLD: Session = {
  date: '2026-05-01',
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
  ],
};

const SESSION_NEW: Session = {
  date: '2026-05-10',
  exercises: [
    {
      name: 'Squat',
      sets: [
        { reps: 4, weight: 100, isWarmup: false, isBodyweight: false },
      ],
      targets: [{ reps: 5, weight: 100 }],
    },
  ],
};

describe('Exercise detail screen', () => {
  it('shows the exercise name as heading', async () => {
    getSessionsForExercise.mockResolvedValue([SESSION_OLD]);
    render(<ExerciseDetailScreen />);
    await waitFor(() => expect(screen.getByText('Squat')).toBeTruthy());
  });

  it('shows sessions newest first', async () => {
    getSessionsForExercise.mockResolvedValue([SESSION_NEW, SESSION_OLD]);
    render(<ExerciseDetailScreen />);
    await waitFor(() => {
      const dates = screen.getAllByText(/2026-05-\d+/);
      expect(dates[0].props.children).toBe('2026-05-10');
      expect(dates[1].props.children).toBe('2026-05-01');
    });
  });

  it('shows hit indicator when all sets meet target', async () => {
    getSessionsForExercise.mockResolvedValue([SESSION_OLD]);
    render(<ExerciseDetailScreen />);
    await waitFor(() => expect(screen.getByText('✓')).toBeTruthy());
  });

  it('shows below indicator when a set falls short of target', async () => {
    getSessionsForExercise.mockResolvedValue([SESSION_NEW]);
    render(<ExerciseDetailScreen />);
    await waitFor(() => expect(screen.getByText('↓')).toBeTruthy());
  });
});
