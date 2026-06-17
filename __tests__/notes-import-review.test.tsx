jest.mock('@/src/config/posthog', () => ({
  posthog: { capture: jest.fn(), screen: jest.fn(), debug: jest.fn() },
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NotesImportReviewScreen from '../app/notes-import-review';
import type { ParsedNotes } from '../src/notesParser';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockImportFromNotes = jest.fn();
const mockUseLocalSearchParams = jest.fn();

const PARSED_NOTES: ParsedNotes = {
  sections: [
    {
      name: 'Push',
      exercises: [
        { name: 'Bench press', sets: 3, reps: 10, weight: 80, explicitUnit: 'kg' },
        { name: 'OHP', sets: 1, reps: null, weight: 50, explicitUnit: null },
      ],
    },
  ],
  inferredUnit: 'kg',
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/notesImport', () => ({
  importFromNotes: (...args: unknown[]) => mockImportFromNotes(...args),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ parsedNotes: JSON.stringify(PARSED_NOTES) });
});

describe('NotesImportReviewScreen', () => {
  it('renders "Review import" header', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('Review import')).toBeTruthy();
  });

  it('shows summary line with program, day, and exercise counts', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('1 program · 1 day · 2 exercises')).toBeTruthy();
  });

  it('shows section name pill', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('Push')).toBeTruthy();
  });

  it('shows exercise names', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('Bench press')).toBeTruthy();
    expect(screen.getByText('OHP')).toBeTruthy();
  });

  it('shows sets×reps · weight when both sets and reps are present', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('3×10 · 80kg')).toBeTruthy();
  });

  it('shows sets-only label when reps is null', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('1 set · 50kg')).toBeTruthy();
  });

  it('shows only weight when sets and reps are null', () => {
    const withNullSets: ParsedNotes = {
      ...PARSED_NOTES,
      sections: [{
        name: 'Push',
        exercises: [{ name: 'Bench press', sets: null, reps: null, weight: 80, explicitUnit: 'kg' }],
      }],
    };
    mockUseLocalSearchParams.mockReturnValue({ parsedNotes: JSON.stringify(withNullSets) });
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('80kg')).toBeTruthy();
    expect(screen.queryByText(/set/)).toBeNull();
  });

  it('shows Import button with correct program count', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('Import 1 program')).toBeTruthy();
  });

  it('does not show skipped lines warning when skippedLines is 0', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.queryByText(/skipped/)).toBeNull();
  });

  it('calls importFromNotes and navigates to settings on success', async () => {
    mockImportFromNotes.mockResolvedValue({ success: true, programsCreated: 1 });
    render(<NotesImportReviewScreen />);
    fireEvent.press(screen.getByText('Import 1 program'));
    await waitFor(() =>
      expect(mockImportFromNotes).toHaveBeenCalledWith(expect.anything(), PARSED_NOTES)
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/settings'));
  });

  it('shows the actual error message when import throws', async () => {
    jest.spyOn(Alert, 'alert');
    mockImportFromNotes.mockRejectedValue(new Error('table programs has no column named foo'));
    render(<NotesImportReviewScreen />);
    fireEvent.press(screen.getByText('Import 1 program'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Import failed', 'table programs has no column named foo')
    );
  });
});
