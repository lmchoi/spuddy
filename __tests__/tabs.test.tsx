import { render, screen } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress';
import AddScreen from '../app/(tabs)/add';
import SettingsScreen from '../app/(tabs)/settings';

describe('Progress screen', () => {
  it('renders placeholder text', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Progress coming soon')).toBeTruthy();
  });
});

describe('Add screen', () => {
  it('renders placeholder text', () => {
    render(<AddScreen />);
    expect(screen.getByText('Add workout coming soon')).toBeTruthy();
  });
});

describe('Settings screen', () => {
  it('renders placeholder text', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings coming soon')).toBeTruthy();
  });
});
