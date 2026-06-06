import Constants from 'expo-constants';
import { AppState } from 'react-native';

type ExpoNotifications = typeof import('expo-notifications');
let _N: ExpoNotifications | null = null;
let _warned = false;

// expo-notifications is unavailable in Expo Go on Android (SDK 53+).
// Lazy-require so we never touch the package in Expo Go.
function getN(): ExpoNotifications | null {
  if (Constants.appOwnership === 'expo') {
    if (!_warned) {
      _warned = true;
      console.warn(
        '[notifications] Running in Expo Go — notifications disabled. Use a dev build.'
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

const REST_EXPIRY_CHANNEL_ID = 'rest-timer-expiry';
const REST_EXPIRY_SOUND_CHANNEL_ID = 'rest-timer-expiry-sound';

let _currentShouldPlaySound = false;

export async function setupNotificationChannel(): Promise<void> {
  const N = getN();
  if (!N) return;
  await N.requestPermissionsAsync();
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: AppState.currentState !== 'active',
      shouldShowList: AppState.currentState !== 'active',
      shouldPlaySound: _currentShouldPlaySound,
      shouldSetBadge: false,
    }),
  });
  await N.setNotificationChannelAsync(REST_EXPIRY_CHANNEL_ID, {
    name: 'Rest complete',
    importance: N.AndroidImportance.HIGH,
    enableVibrate: true,
    sound: null,
  });
  await N.setNotificationChannelAsync(REST_EXPIRY_SOUND_CHANNEL_ID, {
    name: 'Rest complete (sound)',
    importance: N.AndroidImportance.HIGH,
    enableVibrate: true,
    sound: 'default',
  });
}

export async function scheduleRestExpiredNotification(seconds: number, sound = false): Promise<void> {
  const N = getN();
  if (!N) return;
  _currentShouldPlaySound = sound;
  const channelId = sound ? REST_EXPIRY_SOUND_CHANNEL_ID : REST_EXPIRY_CHANNEL_ID;
  await N.scheduleNotificationAsync({
    identifier: REST_EXPIRY_CHANNEL_ID,
    content: {
      title: 'Rest complete',
      body: 'Time to go.',
    },
    trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false, channelId },
  });
}

export async function cancelRestExpiredNotification(): Promise<void> {
  const N = getN();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(REST_EXPIRY_CHANNEL_ID);
}

export function setupNotificationResponseListener(navigate: () => void): () => void {
  const N = getN();
  if (!N) return () => {};
  const sub = N.addNotificationResponseReceivedListener(() => {
    navigate();
  });
  return () => sub.remove();
}
