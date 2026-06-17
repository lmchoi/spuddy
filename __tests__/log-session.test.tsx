import { Alert, AppState, Platform } from 'react-native';
import { act, render, screen, fireEvent, waitFor, configure, resetToDefaults } from '@testing-library/react-native';
import LogSession from '../app/log-session';
import { getProgramDay, addProgramDay, getPrograms, updateActiveDayIndex } from '@/src/programStorage';
import { saveSession } from '@/src/storage';
import { C } from '@/components/spuddy/palette';
import { loadDraft, saveDraft, clearDraft } from '@/src/sessionDraft';
import type { SessionState } from '@/src/domain/sessionLogger';
import { getAllExerciseNames, getExerciseNote, setExerciseNote } from '@/src/exerciseStorage';

configure({ asyncUtilTimeout: 5000 });
afterAll(() => resetToDefaults());

const mockScheduleRestExpiredNotification = jest.fn().mockResolvedValue(undefined);
const mockCancelRestExpiredNotification = jest.fn().mockResolvedValue(undefined);
const mockSetupNotificationChannel = jest.fn().mockResolvedValue(undefined);

jest.mock('@/src/notifications', () => ({
  scheduleRestExpiredNotification: (...args: unknown[]) => mockScheduleRestExpiredNotification(...args),
  cancelRestExpiredNotification: (...args: unknown[]) => mockCancelRestExpiredNotification(...args),
  setupNotificationChannel: (...args: unknown[]) => mockSetupNotificationChannel(...args),
}));

jest.mock('@/src/sessionDraft', () => ({
  draftKey: jest.fn((id: number, idx: number) => `draft_session__${id}__${idx}`),
  loadDraft: jest.fn().mockResolvedValue(null),
  saveDraft: jest.fn().mockResolvedValue(undefined),
  clearDraft: jest.fn().mockResolvedValue(undefined),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ programId: '1', dayIndex: '0' }),
  useRouter: () => ({ replace: mockReplace, back: mockBack, canGoBack: mockCanGoBack }),
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
    {
      name: 'Squat',
      exerciseId: 1,
      targets: [
        { reps: 5, weight: 100 },
        { reps: 5, weight: 100 },
      ],
    },
    {
      name: 'Bench',
      exerciseId: 2,
      targets: [{ reps: 8, weight: 60 }],
    },
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
  (addProgramDay as jest.Mock).mockResolvedValue(undefined);
  (updateActiveDayIndex as jest.Mock).mockReturnValue(undefined);
  (loadDraft as jest.Mock).mockResolvedValue(null);
  (saveDraft as jest.Mock).mockResolvedValue(undefined);
  (clearDraft as jest.Mock).mockResolvedValue(undefined);
  jest.spyOn(Alert, 'prompt').mockImplementation(() => {});
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

  it('back button calls router.back() when history exists', async () => {
    mockCanGoBack.mockReturnValue(true);
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('←')).toBeTruthy());
    fireEvent.press(screen.getByText('←'));
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('back button replaces to progress when no history exists', async () => {
    mockCanGoBack.mockReturnValue(false);
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('←')).toBeTruthy());
    fireEvent.press(screen.getByText('←'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/progress');
    expect(mockBack).not.toHaveBeenCalled();
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

  it('calls saveSession and shows change prompt when tapped mid-session', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText('Finish')); });

    expect(saveSession).toHaveBeenCalledTimes(1);
    // No sets logged → both exercises skipped → changes detected → prompt shown
    expect(Alert.prompt).toHaveBeenCalled();
  });

  it('shows an alert and does not navigate when saveSession throws', async () => {
    (saveSession as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(Alert, 'alert');

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText('Finish')); });

    expect(Alert.alert).toHaveBeenCalledWith('Save failed', expect.any(String));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

// ─── Finish session ───────────────────────────────────────────────────────────

describe('finish session', () => {
  it('finish session button shows change prompt when an exercise was skipped', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Jump to Bench (last exercise) without completing Squat first
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });

    // Log the single Bench set
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // isExerciseDone(Bench)=true, isSessionDone=false (Squat skipped)
    // Squat has 0 logged sets → detectSessionChanges = true → prompt shown
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(Alert.prompt).toHaveBeenCalled();
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

  it('advances activeDayIndex after saving a completed session', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log all sets for Squat (2 sets)
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Jump to Bench and log its single set
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    // dayIndex=0, totalDays=2 → nextActiveDayIndex = 1
    expect(updateActiveDayIndex).toHaveBeenCalledWith(expect.anything(), 1, 1);
  });
});

