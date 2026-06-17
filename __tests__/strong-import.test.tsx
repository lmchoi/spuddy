import { act, render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import StrongImportScreen from '../app/strong-import';

const mockGetDocumentAsync = jest.fn();
const mockBack = jest.fn();
const mockImportFromStrong = jest.fn();
const mockParseStrongCsv = jest.fn();

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/strongParser', () => ({
  parseStrongCsv: (...args: any[]) => mockParseStrongCsv(...args),
}));
jest.mock('@/src/strongImport', () => ({
  importFromStrong: (...args: any[]) => mockImportFromStrong(...args),
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(cb, [cb]);
  },
  useRouter: () => ({ back: mockBack }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Date to ensure recent workout logic is stable
const MOCK_NOW = new Date('2026-05-25T12:00:00Z').getTime();
jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StrongImportScreen', () => {
  const MOCK_GROUPS = [
    { name: 'Push', sessionCount: 10, lastUsed: '2026-05-01', sessions: [] },
    { name: 'Pull', sessionCount: 5, lastUsed: '2026-01-01', sessions: [] },
  ];

  it('immediately opens document picker on mount', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true });
    render(<StrongImportScreen />);
    expect(mockGetDocumentAsync).toHaveBeenCalled();
  });

  it('goes back if picker is canceled', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true });
    render(<StrongImportScreen />);
    await act(async () => {});
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders workout groups and pre-selects recent ones', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.csv' }],
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('csv content'),
    });
    mockParseStrongCsv.mockReturnValue({ workoutGroups: MOCK_GROUPS });

    render(<StrongImportScreen />);
    
    expect(await screen.findByText('Push')).toBeTruthy();
    expect(await screen.findByText('Pull')).toBeTruthy();
    
    // 'Push' is recent (May 1st vs May 25th), 'Pull' is not (Jan 1st)
    expect(screen.getByText('Import 1 workout')).toBeTruthy();
  });

  it('toggles selection when a row is pressed', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.csv' }],
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('csv content'),
    });
    mockParseStrongCsv.mockReturnValue({ workoutGroups: MOCK_GROUPS });

    render(<StrongImportScreen />);
    await screen.findByText('Push');

    fireEvent.press(screen.getByText('Pull'));
    expect(await screen.findByText('Import 2 workouts')).toBeTruthy();

    fireEvent.press(screen.getByText('Push'));
    expect(await screen.findByText('Import 1 workout')).toBeTruthy();
  });

  it('switches units', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.csv' }],
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('csv content'),
    });
    mockParseStrongCsv.mockReturnValue({ workoutGroups: MOCK_GROUPS });

    render(<StrongImportScreen />);
    await screen.findByText('kg');

    fireEvent.press(screen.getByText('lbs'));
    // No visual change we can easily assert on without looking at styles, 
    // but we can check if handleImport uses it.
    
    mockImportFromStrong.mockResolvedValue({ success: true, sessionsImported: 5, programs: [] });
    fireEvent.press(screen.getByText('Import 1 workout'));
    
    await act(async () => {});
    expect(mockImportFromStrong).toHaveBeenCalledWith(expect.anything(), 'csv content', ['Push'], 'lbs');
  });

  it('shows success alert on successful import', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.csv' }],
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('csv content'),
    });
    mockParseStrongCsv.mockReturnValue({ workoutGroups: MOCK_GROUPS });
    mockImportFromStrong.mockResolvedValue({ success: true, sessionsImported: 42, programs: [] });

    render(<StrongImportScreen />);
    await screen.findByText('Import 1 workout');

    await act(async () => {
      fireEvent.press(screen.getByText('Import 1 workout'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Imported!', '42 sessions saved.');
  });

  it('shows error alert on import failure', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.csv' }],
    });
    (global as any).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('csv content'),
    });
    mockParseStrongCsv.mockReturnValue({ workoutGroups: MOCK_GROUPS });
    mockImportFromStrong.mockResolvedValue({ success: false, error: 'Ouch' });

    render(<StrongImportScreen />);
    await screen.findByText('Import 1 workout');

    await act(async () => {
      fireEvent.press(screen.getByText('Import 1 workout'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Import failed', 'Ouch');
  });
});
