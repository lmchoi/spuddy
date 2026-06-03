import { Alert, AppState, Platform } from 'react-native';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LogSession from '../app/log-session';
import { getProgramDay, addProgramDay, getPrograms, updateActiveDayIndex } from '@/src/programStorage';
import { saveSession } from '@/src/storage';
import { C } from '@/components/spuddy/palette';
import { loadDraft, saveDraft, clearDraft } from '@/src/sessionDraft';
import type { SessionState } from '@/src/domain/sessionLogger';
import { getExerciseNote, setExerciseNote } from '@/src/exerciseStorage';

jest.mock('@/src/sessionDraft', () => ({
  draftKey: jest.fn((name: string, idx: number) => `draft_session__${name}__${idx}`),
  loadDraft: jest.fn().mockResolvedValue(null),
  saveDraft: jest.fn().mockResolvedValue(undefined),
  clearDraft: jest.fn().mockResolvedValue(undefined),
}));

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
  addProgramDay: jest.fn().mockResolvedValue(undefined),
  getProgramTotalDays: jest.fn().mockResolvedValue(2),
  getPrograms: jest.fn(),
  updateActiveDayIndex: jest.fn(),
}));

jest.mock('@/src/storage', () => ({
  saveSession: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/exerciseStorage', () => ({
  getExerciseNote: jest.fn().mockReturnValue(null),
  setExerciseNote: jest.fn(),
}));

const mockRequestNotificationPermission = jest.fn().mockResolvedValue(true);
const mockScheduleRestNotification = jest.fn().mockResolvedValue(undefined);
const mockCancelRestNotification = jest.fn().mockResolvedValue(undefined);
const mockSetupNotificationChannel = jest.fn().mockResolvedValue(undefined);

jest.mock('@/src/notifications', () => ({
  requestNotificationPermission: (...args: unknown[]) => mockRequestNotificationPermission(...args),
  scheduleRestNotification: (...args: unknown[]) => mockScheduleRestNotification(...args),
  cancelRestNotification: (...args: unknown[]) => mockCancelRestNotification(...args),
  setupNotificationChannel: (...args: unknown[]) => mockSetupNotificationChannel(...args),
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
    expect(updateActiveDayIndex).toHaveBeenCalledWith(expect.anything(), 'Test Program', 1);
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

// ─── Rest timer duration ──────────────────────────────────────────────────────

describe('rest timer duration', () => {
  it('defaults to 1:00 when target restSeconds is 0', async () => {
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
    expect(screen.getByText('1:00')).toBeTruthy();
  });

  it('shows 1:00 when target restSeconds is 60', async () => {
    const dayWith60sRest = {
      name: 'Day A',
      exercises: [
        {
          name: 'Squat',
          exerciseId: 1,
          targets: [
            { reps: 5, weight: 100, restSeconds: 60 },
            { reps: 5, weight: 100, restSeconds: 60 },
          ],
        },
      ],
    };
    (getProgramDay as jest.Mock).mockResolvedValue(dayWith60sRest);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    expect(screen.getByText('1:00')).toBeTruthy();
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────

describe('notifications', () => {
  const dayWithRest = {
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

  it('requests permission when session loads', async () => {
    render(<LogSession />);
    await waitFor(() => expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1));
  });

  it('awaits channel setup before requesting permission', async () => {
    let resolveChannel!: () => void;
    mockSetupNotificationChannel.mockImplementationOnce(
      () => new Promise<void>(res => { resolveChannel = res; })
    );

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));

    expect(mockRequestNotificationPermission).not.toHaveBeenCalled();

    await act(async () => { resolveChannel(); });

    expect(mockRequestNotificationPermission).toHaveBeenCalledTimes(1);
  });

  it('schedules rest notification with correct delay when rest starts', async () => {
    (getProgramDay as jest.Mock).mockResolvedValue(dayWithRest);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    expect(mockScheduleRestNotification).toHaveBeenCalledWith(90);
  });

  it('cancels rest notification when rest is skipped', async () => {
    (getProgramDay as jest.Mock).mockResolvedValue(dayWithRest);
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText(/Skip/i)); });
    expect(mockCancelRestNotification).toHaveBeenCalled();
  });

  it('cancels rest notification when session is finished', async () => {
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    fireEvent.press(screen.getByText(/Done/i));
    await act(async () => { fireEvent.press(screen.getByText('Finish')); });
    expect(mockCancelRestNotification).toHaveBeenCalled();
  });

  it('cancels rest notification when screen unmounts mid-rest', async () => {
    (getProgramDay as jest.Mock).mockResolvedValue(dayWithRest);
    const { unmount } = render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { unmount(); });
    expect(mockCancelRestNotification).toHaveBeenCalledTimes(1);
  });

  it('cancels rest notification when user jumps to another exercise mid-rest', async () => {
    (getProgramDay as jest.Mock).mockResolvedValue({
      name: 'Day A',
      exercises: [
        { name: 'Squat', exerciseId: 1, targets: [{ reps: 5, weight: 100, restSeconds: 90 }, { reps: 5, weight: 100, restSeconds: 90 }] },
        { name: 'Bench', exerciseId: 2, targets: [{ reps: 8, weight: 60 }] },
      ],
    });
    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    await act(async () => { fireEvent.press(screen.getByText('Bench')); });
    expect(mockCancelRestNotification).toHaveBeenCalledTimes(1);
  });
});

// ─── Rest timer — wall clock accuracy ────────────────────────────────────────

describe('rest timer — wall clock accuracy on foreground resume', () => {
  let appStateListeners: Array<(state: string) => void>;
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    appStateListeners = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event: any, handler: any) => {
      appStateListeners.push(handler);
      return { remove: jest.fn() } as any;
    });
    dateNowSpy = jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('recalculates remaining from wall clock when app returns to foreground', async () => {
    const t0 = 1_000_000_000;
    dateNowSpy.mockReturnValue(t0);

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

    // Log a set at t0 — rest timer starts with 90 s remaining
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });
    expect(screen.getByText('1:30')).toBeTruthy();

    // 30 seconds elapse while app is backgrounded
    dateNowSpy.mockReturnValue(t0 + 30_000);

    // App returns to foreground — listener fires
    await act(async () => {
      appStateListeners.forEach(fn => fn('active'));
    });

    // Should show 60 s remaining, not 90 s
    expect(screen.getByText('1:00')).toBeTruthy();
  });

  it('does not recalculate when app moves to background or inactive', async () => {
    const t0 = 1_000_000_000;
    dateNowSpy.mockReturnValue(t0);

    render(<LogSession />);
    await waitFor(() => expect(screen.getAllByText('Squat').length).toBeGreaterThan(0));
    await act(async () => { fireEvent.press(screen.getByText(/Done/i)); });

    dateNowSpy.mockReturnValue(t0 + 30_000);

    // background / inactive events must not trigger recalculation
    await act(async () => {
      appStateListeners.forEach(fn => fn('background'));
      appStateListeners.forEach(fn => fn('inactive'));
    });

    // Timer display unchanged (still shows original; no tick has fired)
    expect(screen.getByText('1:00')).toBeTruthy();
  });
});