// ─── Strip pill redesign ──────────────────────────────────────────────────────

describe('strip pill redesign', () => {
  it('strip chip has pill border-radius (999)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    const chip = screen.getByTestId('strip-chip-0');
    expect(chip).toHaveStyle({ borderRadius: 999 });
  });

  it('done chip has opacity 0.6', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Complete all 2 Squat sets to make it done
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Jump away to Bench → Squat chip becomes done & not-active
    await act(async () => { fireEvent.press(screen.getByText(/Next: Bench/i)); });

    const chip = screen.getByTestId('strip-chip-0');
    expect(chip).toHaveStyle({ opacity: 0.6 });
  });

  it('dot for a logged set that hit target renders with hit colour', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log set 0 for Squat at default reps (5 == target 5) → hit
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    // Strip dot (exercise 0, set 0) should show hit colour
    const dot = screen.getByTestId('strip-dot-0-0');
    expect(dot).toHaveStyle({ backgroundColor: C.hit });
  });

  it('dot for a logged set that missed target renders with miss colour', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Decrement reps once: 5 → 4 (below target of 5)
    const decButtons = screen.getAllByText('−');
    await act(async () => { fireEvent.press(decButtons[0]); }); // reps stepper

    // Log set at 4 reps → miss
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    const dot = screen.getByTestId('strip-dot-0-0');
    expect(dot).toHaveStyle({ backgroundColor: C.below });
  });

  it('active set dot renders with transparent background and hit border colour', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Before any logging: (exercise 0, set 0) is the active set
    const dot = screen.getByTestId('strip-dot-0-0');
    expect(dot).toHaveStyle({ backgroundColor: 'transparent' });
    expect(dot).toHaveStyle({ borderColor: C.hit });
  });
});

// ─── Add extra set ────────────────────────────────────────────────────────────

describe('add extra set', () => {
  it('shows "+ Add set" even while planned sets remain (always visible)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // One set logged, one still remaining — row is still visible
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    expect(screen.getByText(/\+ Add set/i)).toBeTruthy();
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

  it('extra set row shows the logged values (not a mismatched target)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Log both Squat sets at 5×100
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Tap + Add set and log at same values (steppers pre-fill from last set)
    await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/\+ Add set/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Extra set row should appear showing the logged values
    await waitFor(() => {
      const rows = screen.getAllByText(/5 × 100 kg/i);
      expect(rows.length).toBe(3); // sets 1, 2, and the extra
    });
  });
});

// ─── Resume in-progress session ──────────────────────────────────────────────

describe('resume in-progress session', () => {
  const draftWithOneSetLogged: SessionState = {
    loggedSets: [[{ reps: 5, weight: 100 }], []],
    targetCounts: [2, 1],
    extraSetCounts: [0, 0],
    currentExerciseIdx: 0,
    isResting: false,
    startedAt: 9999,
  };

  it('restores a draft when one exists on mount', async () => {
    (loadDraft as jest.Mock).mockResolvedValueOnce(draftWithOneSetLogged);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // With 1 of 2 Squat sets already logged, only the last set remains
    expect(screen.getByText('Done · Last set')).toBeTruthy();
  });

  it('starts a fresh session when no draft exists', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Fresh session: first set of two remaining
    expect(screen.getByText('Done · Set 1 of 2')).toBeTruthy();
  });

  it('saves draft after logging a set', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    expect(saveDraft).toHaveBeenCalled();
  });

  it('saves draft after skipping rest', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    const callsBefore = (saveDraft as jest.Mock).mock.calls.length;

    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    expect((saveDraft as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('saves draft after jumping to another exercise', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText('Bench')); });

    expect(saveDraft).toHaveBeenCalled();
  });

  it('clears draft after successful finish (navigate path)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Complete all sets so the session finishes without a change prompt
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(clearDraft).toHaveBeenCalled();
  });

  it('does not clear draft when saveSession fails', async () => {
    (saveSession as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText('Finish')); });

    expect(clearDraft).not.toHaveBeenCalled();
  });

  it('navigates even when clearDraft rejects', async () => {
    (clearDraft as jest.Mock).mockRejectedValueOnce(new Error('storage error'));

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    expect(mockReplace).toHaveBeenCalled();
  });
});

