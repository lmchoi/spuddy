# Plan: Rest timer notifications

**Status:** In Progress  
**Depends on:** rest timer UI (must exist before notifications make sense); wall-clock fix (fix/rest-timer-wall-clock-appstate branch)

---

## Goal

When a user backgrounds the app during a rest period, show a live countdown notification. When rest expires while backgrounded, upgrade it to a high-priority alert. No notification or haptics if the user stays in the app — the UI is enough.

---

## Out of scope

- Haptics (dropped — in-app visual is sufficient)
- "Time remaining" notification when foregrounded
- Live countdown while foregrounded (user is looking at the UI)
- "Next set" action button (deferred — requires background set-logging, a separate piece of work)
- iOS Live Activities / Dynamic Island (deferred — requires a native SwiftUI app extension; see iOS note below)
- Sound toggle
- Escalating reminders
- Customisable rest duration per exercise

---

## iOS note

The Android ongoing notification maps to **Live Activities** on iOS (Dynamic Island + lock screen widget). That requires a separate app extension target written in SwiftUI — not a JS-layer change. Defer to a dedicated iOS milestone. Do not make architectural decisions that would block Live Activities later (e.g. don't assume a single notification channel covers both platforms).

The expiry alert uses `interruptionLevel: 'timeSensitive'` on iOS, which requires an explicit entitlement. Wire it in but it won't be testable without provisioning.

---

## Alert behaviour

### App is foregrounded during rest
No notification. No haptics. Timer hits zero → `onSkip()` fires → UI updates. Done.

### App is backgrounded during rest
1. Immediately post an **ongoing Android notification** showing time remaining with a live countdown (`usesChronometer` + `chronometerCountDown`). This is visible in the status bar — user can see it with a swipe-down from any app.
2. At the same time, schedule a **high-priority expiry alert** to fire when the countdown reaches zero.

### App returns to foreground before expiry
Cancel both the ongoing notification and the scheduled expiry alert. The in-app timer (corrected by wall clock) takes over.

### Timer expires while backgrounded
The scheduled expiry notification fires with high priority — interrupts the lock screen, vibrates. The ongoing countdown notification is replaced by this alert.

### Early exits (skip / exercise switch / session end)
Any path that unmounts `RestTimer` must cancel both the ongoing notification and the scheduled expiry alert. Specific paths: skip button, `jumpToExercise`, session save/end.

---

## Notification design

### Ongoing countdown (backgrounded, timer running)

> **Bench Press — resting**
> ↓ 1:23

Live countdown via `usesChronometer`. Low-importance channel (no sound, no heads-up). Persistent — not dismissable by swipe.

### Expiry alert (timer expired while backgrounded)

> **Rest complete — Bench Press**
> Time to go.

High-importance channel. Vibration. Interrupts lock screen.

**Tapping the notification body** deep-links to the log session screen.

**Action buttons:** deferred. "Next set" requires background set-logging logic that doesn't exist yet.

---

## Permissions

Request `requestPermissionsAsync()` the first time the user starts a rest timer. Provide context: "so we can remind you when rest is over, even if you switch apps." If denied, fall back gracefully — no crash, no retry loop.

---

## Notification channels (Android)

Two channels, fixed at app init:

| ID | Name | Importance | Use |
|---|---|---|---|
| `rest-timer-countdown` | Rest countdown | DEFAULT (no heads-up) | Ongoing live timer |
| `rest-timer-expiry` | Rest complete | HIGH | Expiry alert |

Channel IDs are permanent once shipped — changing them breaks notification settings users have customised. Do not rename.

---

## Implementation notes

- `expo-notifications` may not expose `usesChronometer` directly. Check at implementation time; may need `android` notification options passthrough or a fallback to a static "X:XX remaining" text updated via `setPresentedNotificationsAsync`. Flag if this requires an ADR.
- The `RestTimer` component owns all notification logic — schedule on background, cancel on foreground, cancel on unmount.
- Use a fixed notification identifier `"rest-timer-countdown"` and `"rest-timer-expiry"` so new timers replace old ones (no pile-up).

---

## Commits

1. ✅ **Fire a notification when the timer expires** — install `expo-notifications`, create `src/notifications.ts` (lazy-require, safe in Expo Go), call `presentRestExpiredNotification()` when `remaining === 0`. One Android channel (`rest-timer-expiry`, HIGH). Fires immediately via `trigger: null`. No foreground suppression yet — notification fires regardless of app state.

2. ✅ **Permission request on first rest timer start** — `requestPermissionsAsync()` when `RestTimer` first mounts, with context string. Denied → no notification, no crash. Test: permission requested once, not on every timer start.

3. ✅ **Schedule expiry notification at timer start; cancel on unmount** — switch from "fire at zero" to "schedule at mount, cancel on unmount." `RestTimer` calls `scheduleRestNotification(effectiveDuration)` on mount and cancels in the `useEffect` cleanup. Since every early exit (skip, exercise switch, session end) causes `RestTimer` to unmount, the single cleanup covers all cases — no whack-a-mole. At `remaining === 0` in the foreground, cancel and do nothing (notification would have fired anyway or is about to). Test: notification scheduled on mount, cancelled on unmount regardless of exit path.

4. **Suppress notification when app is foregrounded at expiry** — configure `setNotificationHandler` to return `shouldShowBanner: false` when the app is active, so the OS-scheduled notification fires silently in the background but shows nothing if the user is already in the app. Test: handler returns correct values based on `AppState`.

5. ✅ **Deep-link on notification tap** — `addNotificationResponseReceivedListener` routes tap to log-session screen. `setupNotificationResponseListener` in `src/notifications.ts` takes a `navigate: () => void` callback; `RootLayoutNav` wires it via `useEffect` returning the cleanup. Test: listener invokes navigate callback on response; cleanup removes subscription.
