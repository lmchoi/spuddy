const mockScheduleNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockCancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockSetNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
const mockSetNotificationHandler = jest.fn();

jest.mock('expo-constants', () => ({
  default: { appOwnership: 'standalone' },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduledNotificationAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

import {
  scheduleRestExpiredNotification,
  cancelRestExpiredNotification,
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
