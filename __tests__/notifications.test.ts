const mockScheduleNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockCancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockSetNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
const mockSetNotificationHandler = jest.fn();
const mockRequestPermissionsAsync = jest.fn().mockResolvedValue(undefined);
const mockAddNotificationResponseReceivedListener = jest.fn();

jest.mock('expo-constants', () => ({
  default: { appOwnership: 'standalone' },
}));

let mockAppState = 'active';

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  addNotificationResponseReceivedListener: (...args: unknown[]) =>
    mockAddNotificationResponseReceivedListener(...args),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

import { AppState } from 'react-native';
import {
  scheduleRestExpiredNotification,
  cancelRestExpiredNotification,
  setupNotificationChannel,
  setupNotificationResponseListener,
} from '@/src/notifications';

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(AppState, 'currentState', { get: () => mockAppState, configurable: true });
});

describe('scheduleRestExpiredNotification', () => {
  it('schedules with a time-interval trigger for the given seconds', async () => {
    await scheduleRestExpiredNotification(90);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'rest-timer-expiry',
        trigger: expect.objectContaining({ seconds: 90 }),
      })
    );
  });

  it('does not repeat', async () => {
    await scheduleRestExpiredNotification(60);
    const call = mockScheduleNotificationAsync.mock.calls[0][0] as { trigger: { repeats?: boolean } };
    expect(call.trigger.repeats).toBe(false);
  });
});

describe('cancelRestExpiredNotification', () => {
  it('cancels by the rest-timer-expiry identifier', async () => {
    await cancelRestExpiredNotification();
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('rest-timer-expiry');
  });
});

describe('setupNotificationChannel — permissions', () => {
  it('calls requestPermissionsAsync on every channel setup', async () => {
    await setupNotificationChannel();
    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

describe('setupNotificationChannel — foreground suppression', () => {
  async function getHandler() {
    await setupNotificationChannel();
    return mockSetNotificationHandler.mock.calls[0][0] as {
      handleNotification: () => Promise<{ shouldShowBanner: boolean; shouldShowList: boolean }>;
    };
  }

  it('suppresses banner and list entry when app is active (foregrounded)', async () => {
    mockAppState = 'active';
    const handler = await getHandler();
    const result = await handler.handleNotification();
    expect(result.shouldShowBanner).toBe(false);
    expect(result.shouldShowList).toBe(false);
  });

  it('shows banner and list entry when app is backgrounded', async () => {
    mockAppState = 'background';
    const handler = await getHandler();
    const result = await handler.handleNotification();
    expect(result.shouldShowBanner).toBe(true);
    expect(result.shouldShowList).toBe(true);
  });
});

describe('setupNotificationResponseListener', () => {
  it('calls navigate when a notification response is received', () => {
    const mockNavigate = jest.fn();
    const mockSub = { remove: jest.fn() };
    mockAddNotificationResponseReceivedListener.mockReturnValue(mockSub);

    setupNotificationResponseListener(mockNavigate);

    const callback = mockAddNotificationResponseReceivedListener.mock.calls[0][0] as () => void;
    callback();

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('returns a cleanup function that removes the subscription', () => {
    const mockSub = { remove: jest.fn() };
    mockAddNotificationResponseReceivedListener.mockReturnValue(mockSub);

    const cleanup = setupNotificationResponseListener(jest.fn());
    cleanup();

    expect(mockSub.remove).toHaveBeenCalled();
  });
});