// ─── Extra set — plan target comparison ──────────────────────────────────────
//
// The active extra-set row (and hit/miss on done rows) should use the last
// *planned* target — not the previous set's logged values. Rationale:
//
//   Plan: 2 × 5 reps @ 100 kg
//   Set 2 logged 7 reps (exceeded) → extra set target = 5, not 7
//   Set 2 logged 3 reps (fell short) → extra set target = 5, not 3
//
// Using the last-logged value as target would: (a) penalise an exceptional
// set (exceeded → hard benchmark for extras) and (b) lower the bar when the
// user is struggling.

describe('add extra set — plan target comparison', () => {
  it('set 2 exceeded (logged 7, target 5): extra set active row shows plan target 5 × 100, not 7 × 100', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Set 1 — pre-fill: 5 reps (plan target). Log at default.
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    // Set 2 — pre-fill: 5 reps. Press reps + twice → 7. Log 7 × 100 kg.
    const incReps = screen.getAllByText('+')[0]; // reps stepper +
    await act(async () => { fireEvent.press(incReps); }); // 5 → 6
    await act(async () => { fireEvent.press(incReps); }); // 6 → 7
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); }); // log 7 × 100

    // Tap + Add set
    await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/\+ Add set/i)); });

    // Outcome: "7 × 100 kg" appears exactly once — Set 2's done row only.
    // The extra set active row target must be "5 × 100 kg" (plan), not "7 × 100 kg".
    expect(screen.getAllByText(/7 × 100 kg/i).length).toBe(1);
  });

  it('set 2 fell short (logged 3, target 5): extra set active row shows plan target 5 × 100, not 3 × 100', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Set 1 — pre-fill: 5 reps. Log at default.
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    // Set 2 — pre-fill: 5 reps. Press reps − twice → 3. Log 3 × 100 kg.
    const decReps = screen.getAllByText('−')[0]; // reps stepper −
    await act(async () => { fireEvent.press(decReps); }); // 5 → 4
    await act(async () => { fireEvent.press(decReps); }); // 4 → 3
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); }); // log 3 × 100

    // Tap + Add set
    await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/\+ Add set/i)); });

    // Outcome: "3 × 100 kg" appears exactly once — Set 2's done row only.
    // The extra set active row target must be "5 × 100 kg" (plan), not "3 × 100 kg".
    expect(screen.getAllByText(/3 × 100 kg/i).length).toBe(1);
  });
});

// ─── Post-session prompt ──────────────────────────────────────────────────────

