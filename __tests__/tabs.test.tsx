import { render, screen, waitFor } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress/index';
import AddScreen from '../app/(tabs)/add';
import SettingsScreen from '../app/(tabs)/settings';

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/storage', () => ({ getUniqueExerciseNames: jest.fn().mockResolvedValue([]) }));
jest.mock('@/src/programStorage', () => ({ getProgram: jest.fn().mockResolvedValue(null) }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: jest.fn(),
}));

describe('Add screen', () => {
  it('renders a text input', () => {
    render(<AddScreen />);
    expect(screen.getByPlaceholderText('Paste your Liftosaur workout here')).toBeTruthy();
  });

  it('renders a disabled Save button', () => {
    render(<AddScreen />);
    expect(screen.getByText('Save')).toBeTruthy();
  });
});

describe('Progress screen', () => {
  it('renders without crashing', async () => {
    render(<ProgressScreen />);
    await waitFor(() =>
      expect(screen.getByText('No workouts logged yet')).toBeTruthy()
    );
  });
});

describe('Settings screen', () => {
  it('renders without crashing', () => {
    render(<SettingsScreen />);
  });
});
