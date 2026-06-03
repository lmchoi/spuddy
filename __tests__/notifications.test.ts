import { requestNotificationPermission, scheduleRestNotification, cancelRestNotification, REST_NOTIFICATION_ID } from '@/src/notifications';

const mockRequestPermissionsAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: mockRequestPermissionsAsync,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}), { virtual: true });

jest.mock('expo-constants', () => ({
  default: { appOwnership: null },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe('requestNotificationPermission', () => {
  it('returns true when permission granted', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });

  it('returns false when permission denied', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

describe('scheduleRestNotification', () => {
  it('schedules with the correct identifier, content, and delay', async () => {
    mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
    mockScheduleNotificationAsync.mockResolvedValue(undefined);
    await scheduleRestNotification(90);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: REST_NOTIFICATION_ID,
      content: { title: 'Time to go again', body: 'Tap to log your next set' },
      trigger: { type: 'timeInterval', seconds: 90, channelId: 'rest-timer' },
    });
  });

  it('cancels any existing notification before scheduling', async () => {
    const calls: string[] = [];
    mockCancelScheduledNotificationAsync.mockImplementation(async () => { calls.push('cancel'); });
    mockScheduleNotificationAsync.mockImplementation(async () => { calls.push('schedule'); });

    await scheduleRestNotification(90);

    expect(calls).toEqual(['cancel', 'schedule']);
  });
});

describe('cancelRestNotification', () => {
  it('cancels the scheduled notification by identifier', async () => {
    mockCancelScheduledNotificationAsync.mockResolvedValue(undefined);
    await cancelRestNotification();
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(REST_NOTIFICATION_ID);
  });
});
