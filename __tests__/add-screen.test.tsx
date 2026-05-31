import { render } from '@testing-library/react-native';
import AddTab from '../app/(tabs)/add';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

beforeEach(() => jest.clearAllMocks());

it('redirects to /select-day on mount', () => {
  render(<AddTab />);
  expect(mockReplace).toHaveBeenCalledWith('/select-day');
});
