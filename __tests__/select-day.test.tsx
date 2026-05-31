import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SelectDay from '../app/select-day';
import { getPrograms } from '@/src/programStorage';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  Stack: { Screen: () => null },
}));

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));

jest.mock('@/src/programStorage', () => ({
  getPrograms: jest.fn(),
}));

const mockProgram = {
  name: 'Strength A',
  activeDayIndex: 1,
  days: [
    {
      name: 'Day A',
      exercises: [
        { name: 'Squat', targets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 100 }, { reps: 5, weight: 100 }] },
        { name: 'Bench', targets: [{ reps: 8, weight: 60 }] },
      ],
    },
    {
      name: 'Day B',
      exercises: [
        { name: 'Deadlift', targets: [{ reps: 5, weight: 140 }] },
        { name: 'Row', targets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 80 }] },
      ],
    },
    {
      name: 'Day C',
      exercises: [
        { name: 'OHP', targets: [{ reps: 5, weight: 50 }] },
      ],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  (getPrograms as jest.Mock).mockResolvedValue([mockProgram]);
});

describe('SelectDay screen', () => {
  it('renders a pill for each program day', async () => {
    render(<SelectDay />);
    await waitFor(() => {
      expect(screen.getByText('Day A')).toBeTruthy();
      expect(screen.getByText('Day B')).toBeTruthy();
      expect(screen.getByText('Day C')).toBeTruthy();
    });
  });

  it('defaults selection to activeDayIndex and shows a "Next up" badge on that pill', async () => {
    render(<SelectDay />);
    await waitFor(() => {
      expect(screen.getByText('Next up')).toBeTruthy();
      // Deadlift belongs to Day B (activeDayIndex=1), so the preview should show it
      expect(screen.getByText('Deadlift')).toBeTruthy();
    });
  });

  it('switching pill changes the exercise preview', async () => {
    render(<SelectDay />);
    await waitFor(() => expect(screen.getByText('Day A')).toBeTruthy());

    fireEvent.press(screen.getByText('Day A'));

    await waitFor(() => {
      expect(screen.getByText('Squat')).toBeTruthy();
      expect(screen.getByText('Bench')).toBeTruthy();
    });
  });

  it('Start button navigates to log-session with correct params', async () => {
    render(<SelectDay />);
    // defaults to Day B (activeDayIndex=1)
    await waitFor(() => expect(screen.getByText(/Start Day B/)).toBeTruthy());

    fireEvent.press(screen.getByText(/Start Day B/));

    expect(mockPush).toHaveBeenCalledWith(
      '/log-session?programName=Strength%20A&dayIndex=1'
    );
  });

  it('Start button reflects the selected day after switching', async () => {
    render(<SelectDay />);
    await waitFor(() => expect(screen.getByText('Day A')).toBeTruthy());

    fireEvent.press(screen.getByText('Day A'));

    await waitFor(() => expect(screen.getByText(/Start Day A/)).toBeTruthy());

    fireEvent.press(screen.getByText(/Start Day A/));

    expect(mockPush).toHaveBeenCalledWith(
      '/log-session?programName=Strength%20A&dayIndex=0'
    );
  });

  it('shows empty state when no program exists', async () => {
    (getPrograms as jest.Mock).mockResolvedValue([]);
    render(<SelectDay />);
    await waitFor(() => expect(screen.getByText('No program found')).toBeTruthy());
  });
});
