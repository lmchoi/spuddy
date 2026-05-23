import { render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress/index';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getUniqueExerciseNames: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const { getUniqueExerciseNames } = jest.requireMock('@/src/storage') as {
  getUniqueExerciseNames: jest.Mock;
};

describe('Progress screen', () => {
  it('shows empty state when there are no exercises', async () => {
    getUniqueExerciseNames.mockResolvedValue([]);
    render(<ProgressScreen />);
    await waitFor(() =>
      expect(screen.getByText('No workouts logged yet')).toBeTruthy()
    );
  });

  it('renders exercise names from storage', async () => {
    getUniqueExerciseNames.mockResolvedValue(['Deadlift', 'Squat']);
    render(<ProgressScreen />);
    await waitFor(() => {
      expect(screen.getByText('Deadlift')).toBeTruthy();
      expect(screen.getByText('Squat')).toBeTruthy();
    });
  });
});
