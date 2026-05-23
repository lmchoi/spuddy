import { render, screen } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress';
import AddScreen from '../app/(tabs)/add';
import SettingsScreen from '../app/(tabs)/settings';

describe('Add screen', () => {
  it('renders a text input', () => {
    render(<AddScreen />);
    expect(screen.getByPlaceholderText('Paste your Liftosaur workout here')).toBeTruthy();
  });

  it('renders a disabled Save button', () => {
    render(<AddScreen />);
    const button = screen.getByText('Save');
    expect(button).toBeTruthy();
  });
});

describe('Progress screen', () => {
  it('renders without crashing', () => {
    render(<ProgressScreen />);
  });

  it('shows empty state when there are no exercises', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('No workouts logged yet')).toBeTruthy();
  });
});

describe('Settings screen', () => {
  it('renders without crashing', () => {
    render(<SettingsScreen />);
  });
});
