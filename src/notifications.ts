import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import {
  buildRestNotificationContent,
  type RestNotificationPayload,
} from './domain/restNotification';

export const REST_TIMER_ID = 'rest-timer';
export const NEXT_SET_ACTION = 'NEXT_SET';
export const OPEN_APP_ACTION = 'OPEN_APP';

export async function registerRestNotificationCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(REST_TIMER_ID, [
    {
      identifier: NEXT_SET_ACTION,
      buttonTitle: 'Next set',
      options: { opensAppToForeground: false },
    },
    {
      identifier: OPEN_APP_ACTION,
      buttonTitle: 'Open app',
      options: { opensAppToForeground: true },
    },
  ]);
}

export async function requestRestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleRestNotification(
  payload: RestNotificationPayload,
  delaySeconds: number
): Promise<void> {
  const { title, body } = buildRestNotificationContent(payload);
  await Notifications.scheduleNotificationAsync({
    identifier: REST_TIMER_ID,
    content: {
      title,
      body,
      data: payload,
      categoryIdentifier: REST_TIMER_ID,
    },
    trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds },
  });
}

export async function cancelRestNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REST_TIMER_ID);
}