describe('post-session prompt', () => {
  describe('iOS path', () => {
    beforeEach(() => {
      // @ts-ignore
      Platform.OS = 'ios';
    });

    afterEach(() => {
      // @ts-ignore
      Platform.OS = 'ios';
    });

    it('navigates without prompt when session is fully completed with no changes', async () => {
      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      // Log both Squat sets
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
      await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

      // Jump to Bench and log the single set
      await act(async () => { fireEvent.press(screen.getByText('Bench')); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

      await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
      await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

      expect(Alert.prompt).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
    });

    it('shows Alert.prompt when extra sets were added', async () => {
      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      // Log both Squat sets, then add an extra set and log it
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
      await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
      await waitFor(() => expect(screen.getByText(/\+ Add set/i)).toBeTruthy());
      await act(async () => { fireEvent.press(screen.getByText(/\+ Add set/i)); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

      // Log Bench
      await act(async () => { fireEvent.press(screen.getByText('Bench')); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

      await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
      await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

      expect(Alert.prompt).toHaveBeenCalled();
    });

    it('calls addProgramDay and navigates when name is entered', async () => {
      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      // Skip Squat; log Bench only
      await act(async () => { fireEvent.press(screen.getByText('Bench')); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
      await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
      await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

      // Simulate user entering a name in the Alert.prompt callback
      const promptCallback = (Alert.prompt as jest.Mock).mock.calls[0][2];
      await act(async () => { promptCallback('My Custom Day'); });

      expect(addProgramDay).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
    });

    it('navigates without saving when prompt is cancelled (null name)', async () => {
      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      // Skip Squat; log Bench only
      await act(async () => { fireEvent.press(screen.getByText('Bench')); });
      await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
      await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
      await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

      const promptCallback = (Alert.prompt as jest.Mock).mock.calls[0][2];
      await act(async () => { promptCallback(null); });

      expect(addProgramDay).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
    });
  });

  describe('Android path (post-session)', () => {
    beforeEach(() => {
      // @ts-ignore
      Platform.OS = 'android';
      jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      // @ts-ignore
      Platform.OS = 'ios';
    });

    it('calls Alert.alert (not Alert.prompt) when changes detected', async () => {
      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      await act(async () => { fireEvent.press(screen.getByText('Finish')); });

      expect(Alert.prompt).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Save as new program day?',
        expect.any(String),
        expect.any(Array),
      );
    });

    it('Save button calls addProgramDay with default name and navigates', async () => {
      let capturedButtons: { text: string; onPress?: () => void }[] = [];
      (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
        capturedButtons = buttons;
      });

      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      await act(async () => { fireEvent.press(screen.getByText('Finish')); });

      const saveBtn = capturedButtons.find(b => b.text === 'Save');
      await act(async () => { saveBtn?.onPress?.(); });

      expect(addProgramDay).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
    });

    it('Skip button navigates without saving', async () => {
      let capturedButtons: { text: string; style?: string; onPress?: () => void }[] = [];
      (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
        capturedButtons = buttons;
      });

      render(<LogSession />);
      await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

      await act(async () => { fireEvent.press(screen.getByText('Finish')); });

      const skipBtn = capturedButtons.find(b => b.text === 'Skip');
      await act(async () => { skipBtn?.onPress?.(); });

      expect(addProgramDay).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/progress\//));
    });
  });
});

// ─── Exercise note row ────────────────────────────────────────────────────────

describe('exercise note row', () => {
  beforeEach(() => {
    (getExerciseNote as jest.Mock).mockReturnValue(null);
    (setExerciseNote as jest.Mock).mockReset();
  });

  it('shows Add note button when no note is set', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('Add note')).toBeTruthy());
  });

  it('shows note text and Edit button when a note exists', async () => {
    (getExerciseNote as jest.Mock).mockImplementation((_db: unknown, id: number) =>
      id === 1 ? 'Keep elbows tucked.' : null
    );
    render(<LogSession />);
    await waitFor(() => {
      expect(screen.getByText('Keep elbows tucked.')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
    });
  });

  it('opens note sheet on tap of Add note button', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('Add note')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Add note')); });
    await waitFor(() => expect(screen.getByPlaceholderText(/cue, reminder/i)).toBeTruthy());
  });

  it('opens note sheet on tap of Edit button', async () => {
    (getExerciseNote as jest.Mock).mockImplementation((_db: unknown, id: number) =>
      id === 1 ? 'Keep elbows tucked.' : null
    );
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('Edit')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Edit')); });
    await waitFor(() => expect(screen.getByPlaceholderText(/cue, reminder/i)).toBeTruthy());
  });

  it('calls setExerciseNote with new text and closes sheet on Done', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('Add note')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Add note')); });
    const input = screen.getByPlaceholderText(/cue, reminder/i);
    fireEvent.changeText(input, 'Drive elbows forward');
    await act(async () => { fireEvent.press(screen.getByText('Done')); });
    expect(setExerciseNote).toHaveBeenCalledWith(expect.anything(), 1, 'Drive elbows forward');
    expect(screen.queryByPlaceholderText(/cue, reminder/i)).toBeNull();
  });

  it('closes sheet without saving when Cancel is pressed', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getByText('Add note')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Add note')); });
    await waitFor(() => expect(screen.getByPlaceholderText(/cue, reminder/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Cancel')); });
    expect(screen.queryByPlaceholderText(/cue, reminder/i)).toBeNull();
    expect(setExerciseNote).not.toHaveBeenCalled();
  });
});

// ─── Stepper carry-forward after logging ─────────────────────────────────────
//
// After logging a set, the stepper for the *next* set should show the values
// the user just entered — not reset to the program target. The target should
// only seed the stepper on first load and on exercise transitions.

describe('stepper carry-forward after logging a set', () => {
  it('carries forward user-entered reps after logging set 1 (not reset to target)', async () => {
    // mockDay: Squat has 2 target sets, each 5 reps × 100 kg
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Adjust reps away from target: 5 → 7 (press + twice on reps stepper)
    const incButtons = screen.getAllByText('+');
    await act(async () => { fireEvent.press(incButtons[0]); }); // 5 → 6
    await act(async () => { fireEvent.press(incButtons[0]); }); // 6 → 7

    // Confirm the reps stepper now shows 7
    expect(screen.getByDisplayValue('7')).toBeTruthy();

    // Log set 1
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    // After logging, the stepper for set 2 should still show 7 (carried forward),
    // NOT 5 (the original plan target). The "5" that was the target should not appear
    // as the reps stepper value.
    expect(screen.getByDisplayValue('7')).toBeTruthy();
  });

  it('carries forward user-entered weight after logging set 1', async () => {
    // mockDay: Squat has 2 target sets, each 5 reps × 100 kg
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Adjust weight down from 100: press − once on weight stepper → 97.5 kg
    const decButtons = screen.getAllByText('−');
    await act(async () => { fireEvent.press(decButtons[1]); }); // weight stepper −

    // Log set 1
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    // After logging, the weight stepper for set 2 should carry forward the adjusted
    // value, not reset to the target weight of 100.
    expect(screen.queryByDisplayValue('100')).toBeNull();
  });
});

// ─── Stepper floors ───────────────────────────────────────────────────────────

describe('stepper floors', () => {
  it('reps cannot go below 1 via − button', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Squat starts at 5 reps — press − 6 times, should floor at 1
    const decReps = screen.getAllByText('−')[0];
    for (let i = 0; i < 6; i++) {
      await act(async () => { fireEvent.press(decReps); });
    }

    expect(screen.getByDisplayValue('1')).toBeTruthy();
  });

  it('reps cannot go below 1 via direct text input', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const repsInput = screen.getByDisplayValue('5');
    await act(async () => { fireEvent.changeText(repsInput, '0'); });
    await act(async () => { fireEvent(repsInput, 'blur'); });

    expect(screen.getByDisplayValue('1')).toBeTruthy();
  });

  it('negative weight typed via keyboard is rejected on blur (value stays unchanged)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Stepper only calls onChangeValue for parsed >= 0, so "-5" is silently rejected
    const weightInput = screen.getByDisplayValue('100');
    await act(async () => { fireEvent.changeText(weightInput, '-5'); });
    await act(async () => { fireEvent(weightInput, 'blur'); });

    expect(screen.getByDisplayValue('100')).toBeTruthy();
  });

  it('weight cannot go below 0 (BW) via − button', async () => {
    const dayWithZeroWeight = {
      name: 'Day A',
      exercises: [{ name: 'Squat', exerciseId: 1, targets: [{ reps: 5, weight: 0 }] }],
    };
    (getProgramDay as jest.Mock).mockResolvedValueOnce(dayWithZeroWeight);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    // Weight starts at BW (0) — pressing − should stay at 0
    const decWeight = screen.getAllByText('−')[1]; // weight stepper
    await act(async () => { fireEvent.press(decWeight); });
    await act(async () => { fireEvent.press(decWeight); });

    expect(screen.getByDisplayValue('BW')).toBeTruthy();
  });
});

