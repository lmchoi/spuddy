const mockScheduleNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockCancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockSetNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
const mockSetNotificationHandler = jest.fn();
const mockRequestPermissionsAsync = jest.fn().mockResolvedValue(undefined);
const mockAddNotificationResponseReceivedListener = jest.fn();

jest.mock('expo-constants', () => ({
  default: { appOwnership: 'standalone' },
}));

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

import {
  scheduleRestExpiredNotification,
  cancelRestExpiredNotification,
  setupNotificationChannel,
  setupNotificationResponseListener,
} from '@/src/notifications';

beforeEach(() => {
  jest.clearAllMocks();
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
