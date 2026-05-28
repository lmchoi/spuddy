import { render, screen, fireEvent } from '@testing-library/react-native';
import { KeyboardAvoidingView } from 'react-native';
import NotesImportScreen from '../app/notes-import';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockImportFromNotes = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/notesImport', () => ({
  importFromNotes: (...args: any[]) => mockImportFromNotes(...args),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NotesImportScreen', () => {
  it('wraps content in KeyboardAvoidingView to keep Import button above keyboard', () => {
    const { UNSAFE_getByType } = render(<NotesImportScreen />);
    expect(UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
  });

  it('renders the paste textarea', () => {
    render(<NotesImportScreen />);
    expect(screen.getByPlaceholderText(/Upper body/)).toBeTruthy();
  });

  it('Import button is disabled with no text', () => {
    render(<NotesImportScreen />);
    expect(screen.getByText('Paste notes to import')).toBeTruthy();
  });

  it('shows live preview after parsing exercises from text', () => {
    render(<NotesImportScreen />);
    const input = screen.getByPlaceholderText(/Upper body/);
    fireEvent.changeText(input, 'Push\n- Bench press - 80\n- Overhead press - 50');
    expect(screen.getByText('Push')).toBeTruthy();
    expect(screen.getByText('2 exercises')).toBeTruthy();
  });

  it('shows unit picker when inferredUnit is null', () => {
    render(<NotesImportScreen />);
    const input = screen.getByPlaceholderText(/Upper body/);
    fireEvent.changeText(input, '- Bench press - 80');
    expect(screen.getByText('kg')).toBeTruthy();
    expect(screen.getByText('lbs')).toBeTruthy();
  });

  it('hides unit picker when inferredUnit is unambiguous', () => {
    render(<NotesImportScreen />);
    const input = screen.getByPlaceholderText(/Upper body/);
    fireEvent.changeText(input, '- Bench press - 80kg\n- Squat - 100kg');
    expect(screen.queryByText('lbs')).toBeNull();
  });

  it('shows "Import N programs" CTA when exercises are present', () => {
    render(<NotesImportScreen />);
    const input = screen.getByPlaceholderText(/Upper body/);
    fireEvent.changeText(input, 'Push\n- Bench press - 80');
    expect(screen.getByText('Import 1 program')).toBeTruthy();
  });

  it('CTA count excludes empty sections', () => {
    render(<NotesImportScreen />);
    const input = screen.getByPlaceholderText(/Upper body/);
    // Two section headers, only one has exercises
    fireEvent.changeText(input, 'Push\n- Bench press - 80\nPull');
    expect(screen.getByText('Import 1 program')).toBeTruthy();
  });
});
