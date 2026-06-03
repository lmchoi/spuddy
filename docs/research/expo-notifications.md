# expo-notifications reference

Source: https://docs.expo.dev/versions/latest/sdk/notifications/

## Channel setup (Android 8.0+, API 26+)

Must be called before scheduling any notifications. After creation, only `name` and `description` can be modified — importance, sound, and vibration are permanent.

```typescript
await Notifications.setNotificationChannelAsync('my-channel', {
  name: 'Display name',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  sound: null, // or 'notification.wav'
  lightColor: '#FF231F7C',
});
```

**Importance levels:**
- `MAX` — sound + vibration, most intrusive
- `HIGH` — significant interruption (use for rest-timer-expiry)
- `DEFAULT` — normal
- `LOW` — minimal
- `MIN` — silent, no visual

## setNotificationHandler

Must be set to display notifications while app is foregrounded. Handler must respond within 3 seconds or notification is discarded.

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // heads-up banner
    shouldShowList: true,     // notification shade/drawer
    shouldPlaySound: false,
    shouldSetBadge: false,
    // priority: 'high',      // Android-only
  }),
});
```

Note: `shouldShowAlert` is deprecated — use `shouldShowBanner` + `shouldShowList`.

## requestPermissionsAsync

Android grants all permissions by default. Once a user declines, you cannot re-prompt — handle denial gracefully.

```typescript
const { status } = await Notifications.requestPermissionsAsync();
// status: 'granted' | 'denied' | 'undetermined'
```

iOS-only options: `allowAlert`, `allowBadge`, `allowSound`, `allowProvisional`, `allowCriticalAlerts`.

## Trigger types

```typescript
// Immediate
trigger: null

// After N seconds
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds: 90,
  repeats: false,   // iOS: must be >= 60s if repeats: true
  channelId: 'my-channel', // Android only
}

// Specific date
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date: new Date(Date.now() + 90_000),
}
```

## Android gotchas

- **Plugin required in app.json** — `expo-notifications` must be in the `plugins` array or native manifest permissions won't be added. Requires a fresh build after adding.
- **Channel IDs are permanent** — once shipped to users, changing a channel ID breaks any notification settings they've customised. Never rename a channel.
- `setNotificationChannelAsync` must be called before `getDevicePushTokenAsync` on Android 13+.
- Android 12+ may need `SCHEDULE_EXACT_ALARM` permission for exact scheduling.
- `RECEIVE_BOOT_COMPLETED` is added automatically for scheduled notifications that survive device restart.

## iOS gotchas

- `interruptionLevel: 'timeSensitive'` requires an explicit entitlement — not testable without provisioning.
- Live Activities (Dynamic Island countdown) requires a separate SwiftUI app extension — not a JS change.
- Action buttons require `categoryIdentifier` registered separately on iOS.
- Icon may be missing on debug builds for notification-launched apps — only in debug, not release.

## SDK 53+ Expo Go restriction

Push notifications (and local notifications via expo-notifications) do not work in Expo Go on Android. Requires a dev build (`npx expo run:android`).
