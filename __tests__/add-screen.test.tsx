import { render } from '@testing-library/react-native';
import AddTab from '../app/(tabs)/add';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  Redirect: ({ href }: { href: string }) => { mockReplace(href); return null; },
}));

beforeEach(() => jest.clearAllMocks());

it('redirects to /select-day on mount', () => {
  render(<AddTab />);
  expect(mockReplace).toHaveBeenCalledWith('/select-day');
});
