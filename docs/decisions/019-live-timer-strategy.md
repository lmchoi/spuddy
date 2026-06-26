# ADR-019: Live Rest Timer Implementation Strategy

## Context
The "Rest Timer" is a core feature of Spuddy. To provide a professional experience, the timer must:
1. Continue ticking when the app is backgrounded or the screen is locked.
2. Update its UI at 1Hz (once per second) without draining battery.
3. Be visible without the user having to re-open the app.

The current implementation using `expo-notifications` (in `src/notifications.ts`) is limited to static notifications scheduled for the future. It does not support native ticking timers (chronometers), foreground services, or "floating" UI elements like Android Bubbles or iOS Live Activities.

We already have a guard in place (`src/notifications.ts`) that warns when running in Expo Go, as notifications (specifically SDK 53+ Android behavior) require a Development Build.

## Decision
We will transition to platform-native "Live" features for both Android and iOS.

### Platform Specifics:
- **Android:** We will use `react-native-notify-kit` (the community-maintained fork of Notifee). 
    - We will implement a **Foreground Service** with a **Notification Chronometer** for the persistent rest timer.
    - We will explore **Android Bubbles** for a "floating icon" experience, which `react-native-notify-kit` supports natively.
- **iOS:** We will use **Live Activities** (ActivityKit) to provide a ticking countdown on the Lock Screen and in the Dynamic Island. This will be implemented via an Expo Module (e.g., `expo-apple-targets` or `expo-live-activity`).

## Consequences
- **Development Workflow:** Developers MUST use Development Builds (`npx expo run:android` / `npx expo run:ios`). Expo Go will only support the non-notification/non-timer parts of the app.
- **Library Change:** We will replace `expo-notifications` with `react-native-notify-kit` on Android. We may keep `expo-notifications` for simple cross-platform push if needed, but `react-native-notify-kit` is preferred for local timer-related tasks.
- **UX:** Users get a "native-first" timer experience that is battery-efficient and highly visible.
