import { act, render, screen, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../app/(tabs)/settings';
import { C } from '../components/spuddy/palette';

const mockGetPrograms = jest.fn();
const mockImportProgramFromJson = jest.fn();
const mockGetDocumentAsync = jest.fn();

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
  useFocusEffect: (cb: () => void) => { cb(); },
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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

  it('shows Import Programs button', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Import Programs')).toBeTruthy();
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

  it('shows Replace Programs button when programs exist', async () => {
    render(<SettingsScreen />);
    expect(await screen.findByText('Replace Programs')).toBeTruthy();
  });
});

// ─── Import button disabled state ────────────────────────────────────────────

describe('import disabled state', () => {
  it('shows Importing… and uses a readable text colour during import', async () => {
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
    await screen.findByText('Import Programs');

    await act(async () => {
      fireEvent.press(screen.getByText('Import Programs'));
      await Promise.resolve();
      await Promise.resolve();
    });

    const importingText = await screen.findByText('Importing…');

    // C.bg (#181109) is near-black — invisible on the dark C.cardSoft disabled background
    expect(importingText).not.toHaveStyle({ color: C.bg });
  });
});
