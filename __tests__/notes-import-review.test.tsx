import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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
        { name: 'Bench press', sets: 3, reps: null, weight: 80, explicitUnit: 'kg' },
        { name: 'OHP', sets: 1, reps: null, weight: 50, explicitUnit: null },
      ],
    },
  ],
  inferredUnit: 'kg',
  skippedLines: 0,
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

  it('shows summary line with program and exercise counts', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('1 program · 2 exercises')).toBeTruthy();
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

  it('shows Import button with correct program count', () => {
    render(<NotesImportReviewScreen />);
    expect(screen.getByText('Import 1 program')).toBeTruthy();
  });

  it('shows skipped lines warning when skippedLines > 0', () => {
    const withSkipped: ParsedNotes = { ...PARSED_NOTES, skippedLines: 2 };
    mockUseLocalSearchParams.mockReturnValue({ parsedNotes: JSON.stringify(withSkipped) });
    render(<NotesImportReviewScreen />);
    expect(screen.getByText(/2 lines skipped/)).toBeTruthy();
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
});
