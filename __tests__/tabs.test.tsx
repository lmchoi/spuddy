import { render, screen } from '@testing-library/react-native';
import ProgressScreen from '../app/(tabs)/progress';
import SettingsScreen from '../app/(tabs)/settings';

describe('Progress screen', () => {
  it('renders placeholder text', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Progress coming soon')).toBeTruthy();
  });
});

describe('Settings screen', () => {
  it('renders placeholder text', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings coming soon')).toBeTruthy();
  });
});
