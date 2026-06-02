# Plan: Rest timer notifications

**Status:** Draft  
**Depends on:** rest timer UI (must exist before notifications make sense)

---

## Goal

When a user's rest period ends, the app alerts them without requiring sound — so it works in a gym setting regardless of whether they have earphones in. The user can advance to their next set or jump back to the log session screen without having to switch back to the app manually.

---

## Alert behaviour

### If the app is foregrounded
Trigger a haptic pulse via `expo-haptics` (`impactAsync`) when the timer hits zero. No notification shown — the UI updates in place.

### If the app is backgrounded
Schedule a local push notification (via `expo-notifications`) when the rest timer starts. The notification fires at timer expiry and vibrates the device. On silent/vibrate mode this works without sound; if the user has earphones in and wants audio, that's covered by the sound toggle (see below).

**Single notification rule:** the notification is always scheduled with a fixed identifier (`"rest-timer"`). Scheduling a new one replaces the previous one — no pile-up if the user logs sets in quick succession or cancels a rest early.

---

## Notification design

The notification body shows the last logged set so the user can confirm before acting:

> **Rest complete — Bench Press**
> 8 reps × 60 kg · Tap "Next set" to log the same, or Open App to change.

**Action buttons (two):**

| Button | Behaviour |
|---|---|
| **Next set** | Logs an identical set (same reps + weight) in the background. No app switch. Notification dismisses. |
| **Open app** | Deep-links to the log session screen. Use this to change exercise, adjust reps/weight, or end the session. |

The copy makes the distinction explicit: "Next set" = same as last time; "Open app" = anything else. This avoids the user accidentally logging a set they didn't intend.

**Tapping the notification body** (not a button) also deep-links to the log session screen — same as "Open app". Handled in `addNotificationResponseReceivedListener` by checking the identifier and routing accordingly.

### iOS caveat
On iOS, action buttons are only visible after the user long-presses or pulls down on the notification — they are not shown on the collapsed banner. Worth a brief onboarding tooltip or a note in settings so users discover the buttons. On Android they are visible immediately.

---

## Sound

Default: **vibrate-only**. No sound toggle for v1 — defer until there is a real user request. If audio is added later, a mute button directly on the notification is the preferred surface (avoids burying it in settings). System silent/vibrate mode is respected automatically.

---

## Permissions

`expo-notifications` requires the user to grant notification permission. Request it the first time the user starts a rest timer, with context explaining why ("so we can remind you when rest is over, even if you switch apps"). If denied, fall back to in-app haptic only and show a banner explaining that background alerts are unavailable.

---

## Wearables

Apple Watch and WearOS users get wrist haptic taps from the notification for free — no extra work needed.

---

## Out of scope (defer)

- Earphone auto-detection for conditional audio
- Customisable rest duration per exercise
- Escalating reminders (second buzz if user doesn't act)
- Wearable-specific actions (e.g. "Next set" from Watch)

---

## Open questions

1. What data does the notification need to log a "Next set" silently? At minimum: exercise ID, reps, weight, set type (working/warmup). The scheduled notification payload must carry this at timer-start time.
2. Should "Next set" also restart the rest timer immediately (for the following set), or leave that to the user once they're back in the app?

---

## Commit breakdown

| # | Commit message | Files |
|---|---|---|
| 1 | `feat(domain): add rest notification payload builder` | `src/domain/restNotification.ts`, `__tests__/restNotification.test.ts` |
| 2 | `feat(notifications): add notification service wrapper` | `src/notifications.ts`, `__tests__/notifications.test.ts` |
| 3 | `feat(haptics): haptic pulse when rest timer expires in foreground` | `app/log-session.tsx`, `__tests__/log-session.test.tsx` |
| 4 | `feat(notifications): schedule on rest start, cancel on skip` | `app/log-session.tsx`, `__tests__/log-session.test.tsx` |
| 5 | `feat(notifications): handle notification response (next set + deep-link)` | `src/notificationHandler.ts`, `__tests__/notificationHandler.test.ts`, `app/_layout.tsx` |

### Payload carried in each notification

`RestNotificationPayload` (stored in `notification.request.content.data`):

```
exerciseName: string   — display name for notification body
reps: number           — logged reps of the last set
weight: number         — logged weight (0 = bodyweight)
programName: string    — needed to key the session draft
dayIndex: number       — needed to key the session draft
exerciseIdx: number    — needed to call logSet on the right exercise
```

### Decision: "Next set" does NOT restart the rest timer

After a background "Next set" log the session draft is updated but the app stays backgrounded. The rest timer is an in-app UI element — it will re-initialise from the draft when the user next opens the app. Restarting the timer from a background handler would require significant complexity for little UX gain.
