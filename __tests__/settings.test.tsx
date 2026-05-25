import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '../app/(tabs)/settings';

const mockGetPrograms = jest.fn();
const mockImportProgramFromJson = jest.fn();
const mockGetDocumentAsync = jest.fn();
const mockPush = jest.fn();

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/programStorage', () => ({
  getPrograms: (...args: unknown[]) => mockGetPrograms(...args),
}));
jest.mock('@/src/programImport', () => ({
  importProgramFromJson: (...args: unknown[]) => mockImportProgramFromJson(...args),
}));
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(cb, [cb]);
  },
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPrograms.mockResolvedValue([]);
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('renders the screen title', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Settings')).toBeTruthy();
  });

  it('shows empty message when no programs loaded', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('No programs loaded')).toBeTruthy();
  });

  it('shows Data section with both import options', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Import Liftosaur JSON')).toBeTruthy();
    expect(await screen.findByText('Import from Strong')).toBeTruthy();
  });
});

// ─── With programs loaded ─────────────────────────────────────────────────────

describe('programs loaded', () => {
  const PROGRAMS = [
    {
      name: 'Push Pull Legs',
      days: [
        { name: 'Push', exercises: [{ name: 'Bench Press' }, { name: 'OHP' }] },
        { name: 'Pull', exercises: [{ name: 'Pull-ups' }] },
      ],
    },
  ];

  beforeEach(() => {
    mockGetPrograms.mockResolvedValue(PROGRAMS);
  });

  it('renders the program name', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Push Pull Legs')).toBeTruthy();
  });

  it('renders each day name', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Push')).toBeTruthy();
    expect(await screen.findByText('Pull')).toBeTruthy();
  });

  it('shows Import Liftosaur JSON when programs exist', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Import Liftosaur JSON')).toBeTruthy();
  });
});

// ─── Import button disabled state ────────────────────────────────────────────

describe('import disabled state', () => {
  it('shows Importing… during import', async () => {
    // Hang the import so the component stays in importing=true state
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.json' }],
    });
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('{}'),
    });
    mockImportProgramFromJson.mockReturnValue(new Promise(() => {})); // never resolves

    render(<SettingsScreen />);
    await screen.findByText('Import Liftosaur JSON');

    await act(async () => {
      fireEvent.press(screen.getByText('Import Liftosaur JSON'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(await screen.findByText('Importing…')).toBeTruthy();
  });
});

// ─── Import interaction ──────────────────────────────────────────────────────

describe('import interaction', () => {
  it('calls push when Import from Strong is pressed', async () => {
    render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Import from Strong'));
    });
    expect(mockPush).toHaveBeenCalledWith('/strong-import');
  });

  it('successfully imports a program and shows alert', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.json' }],
    });
    (global as { fetch?: any }).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('{}'),
    });
    const importedPrograms = [
      {
        name: 'Test Program',
        days: [],
        activeDayIndex: 0,
      },
    ];
    mockImportProgramFromJson.mockResolvedValue({ success: true, programs: importedPrograms });

    render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Import Liftosaur JSON'));
    });

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Programs imported', 'Test Program (0 days)'));
    expect(await screen.findByText('Test Program')).toBeTruthy();
  });

  it('shows alert on import failure', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.json' }],
    });
    (global as { fetch?: any }).fetch = jest.fn().mockResolvedValue({
      text: () => Promise.resolve('{}'),
    });
    mockImportProgramFromJson.mockResolvedValue({ success: false, error: 'Bad file' });

    render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Import Liftosaur JSON'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Import failed', 'Bad file');
  });

  it('shows alert on fetch error', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.json' }],
    });
    (global as { fetch?: any }).fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Import Liftosaur JSON'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Import failed', 'Could not read or parse the file.');
  });
});
