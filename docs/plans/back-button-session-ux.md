# Plan: Fix back-button / navigation reliability during a session

## Goal

Make back-button behaviour predictable across three scenarios that are currently broken or jarring:

1. **Notification tap while already on `/log-session`** — tapping the rest-timer notification
   pushes a duplicate screen instance, so pressing back lands on a stale copy.
2. **`log-session` unregistered in the root Stack** — the screen is missing a
   `<Stack.Screen>` entry in `_layout.tsx`, so `headerShown: false` is set
   dynamically inside the component rather than declaratively. Fragile and
   inconsistent with every other root-level screen.
3. **Back from progress detail after finishing** — `handleFinish` navigates with
   `router.replace('/progress/${today}')`, which replaces the log-session stack
   entry with the detail screen. Pressing back then surfaces the day-selector
   (`select-day`) rather than the progress list, which is jarring after finishing
   a workout.

Switching exercises during a session is **not a navigation issue** —
`jumpToExercise` is pure state; the user stays on `/log-session`.

## Out of scope

- Confirmation dialog before abandoning a session mid-workout (backlog item, needs
  separate UX design).
- Any changes to rest-timer scheduling or notification content.
- Changes to the progress detail screen layout or stats.

## Design

### Fix 1 — Register `log-session` in the root Stack (`app/_layout.tsx`)

Add a `Stack.Screen` entry alongside the other root screens:

```tsx
<Stack.Screen name="log-session" options={{ headerShown: false }} />
```

Remove the three inline `<Stack.Screen options={{ headerShown: false }} />` calls
inside `log-session.tsx` (loading state line 621, empty state line 630, main render
line 648) — they become redundant and their removal reduces noise.

### Fix 2 — Notification listener: `push` → `navigate` (`app/_layout.tsx:56`)

```ts
// before
setupNotificationResponseListener(() => router.push('/log-session'))

// after
setupNotificationResponseListener(() => router.navigate('/log-session'))
```

`router.navigate` in Expo Router is a no-op when the destination is already the
active route, so tapping the notification while on `/log-session` no longer stacks
a duplicate. If the user navigated away (e.g. to Settings), it pushes normally,
which is the correct behaviour — they deliberately tapped to return to their
workout.

### Fix 3 — Progress detail back button: guard with `canGoBack` (`app/(tabs)/progress/[date].tsx:192`)

When the user arrives via `router.replace` (post-finish) there is no meaningful
back entry — pressing back surfaces `select-day`, not the progress list.

```tsx
// before
<Pressable onPress={() => router.back()} …>

// after
<Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/progress')} …>
```

If back history exists (user tapped in from the progress list) the existing
behaviour is preserved. If there is no back history (post-finish replace),
they land on the progress list — the logical home after a workout.

## Commits

1. `fix: register log-session in root Stack with headerShown false` — add
   `Stack.Screen` entry in `_layout.tsx`; remove the three inline
   `Stack.Screen` calls in `log-session.tsx`. Verify: open app, start a
   session, confirm no native header appears.

2. `fix: use router.navigate for notification response to prevent duplicate stack entry` —
   change `push` → `navigate` in `_layout.tsx`. Verify: with a dev build, trigger
   a rest notification while on the session screen; tap it; confirm a second
   log-session instance is not pushed (back button goes to select-day, not a
   stale session).

3. `fix: progress detail back button falls back to progress list when no history` —
   update back handler in `progress/[date].tsx`. Verify: finish a workout,
   land on detail screen, press back — confirm it goes to the progress list,
   not select-day.
