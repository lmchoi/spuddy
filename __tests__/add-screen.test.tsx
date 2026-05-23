import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AddScreen from '../app/(tabs)/add';

const VALID_PASTE = `2026-05-22
exercises: {
  Bench Press / 3x8 60kg / target: 3x8 60kg
  Pull-ups / 3x6 / target: 3x6
}`;

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSessionExists = jest.fn();
const mockSaveSession = jest.fn();

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({
  sessionExists: (...args: unknown[]) => mockSessionExists(...args),
  saveSession: (...args: unknown[]) => mockSaveSession(...args),
}));
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: () => mockBack() },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSessionExists.mockResolvedValue(false);
  mockSaveSession.mockResolvedValue(undefined);
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('shows the hero and disabled save button', () => {
    render(<AddScreen />);
    expect(screen.getByText('What did you do today?')).toBeTruthy();
    expect(screen.getByText('Paste to begin')).toBeTruthy();
  });

  it('does not show Cancel when textarea is empty', () => {
    render(<AddScreen />);
    expect(screen.queryByText('Cancel')).toBeNull();
  });
});

// ─── Back button ──────────────────────────────────────────────────────────────

describe('back button', () => {
  it('calls router.back()', () => {
    render(<AddScreen />);
    fireEvent.press(screen.getByText('←'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

// ─── Valid paste ──────────────────────────────────────────────────────────────

describe('valid paste', () => {
  it('enables the save button with the exercise count', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() =>
      expect(screen.getByText('Save 2 exercises')).toBeTruthy()
    );
  });

  it('renders one preview row per parsed exercise', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeTruthy();
      expect(screen.getByText('Pull-ups')).toBeTruthy();
    });
  });

  it('shows Cancel button once there is text', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Cancel')).toBeTruthy());
  });
});

// ─── Exercise row expand/collapse ─────────────────────────────────────────────

describe('exercise row', () => {
  it('expands to show set chips on tap', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Bench Press')).toBeTruthy());
    fireEvent.press(screen.getByText('Bench Press'));
    // 3 sets of 8 × 60kg — assert at least one chip appeared
    expect(screen.getAllByText('8 × 60kg').length).toBeGreaterThan(0);
  });

  it('collapses again on second tap', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Bench Press')).toBeTruthy());
    fireEvent.press(screen.getByText('Bench Press'));
    fireEvent.press(screen.getByText('Bench Press'));
    expect(screen.queryByText('8 × 60kg')).toBeNull();
  });
});

// ─── Cancel button ────────────────────────────────────────────────────────────

describe('cancel button', () => {
  it('clears the textarea and resets to empty state', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Cancel')).toBeTruthy());
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.getByText('Paste to begin')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();
  });
});

// ─── Save flow ────────────────────────────────────────────────────────────────

describe('save flow', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls saveSession and shows the saved state', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Save 2 exercises')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Save 2 exercises')); });
    expect(mockSaveSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  it('"View session" routes to the session detail page', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Save 2 exercises')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Save 2 exercises')); });
    fireEvent.press(screen.getByText('View session'));
    expect(mockPush).toHaveBeenCalledWith('/progress/2026-05-22');
  });

  it('"Add another" resets to the empty state', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Save 2 exercises')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('Save 2 exercises')); });
    fireEvent.press(screen.getByText('Add another'));
    expect(screen.getByText('Paste to begin')).toBeTruthy();
  });
});

// ─── Duplicate banner ─────────────────────────────────────────────────────────

describe('duplicate banner', () => {
  beforeEach(() => {
    mockSessionExists.mockResolvedValue(true);
  });

  it('shows the banner when a session for that date already exists', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() =>
      expect(screen.getByText(/A session for .* already exists/)).toBeTruthy()
    );
  });

  it('"View existing" routes to the existing session', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('View existing')).toBeTruthy());
    fireEvent.press(screen.getByText('View existing'));
    expect(mockPush).toHaveBeenCalledWith('/progress/2026-05-22');
  });

  it('"Dismiss" clears the banner', async () => {
    render(<AddScreen />);
    fireEvent.changeText(screen.getByDisplayValue(''), VALID_PASTE);
    await waitFor(() => expect(screen.getByText('Dismiss')).toBeTruthy());
    fireEvent.press(screen.getByText('Dismiss'));
    expect(screen.queryByText(/A session for .* already exists/)).toBeNull();
  });
});