// ─── Stepper direct input ────────────────────────────────────────────────────

describe('stepper direct input', () => {
  it('reps stepper renders as a TextInput with the initial target value', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    // mockDay Squat target: 5 reps → reps stepper starts at 5
    expect(screen.getByDisplayValue('5')).toBeTruthy();
  });

  it('typing into reps stepper updates the displayed value immediately', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const repsInput = screen.getByDisplayValue('5');
    await act(async () => { fireEvent.changeText(repsInput, '12'); });

    expect(screen.getByDisplayValue('12')).toBeTruthy();
  });

  it('pressing + after typing a value shows the incremented value (not the stale draft)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const repsInput = screen.getByDisplayValue('5');
    await act(async () => { fireEvent.changeText(repsInput, '12'); });

    const incButtons = screen.getAllByText('+');
    await act(async () => { fireEvent.press(incButtons[0]); }); // reps +

    // Should display 13 (12 typed + 1), not the stale "12" draft
    expect(screen.getByDisplayValue('13')).toBeTruthy();
  });

  it('pressing − after typing a value shows the decremented value (not the stale draft)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const repsInput = screen.getByDisplayValue('5');
    await act(async () => { fireEvent.changeText(repsInput, '12'); });

    const decButtons = screen.getAllByText('−');
    await act(async () => { fireEvent.press(decButtons[0]); }); // reps −

    // Should display 11 (12 typed − 1), not the stale "12" draft
    expect(screen.getByDisplayValue('11')).toBeTruthy();
  });

  it('typed reps value is used when logging the set', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const repsInput = screen.getByDisplayValue('5');
    await act(async () => { fireEvent.changeText(repsInput, '12'); });
    await act(async () => { fireEvent(repsInput, 'blur'); });

    // Log both sets and finish
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    const payload = (saveSession as jest.Mock).mock.calls[0][1];
    const squat = payload.exercises.find((e: { name: string }) => e.name === 'Squat');
    expect(squat.sets[0].reps).toBe(12);
  });

  it('typed weight value is used when logging the set', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const weightInput = screen.getByDisplayValue('100');
    await act(async () => { fireEvent.changeText(weightInput, '110'); });
    await act(async () => { fireEvent(weightInput, 'blur'); });

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    const payload = (saveSession as jest.Mock).mock.calls[0][1];
    const squat = payload.exercises.find((e: { name: string }) => e.name === 'Squat');
    expect(squat.sets[0].weight).toBe(110);
  });
});

