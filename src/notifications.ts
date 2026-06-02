import Constants from 'expo-constants';

type ExpoNotifications = typeof import('expo-notifications');
let _N: ExpoNotifications | null = null;
let _warnedExpoGo = false;

// expo-notifications is unavailable in Expo Go on Android (SDK 53+).
// Lazy-require so we never touch the package in Expo Go; warn once so the
// developer knows why notifications are silently disabled.
function getN(): ExpoNotifications | null {
  if (Constants.appOwnership === 'expo') {
    if (!_warnedExpoGo) {
      _warnedExpoGo = true;
      console.warn(
        '[notifications] Running in Expo Go — notifications are disabled.\n' +
        'Use a development build (`npx expo run:android`) to test notifications.'
      );
    }
    return null;
  }
  if (_N) return _N;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _N = require('expo-notifications') as ExpoNotifications;
    return _N;
  } catch {
    return null;
  }
}

export const REST_NOTIFICATION_ID = 'rest-timer';
const REST_CHANNEL_ID = 'rest-timer';

export async function setupNotificationChannel(): Promise<void> {
  const N = getN();
  if (!N) return;
  await N.setNotificationChannelAsync(REST_CHANNEL_ID, {
    name: 'Rest Timer',
    importance: N.AndroidImportance.HIGH,
    sound: null,
    enableVibrate: false,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const N = getN();
  if (!N) return false;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleRestNotification(delaySeconds: number): Promise<void> {
  const N = getN();
  if (!N) return;
  await N.scheduleNotificationAsync({
    identifier: REST_NOTIFICATION_ID,
    content: {
      title: 'Time to go again',
      body: 'Tap to log your next set',
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      channelId: REST_CHANNEL_ID,
    },
  });
}

export async function cancelRestNotification(): Promise<void> {
  const N = getN();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID);
}
