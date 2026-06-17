import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LogSession from '../app/log-session';
import { getProgramDay, getPrograms, updateActiveDayIndex } from '@/src/programStorage';
import { saveSession } from '@/src/storage';
import { loadDraft, saveDraft, clearDraft } from '@/src/sessionDraft';

jest.mock('@/src/config/posthog', () => ({
  posthog: { capture: jest.fn(), screen: jest.fn(), debug: jest.fn() },
}));

import { posthog } from '@/src/config/posthog';

const mockCapture = posthog.capture as jest.Mock;

jest.mock('@/src/notifications', () => ({
  scheduleRestExpiredNotification: jest.fn().mockResolvedValue(undefined),
  cancelRestExpiredNotification: jest.fn().mockResolvedValue(undefined),
  setupNotificationChannel: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/sessionDraft', () => ({
  draftKey: jest.fn((id: number, idx: number) => `draft_session__${id}__${idx}`),
  loadDraft: jest.fn().mockResolvedValue(null),
  saveDraft: jest.fn().mockResolvedValue(undefined),
  clearDraft: jest.fn().mockResolvedValue(undefined),
}));

const mockReplace = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ programId: '1', dayIndex: '0' }),
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), canGoBack: jest.fn().mockReturnValue(true) }),
  Stack: { Screen: () => null },
}));

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));

jest.mock('@/src/programStorage', () => ({
  getProgramDay: jest.fn(),
  addProgramDay: jest.fn().mockResolvedValue(undefined),
  getProgramTotalDays: jest.fn().mockResolvedValue(2),
  getPrograms: jest.fn(),
  updateActiveDayIndex: jest.fn(),
}));

jest.mock('@/src/storage', () => ({
  saveSession: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/exerciseStorage', () => ({
  getAllExerciseNames: jest.fn().mockReturnValue([]),
  getExerciseNote: jest.fn().mockReturnValue(null),
  setExerciseNote: jest.fn(),
}));

const mockDay = {
  name: 'Day A',
  exercises: [
    { name: 'Squat', exerciseId: 1, targets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 100 }] },
    { name: 'Bench', exerciseId: 2, targets: [{ reps: 8, weight: 60 }] },
  ],
};

const mockProgram = {
  name: 'Test Program',
  activeDayIndex: 0,
  days: [mockDay, { name: 'Day B', exercises: [] }],
};

beforeEach(() => {
  jest.clearAllMocks();
  (getProgramDay as jest.Mock).mockResolvedValue(mockDay);
  (getPrograms as jest.Mock).mockResolvedValue([mockProgram]);
  (saveSession as jest.Mock).mockResolvedValue(undefined);
  (updateActiveDayIndex as jest.Mock).mockReturnValue(undefined);
  (loadDraft as jest.Mock).mockResolvedValue(null);
  (saveDraft as jest.Mock).mockResolvedValue(undefined);
  (clearDraft as jest.Mock).mockResolvedValue(undefined);
});

// ─── session_started ──────────────────────────────────────────────────────────

describe('session_started event', () => {
  it('fires on mount with exercise_count and source=program', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    expect(mockCapture).toHaveBeenCalledWith('session_started', {
      exercise_count: 2,
      source: 'program',
    });
  });
});

// ─── session_completed ────────────────────────────────────────────────────────

describe('session_completed event', () => {
  it('fires after finishing a fully-logged session', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    mockCapture.mockClear();

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(mockCapture).toHaveBeenCalledWith('session_completed', expect.objectContaining({
      exercise_count: 2,
      total_sets: expect.any(Number),
      duration_ms: expect.any(Number),
    }));
  });
});

// ─── set_completed ────────────────────────────────────────────────────────────

describe('set_completed event', () => {
  it('fires when a set is logged with default and entered values', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    mockCapture.mockClear();

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    expect(mockCapture).toHaveBeenCalledWith('set_completed', {
      exercise: 'Squat',
      set_index: 0,
      default_reps: 5,
      entered_reps: 5,
      default_weight: 100,
      entered_weight: 100,
    });
  });

  it('reflects user-entered reps in set_completed properties', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    mockCapture.mockClear();

    const incReps = screen.getAllByText('+')[0];
    await act(async () => { fireEvent.press(incReps); }); // 5 → 6
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    expect(mockCapture).toHaveBeenCalledWith('set_completed', expect.objectContaining({
      default_reps: 5,
      entered_reps: 6,
    }));
  });
});

// ─── rest_timer_started ───────────────────────────────────────────────────────

describe('rest_timer_started event', () => {
  it('fires when a rest timer starts after logging a set', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    mockCapture.mockClear();

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    expect(mockCapture).toHaveBeenCalledWith('rest_timer_started', expect.objectContaining({
      duration_ms: expect.any(Number),
    }));
  });
});