// ─── SetEntry — typed value without blur ─────────────────────────────────────

describe('SetEntry — typed value without blur is logged correctly', () => {
  it('typed reps logged without blur uses the typed value (stale-closure fix)', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    const repsInput = screen.getByDisplayValue('5');
    await act(async () => { fireEvent.changeText(repsInput, '12'); });
    // No blur — press Done directly
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await waitFor(() => expect(screen.getByText(/Finish session/i)).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText(/Finish session/i)); });

    const payload = (saveSession as jest.Mock).mock.calls[0][1];
    const squat = payload.exercises.find((e: { name: string }) => e.name === 'Squat');
    expect(squat.sets[0].reps).toBe(12);
  });
});

// ─── Rest timer duration ──────────────────────────────────────────────────────

describe('rest timer duration', () => {
  // __DEV__ is true in Jest, so the 5 s dev cap applies to all durations > 5 s.
  // Prod behaviour (full countdown) is verified manually or via Maestro.
  it('skips rest immediately when restSeconds is 0', async () => {
    const dayWithZeroRest = {
      name: 'Day A',
      exercises: [
        {
          name: 'Squat',
          exerciseId: 1,
          targets: [
            { reps: 5, weight: 100, restSeconds: 0 },
            { reps: 5, weight: 100, restSeconds: 0 },
          ],
        },
      ],
    };
    (getProgramDay as jest.Mock).mockResolvedValue(dayWithZeroRest);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    // restSeconds: 0 means no rest — timer should auto-skip, not fall back to DEFAULT_REST_SECONDS
    expect(screen.queryByText(/Skip rest/i)).toBeNull();
    expect(screen.getByText(/Done/i)).toBeTruthy();
  });

  it('shows configured restSeconds when ≤ 5 s (no dev clamp)', async () => {
    const dayWith3sRest = {
      name: 'Day A',
      exercises: [
        {
          name: 'Squat',
          exerciseId: 1,
          targets: [
            { reps: 5, weight: 100, restSeconds: 3 },
            { reps: 5, weight: 100, restSeconds: 3 },
          ],
        },
      ],
    };
    (getProgramDay as jest.Mock).mockResolvedValue(dayWith3sRest);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    expect(screen.getByText('0:03')).toBeTruthy();
  });

  it('clamps to 5 s in dev builds (__DEV__ is true in Jest)', async () => {
    const dayWith90sRest = {
      name: 'Day A',
      exercises: [
        {
          name: 'Squat',
          exerciseId: 1,
          targets: [
            { reps: 5, weight: 100, restSeconds: 90 },
            { reps: 5, weight: 100, restSeconds: 90 },
          ],
        },
      ],
    };
    (getProgramDay as jest.Mock).mockResolvedValue(dayWith90sRest);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    expect(screen.getByText('0:05')).toBeTruthy();
  });
});

