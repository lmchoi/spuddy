import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LogSession from '../app/log-session';
import { getProgramDay } from '@/src/programStorage';
import { saveSession } from '@/src/storage';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ programName: 'Test Program', dayIndex: '0' }),
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  Stack: { Screen: () => null },
}));

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));

jest.mock('@/src/programStorage', () => ({
  getProgramDay: jest.fn(),
}));

jest.mock('@/src/storage', () => ({
  saveSession: jest.fn().mockResolvedValue(undefined),
}));

const mockDay = {
  name: 'Day A',
  exercises: [
    {
      name: 'Squat',
      targets: [
        { reps: 5, weight: 100 },
        { reps: 5, weight: 100 },
      ],
    },
    {
      name: 'Bench',
      targets: [{ reps: 8, weight: 60 }],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  (getProgramDay as jest.Mock).mockResolvedValue(mockDay);
  (saveSession as jest.Mock).mockResolvedValue(undefined);
});

// ─── Render ───────────────────────────────────────────────────────────────────

describe('renders with a mocked ProgramDay', () => {
  it('shows the day name in the header', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('Day A')).toBeTruthy());
  });

  it('shows exercise names in the strip', async () => {
    render(<LogSession />);
    await waitFor(() => {
      expect(screen.getAllByText('Squat').length).toBeGreaterThan(0);
      expect(screen.getByText('Bench')).toBeTruthy();
    });
  });

  it('shows the first exercise name in the main area', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
  });

  it('shows empty state when no program day found', async () => {
    (getProgramDay as jest.Mock).mockResolvedValue(null);
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText(/No program/i)).toBeTruthy());
  });
});

// ─── Logging a set ────────────────────────────────────────────────────────────

describe('logging a set', () => {
  it('updates the set list after logging', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const logBtn = screen.getByText(/Done/i);
    await act(async () => { fireEvent.press(logBtn); });

    // Set 1 should now appear as done (we look for "Set 1" row)
    expect(screen.getAllByText(/Set 1/).length).toBeGreaterThan(0);
  });

  it('shows rest timer after logging a set with more sets remaining', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    expect(screen.getByText(/Skip rest/i)).toBeTruthy();
  });

  it('skip rest dismisses the timer', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    expect(screen.queryByText(/Skip rest/i)).toBeNull();
  });
});

// ─── Header finish button ─────────────────────────────────────────────────────

describe('header finish button', () => {
  it('is visible when the session is in progress (before any set is logged)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    expect(screen.getByText('Finish')).toBeTruthy();
  });

  it('calls saveSession and navigates when tapped mid-session', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText('Finish')); });

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
  });
});

// ─── Finish session ───────────────────────────────────────────────────────────

describe('finish session', () => {
  it('finish session button calls saveSession when reached by completing last exercise first', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Jump to Bench (last exercise) without completing Squat first
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });

    // Log the single Bench set
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // isExerciseDone(Bench)=true, isSessionDone=false (Squat not done)
    // The button should show "Finish session" and route to onFinish, not onNextExercise
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
  });

  it('calls saveSession and navigates to progress on finish', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log all sets for Squat (2 sets)
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Jump to Bench via the strip
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });

    // Log the single Bench set
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Finish session button should appear
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
  });
});

// ─── Add extra set ────────────────────────────────────────────────────────────

describe('add extra set', () => {
  it('does NOT show "+ Add set" while planned sets remain', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // One set logged, one still remaining
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    expect(screen.queryByText(/\+ Add set/i)).toBeNull();
  });

  it('shows "+ Add set" after all planned sets for the current exercise are logged', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log both Squat sets
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
  });

  it('tapping "+ Add set" brings back steppers and Done button (not "Next exercise")', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log both Squat sets
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/\+ Add set/i)); });

    // Should see the Done button again (steppers + Done), not "Next: Bench"
    expect(screen.queryByText(/Next:/i)).toBeNull();
    expect(screen.getByText(/Done/i)).toBeTruthy();
  });

  it('saveSession receives the extra set in the payload on finish', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log both Squat sets
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Add an extra set and log it
    await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/\+ Add set/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Now jump to Bench and finish
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(saveSession).toHaveBeenCalledTimes(1);
    const payload = (saveSession as jest.Mock).mock.calls[0][1];
    const squat = payload.exercises.find((e: { name: string }) => e.name === 'Squat');
    expect(squat.sets).toHaveLength(3); // 2 planned + 1 extra
  });
});
