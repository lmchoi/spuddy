import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ProgramDayDetailScreen from '../app/(tabs)/settings/[programName]/[dayIndex]';

const mockGetProgramDay = jest.fn();
const mockUpdateProgramDay = jest.fn();

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/programStorage', () => ({
  getProgramDay: (...args: unknown[]) => mockGetProgramDay(...args),
  updateProgramDay: (...args: unknown[]) => mockUpdateProgramDay(...args),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => { cb(); },
  useLocalSearchParams: jest.fn().mockReturnValue({ programName: 'PPL', dayIndex: '0' }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetProgramDay.mockResolvedValue(null);
  mockUpdateProgramDay.mockResolvedValue(undefined);
});

describe('ProgramDayDetail screen', () => {
  it('shows the sample day name', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Push Day')).toBeTruthy();
  });

  it('renders all exercise names in collapsed state', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Overhead Press')).toBeTruthy();
    expect(screen.getByText('Pull-ups')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
  });

  it('shows summary line for Bench Press (uniform reps, weight, rest)', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('3 × 5 @ 80 kg · rest 3 min')).toBeTruthy();
  });

  it('shows rep-range summary for Overhead Press', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('4 × 8–12 @ 40 kg · rest 90s')).toBeTruthy();
  });

  it('shows BW in summary for Pull-ups', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('3 × 6 BW')).toBeTruthy();
  });

  it('shows NO TARGETS text for exercises with empty targets', () => {
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('NO TARGETS · TAP + TO ADD')).toBeTruthy();
  });

  it('expands exercise to show column headers on tap', () => {
    render(<ProgramDayDetailScreen />);
    // Press the disclosure triangle (▸) to expand — it is a direct child of the
    // outer header Pressable and not intercepted by the inner name Pressable
    fireEvent.press(screen.getAllByText('▸')[0]);
    expect(screen.getByText('SET')).toBeTruthy();
    expect(screen.getByText('REPS')).toBeTruthy();
    expect(screen.getByText('WEIGHT')).toBeTruthy();
    expect(screen.getByText('REST')).toBeTruthy();
  });

  it('shows + Set and Delete exercise buttons when expanded', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    expect(screen.getByText('+ Set')).toBeTruthy();
    expect(screen.getByText('Delete exercise')).toBeTruthy();
  });

  it('adds a set when + Set is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getByText('+ Set'));
    // Bench Press starts with 3 sets; adding one makes set index 4 appear
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('removes a set when × is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    const deleteButtons = screen.getAllByText('×');
    fireEvent.press(deleteButtons[deleteButtons.length - 1]); // remove last set
    // After removing one of 3 sets, set index 3 is gone
    expect(screen.queryByText('3')).toBeNull();
  });

  it('deletes exercise when Delete exercise is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getByText('Delete exercise'));
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  it('adds a new exercise when + Add exercise is pressed', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('+ Add exercise'));
    expect(screen.getByText('New exercise')).toBeTruthy();
  });
});

describe('bug regression: weight=0 during edit', () => {
  it('keeps the TextInput visible when weight is changed to 0 mid-edit', () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getAllByText('▸')[0]); // expand Bench Press
    // Enter edit mode by pressing the weight display (shows '80')
    fireEvent.press(screen.getAllByText('80')[0]);
    const input = screen.getByDisplayValue('80');
    // Type '0' — this sets weight=0 which previously swapped the TextInput for a BW pill
    fireEvent.changeText(input, '0');
    // TextInput must stay visible; BW pill must not appear
    expect(screen.queryByDisplayValue('0')).toBeTruthy();
  });
});

describe('bug regression: day name persistence', () => {
  it('persists the typed day name (not the pre-edit snapshot) to DB', async () => {
    render(<ProgramDayDetailScreen />);
    fireEvent.press(screen.getByText('Push Day'));
    const input = screen.getByDisplayValue('Push Day');
    fireEvent.changeText(input, 'Leg Day');
    fireEvent(input, 'blur');
    await waitFor(() =>
      expect(mockUpdateProgramDay).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ name: 'Leg Day' })
      )
    );
  });
});

describe('bug regression: edit state clears on delete', () => {
  it('clears editingCell when an exercise is deleted', () => {
    render(<ProgramDayDetailScreen />);
    // Expand Bench Press and enter reps edit mode for set 1
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getAllByText('5')[0]); // reps cell of first set
    // Delete Bench Press — Overhead Press shifts to index 0
    fireEvent.press(screen.getByText('Delete exercise'));
    // Expand the new exercise 0 (Overhead Press)
    fireEvent.press(screen.getAllByText('▸')[0]);
    // editingCell must be cleared — no TextInput should show reps value '12'
    expect(screen.queryByDisplayValue('12')).toBeNull();
  });

  it('clears editingCell when a set is removed', () => {
    render(<ProgramDayDetailScreen />);
    // Expand Bench Press and enter reps edit mode for set 1
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getAllByText('5')[0]); // reps cell of first set
    // Remove set 1 — sets shift, editingCell becomes stale
    const deleteButtons = screen.getAllByText('×');
    fireEvent.press(deleteButtons[0]);
    // editingCell must be cleared — no active TextInput showing a reps value
    expect(screen.queryByDisplayValue('5')).toBeNull();
  });
});

describe('real data loading', () => {
  it('shows day name loaded from DB', async () => {
    mockGetProgramDay.mockResolvedValue({
      name: 'Leg Day',
      exercises: [{ name: 'Squat', targets: [{ reps: 5, weight: 100 }] }],
    });
    render(<ProgramDayDetailScreen />);
    await waitFor(() => expect(screen.getByText('Leg Day')).toBeTruthy());
  });

  it('shows exercises loaded from DB', async () => {
    mockGetProgramDay.mockResolvedValue({
      name: 'Leg Day',
      exercises: [
        { name: 'Squat', targets: [{ reps: 5, weight: 100 }] },
        { name: 'Leg Press', targets: [] },
      ],
    });
    render(<ProgramDayDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText('Squat')).toBeTruthy();
      expect(screen.getByText('Leg Press')).toBeTruthy();
    });
  });

  it('calls updateProgramDay when a set is added', async () => {
    mockGetProgramDay.mockResolvedValue({
      name: 'Leg Day',
      exercises: [{ name: 'Squat', targets: [{ reps: 5, weight: 100 }] }],
    });
    render(<ProgramDayDetailScreen />);
    await waitFor(() => expect(screen.getByText('Squat')).toBeTruthy());
    fireEvent.press(screen.getAllByText('▸')[0]);
    fireEvent.press(screen.getByText('+ Set'));
    await waitFor(() => expect(mockUpdateProgramDay).toHaveBeenCalled());
  });
});