// ─── Rest timer — wall clock accuracy ────────────────────────────────────────

describe('rest timer — wall clock accuracy on foreground resume', () => {
  const day3sRest = {
    name: 'Day A',
    exercises: [
      {
        name: 'Squat',
        exerciseId: 1,
        // 3 s < 5 s dev cap so effectiveDuration = 3 in these tests
        targets: [
          { reps: 5, weight: 100, restSeconds: 3 },
          { reps: 5, weight: 100, restSeconds: 3 },
        ],
      },
    ],
  };

  let appStateListeners: ((state: string) => void)[];
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    appStateListeners = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event: any, handler: any) => {
      appStateListeners.push(handler);
      return { remove: jest.fn() } as any;
    });
    dateNowSpy = jest.spyOn(Date, 'now');
    (getProgramDay as jest.Mock).mockResolvedValue(day3sRest);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('recalculates remaining from wall clock when app returns to foreground', async () => {
    const t0 = 1_000_000_000_000;
    dateNowSpy.mockReturnValue(t0);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    expect(screen.getByText('0:03')).toBeTruthy();

    // 2 s elapse while backgrounded
    dateNowSpy.mockReturnValue(t0 + 2_000);

    await act(async () => { appStateListeners.forEach(fn => fn('active')); });

    expect(screen.getByText('0:01')).toBeTruthy();
  });

  it('does not recalculate on background or inactive events', async () => {
    const t0 = 1_000_000_000_000;
    dateNowSpy.mockReturnValue(t0);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    dateNowSpy.mockReturnValue(t0 + 2_000);

    await act(async () => {
      appStateListeners.forEach(fn => fn('background'));
      appStateListeners.forEach(fn => fn('inactive'));
    });

    // No recalc fired — still shows initial value
    expect(screen.getByText('0:03')).toBeTruthy();
  });
});

// ─── Rest timer — notification scheduling ─────────────────────────────────────

describe('rest timer — notification scheduling', () => {
  let appStateListeners: ((state: string) => void)[];
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    appStateListeners = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_event, handler) => {
        appStateListeners.push(handler as (state: string) => void);
        return { remove: jest.fn() } as any;
      }
    );
    dateNowSpy = jest.spyOn(Date, 'now');
    mockScheduleRestExpiredNotification.mockClear();
    mockCancelRestExpiredNotification.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('schedules notification when rest timer mounts', async () => {
    dateNowSpy.mockReturnValue(1_000_000_000_000);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    expect(mockScheduleRestExpiredNotification).toHaveBeenCalledTimes(1);
  });

  it('cancels notification when skip rest is pressed', async () => {
    dateNowSpy.mockReturnValue(1_000_000_000_000);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip rest/i)); });

    expect(mockCancelRestExpiredNotification).toHaveBeenCalledTimes(1);
  });

  it('cancels notification when timer reaches zero in the foreground', async () => {
    const t0 = 1_000_000_000_000;
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(t0);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    // Advance past the 5 s DEV cap so remaining hits zero
    dateNowSpy.mockReturnValue(t0 + 5_001);
    await act(async () => { appStateListeners.forEach(fn => fn('active')); });

    expect(mockCancelRestExpiredNotification).toHaveBeenCalledTimes(1);
  });
});

// ─── Add exercise mid-session ─────────────────────────────────────────────────

