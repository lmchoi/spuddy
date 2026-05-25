import { render } from '@testing-library/react-native';
import SessionMockup from '../app/session-mockup';

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

describe('SessionMockup', () => {
  it('renders without crashing', () => {
    render(<SessionMockup />);
  });
});
