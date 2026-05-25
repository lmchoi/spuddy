import { render, screen, waitFor } from '@testing-library/react-native';
import ProgramDayDetailScreen from '../app/(tabs)/settings/[programName]/[dayIndex]';

const mockGetProgramDay = jest.fn();

jest.mock('@/src/db', () => ({ getDB: jest.fn().mockResolvedValue({}) }));
jest.mock('@/src/programStorage', () => ({
  getProgramDay: (...args: unknown[]) => mockGetProgramDay(...args),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => { cb(); },
  useLocalSearchParams: jest.fn().mockReturnValue({ programName: 'Push%20Pull%20Legs', dayIndex: '0' }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetProgramDay.mockResolvedValue(null);
});

describe('ProgramDayDetail screen', () => {
  it('shows loading placeholder before data arrives', () => {
    mockGetProgramDay.mockReturnValue(new Promise(() => {}));
    render(<ProgramDayDetailScreen />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows day name once loaded', async () => {
    mockGetProgramDay.mockResolvedValue({
      name: 'Push Day',
      exercises: [{ name: 'Bench Press', targets: [] }],
    });
    render(<ProgramDayDetailScreen />);
    await waitFor(() => expect(screen.getByText('Push Day')).toBeTruthy());
  });

  it('shows exercise count once loaded', async () => {
    mockGetProgramDay.mockResolvedValue({
      name: 'Push Day',
      exercises: [
        { name: 'Bench Press', targets: [] },
        { name: 'OHP', targets: [] },
      ],
    });
    render(<ProgramDayDetailScreen />);
    await waitFor(() => expect(screen.getByText('2 exercises')).toBeTruthy());
  });

  it('shows singular exercise count for one exercise', async () => {
    mockGetProgramDay.mockResolvedValue({
      name: 'Push Day',
      exercises: [{ name: 'Bench Press', targets: [] }],
    });
    render(<ProgramDayDetailScreen />);
    await waitFor(() => expect(screen.getByText('1 exercise')).toBeTruthy());
  });
});
