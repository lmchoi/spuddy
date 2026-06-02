import * as Notifications from 'expo-notifications';
import {
  REST_TIMER_ID,
  NEXT_SET_ACTION,
  OPEN_APP_ACTION,
  scheduleRestNotification,
  cancelRestNotification,
  requestRestNotificationPermission,
  registerRestNotificationCategory,
} from '@/src/notifications';
import type { RestNotificationPayload } from '@/src/domain/restNotification';

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4 },
}));

const payload: RestNotificationPayload = {
  exerciseName: 'Squat',
  reps: 5,
  weight: 100,
  programName: 'SL5x5',
  dayIndex: 0,
  exerciseIdx: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('constants', () => {
  it('REST_TIMER_ID is the fixed notification identifier', () => {
    expect(REST_TIMER_ID).toBe('rest-timer');
  });

  it('NEXT_SET_ACTION and OPEN_APP_ACTION are defined', () => {
    expect(NEXT_SET_ACTION).toBeDefined();
    expect(OPEN_APP_ACTION).toBeDefined();
  });
});

describe('scheduleRestNotification', () => {
  it('calls scheduleNotificationAsync with the fixed identifier', async () => {
    await scheduleRestNotification(payload, 90);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: REST_TIMER_ID })
    );
  });

  it('passes the delay as a TimeIntervalTrigger', async () => {
    await scheduleRestNotification(payload, 120);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.trigger).toMatchObject({ seconds: 120 });
  });

  it('embeds the full payload in notification data', async () => {
    await scheduleRestNotification(payload, 60);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.data).toMatchObject(payload);
  });

  it('sets the category to REST_TIMER_ID for action buttons', async () => {
    await scheduleRestNotification(payload, 60);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.categoryIdentifier).toBe(REST_TIMER_ID);
  });

  it('notification title matches buildRestNotificationContent', async () => {
    await scheduleRestNotification(payload, 60);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.title).toContain('Squat');
  });
});

describe('cancelRestNotification', () => {
  it('calls cancelScheduledNotificationAsync with REST_TIMER_ID', async () => {
    await cancelRestNotification();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(REST_TIMER_ID);
  });
});

describe('requestRestNotificationPermission', () => {
  it('returns true when permission is granted', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    const result = await requestRestNotificationPermission();
    expect(result).toBe(true);
  });

  it('returns false when permission is denied', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const result = await requestRestNotificationPermission();
    expect(result).toBe(false);
  });
});

describe('registerRestNotificationCategory', () => {
  it('calls setNotificationCategoryAsync with REST_TIMER_ID', async () => {
    await registerRestNotificationCategory();
    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      REST_TIMER_ID,
      expect.arrayContaining([
        expect.objectContaining({ identifier: NEXT_SET_ACTION }),
        expect.objectContaining({ identifier: OPEN_APP_ACTION }),
      ])
    );
  });
});
