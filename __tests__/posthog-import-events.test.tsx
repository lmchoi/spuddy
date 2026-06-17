import { act, render, screen, waitFor } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import type { ParsedNotes } from '../src/notesParser';

jest.mock('@/src/config/posthog', () => ({
  posthog: { capture: jest.fn(), screen: jest.fn(), debug: jest.fn() },
}));

import { posthog } from '@/src/config/posthog';

const mockCapture = posthog.capture as jest.Mock;

// ─── import_completed (notes) ─────────────────────────────────────────────────

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockImportFromNotes = jest.fn();
const mockImportFromStrong = jest.fn();
const mockParseStrongCsv = jest.fn();
const mockGetDocumentAsync = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('@/src/notesImport', () => ({
  importFromNotes: (...args: unknown[]) => mockImportFromNotes(...args),
}));
jest.mock('@/src/strongImport', () => ({
  importFromStrong: (...args: unknown[]) => mockImportFromStrong(...args),
}));
jest.mock('@/src/strongParser', () => ({
  parseStrongCsv: (...args: unknown[]) => mockParseStrongCsv(...args),
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useFocusEffect: (cb: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(cb, [cb]);
  },
}));
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-25T12:00:00Z').getTime());

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

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ parsedNotes: JSON.stringify(PARSED_NOTES) });
  (Alert.alert as jest.Mock).mockImplementation(() => {});
  (Date.now as jest.Mock).mockReturnValue(new Date('2026-05-25T12:00:00Z').getTime());
});

describe('import_completed — notes', () => {
  it('fires with source=notes and imported_count equal to importable day count', async () => {
    mockImportFromNotes.mockResolvedValue({ success: true, programsCreated: 1 });

    const NotesImportReviewScreen = require('../app/notes-import-review').default;
    render(<NotesImportReviewScreen />);

    fireEvent.press(screen.getByText('Import 1 program'));

    await waitFor(() =>
      expect(mockCapture).toHaveBeenCalledWith('import_completed', {
        source: 'notes',
        imported_count: 1,
      })
    );
  });
});

// ─── import_completed (strong) ────────────────────────────────────────────────

describe('import_completed — strong', () => {
  const MOCK_GROUPS = [
    { name: 'Push', sessionCount: 10, lastUsed: '2026-05-01', sessions: [] },
  ];

  it('fires with source=strong and session_count from result', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.csv' }],
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('csv content'),
    });
    mockParseStrongCsv.mockReturnValue({ workoutGroups: MOCK_GROUPS });
    mockImportFromStrong.mockResolvedValue({ success: true, sessionsImported: 42, programs: [] });

    const StrongImportScreen = require('../app/strong-import').default;
    render(<StrongImportScreen />);
    await screen.findByText('Import 1 workout');

    await act(async () => { fireEvent.press(screen.getByText('Import 1 workout')); });

    expect(mockCapture).toHaveBeenCalledWith('import_completed', {
      source: 'strong',
      imported_count: 42,
    });
  });
});