describe('add exercise mid-session', () => {
  it('shows the "Add exercise" pill below the strip', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    expect(screen.getByText('+ Add exercise')).toBeTruthy();
  });

  it('tapping the pill opens the name sheet', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    expect(screen.getByPlaceholderText('Exercise name')).toBeTruthy();
  });

  it('no Create row shown when query is empty', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    expect(screen.queryByText(/^Create '/)).toBeNull();
    expect(screen.getByPlaceholderText('Exercise name')).toBeTruthy();
  });

  it('confirming a name adds a new chip to the strip and closes the sheet', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Cable Fly'); });
    await act(async () => { fireEvent.press(screen.getByText("Create 'Cable Fly'")); });
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
    expect(screen.getAllByText('Cable Fly').length).toBeGreaterThan(0);
  });

  it('cancelling the sheet closes it without adding an exercise', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => { fireEvent.press(screen.getByText('Cancel')); });
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
    expect(screen.queryByText('Cable Fly')).toBeNull();
  });

  it('saves draft after adding an exercise', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Cable Fly'); });
    await act(async () => { fireEvent.press(screen.getByText("Create 'Cable Fly'")); });
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it('history rows appear in the sheet when history is non-empty', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Deadlift', 'Pull-up']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await waitFor(() => {
      expect(screen.getByText('Deadlift')).toBeTruthy();
      expect(screen.getByText('Pull-up')).toBeTruthy();
    });
  });

  it('tapping a history row calls onAdd and closes the sheet', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Deadlift']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await waitFor(() => expect(screen.getByText('Deadlift')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Deadlift')); });
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
    expect(screen.getAllByText('Deadlift').length).toBeGreaterThan(0);
  });

  it('list filters to substring matches as user types', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Deadlift', 'Pull-up', 'Dumbbell Row']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await waitFor(() => expect(screen.getByText('Deadlift')).toBeTruthy());
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'ead');
    });
    expect(screen.getByText('Deadlift')).toBeTruthy();
    expect(screen.queryByText('Pull-up')).toBeNull();
    expect(screen.queryByText('Dumbbell Row')).toBeNull();
  });

  it("Create row appears when typed name has no exact match", async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Deadlift', 'Pull-up']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Dead');
    });
    expect(screen.getByText("Create 'Dead'")).toBeTruthy();
    expect(screen.getByText('Deadlift')).toBeTruthy();
  });

  it("Create row appears when no history items match", async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Deadlift', 'Pull-up']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Cable Fly');
    });
    expect(screen.getByText("Create 'Cable Fly'")).toBeTruthy();
    expect(screen.queryByText('Deadlift')).toBeNull();
  });

  it("Create row not shown when typed name exactly matches a library item not in history", async () => {
    // '3/4 Sit-Up' is in the library but not in history
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), '3/4 Sit-Up');
    });
    expect(screen.queryByText(/^Create '/)).toBeNull();
    expect(screen.getByText('3/4 Sit-Up')).toBeTruthy();
  });

  it("Create row not shown when typed name exactly matches a history item", async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['Deadlift', 'Pull-up']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Deadlift');
    });
    expect(screen.queryByText(/^Create '/)).toBeNull();
    expect(screen.getByText('Deadlift')).toBeTruthy();
  });

  it("tapping Create row adds the typed name and closes the sheet", async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Cable Fly');
    });
    await act(async () => { fireEvent.press(screen.getByText("Create 'Cable Fly'")); });
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
    expect(screen.getAllByText('Cable Fly').length).toBeGreaterThan(0);
  });

  it('"From library" header not shown when query is empty', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    expect(screen.queryByText('From library')).toBeNull();
  });

  it('library exercises appear under "From library" header when query matches', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), '3/4 sit');
    });
    expect(screen.getByText('From library')).toBeTruthy();
    expect(screen.getByText('3/4 Sit-Up')).toBeTruthy();
  });

  it('tapping a library row adds the exercise and closes the sheet', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), '3/4 sit');
    });
    await waitFor(() => expect(screen.getByText('3/4 Sit-Up')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('3/4 Sit-Up')); });
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
    expect(screen.getAllByText('3/4 Sit-Up').length).toBeGreaterThan(0);
  });

  it('library results excluded from history deduplication appear only in library section', async () => {
    (getAllExerciseNames as jest.Mock).mockReturnValue(['3/4 Sit-Up']);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText('+ Add exercise')); });
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), '3/4 sit');
    });
    await waitFor(() => expect(screen.getByText('3/4 Sit-Up')).toBeTruthy());
    // Appears exactly once (in history), not duplicated in library section
    expect(screen.queryByText('From library')).toBeNull();
  });
});
