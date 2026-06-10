# Plan: Sentry instrumentation — crash context + notification debugging

## Goal

Two specific debugging scenarios drive this work:

1. **Crash reports lack context** — when an error is reported, there's no
   navigation history or record of what the user did beforehand. Navigation
   tracking and breadcrumbs on key actions fix this.
2. **"Notification didn't fire" reports** — users can't describe what happened
   technically. A `captureMessage` at scheduling time creates a passive audit
   trail in Sentry so you can look up what was scheduled without asking the user.

Usage analytics (which features are used, set values, defaults shown) is **not**
in scope here — that belongs in PostHog. See `docs/plans/posthog-analytics.md`.

## Out of scope

- Session replay
- Custom performance spans
- Explicit user identity (`setUser`) — Sentry auto-generates a stable anonymous
  installation ID
- Any changes to error sampling rates or alerting rules

## Design

### 1. Navigation tracking

Expo Router is built on React Navigation, so Sentry's
`reactNavigationIntegration()` works directly.

Add to `Sentry.init` in `app/_layout.tsx`:

```ts
integrations: [Sentry.reactNavigationIntegration()],
tracesSampleRate: 1.0,
```

Register the navigation container ref with the integration in `RootLayoutNav`.
Check Sentry docs for the exact Expo Router snippet before implementing —
the API differs slightly from bare React Navigation.

**What this captures automatically:**
- Every screen transition as a breadcrumb and span
- Navigation history visible in every crash report

App foreground/background transitions are already captured automatically by
the native SDK — no extra work needed.

### 2. Manual breadcrumbs on key actions

`Sentry.addBreadcrumb(...)` at 5 moments. Each gets `level: "info"` and a
`data` object with 1-2 relevant counts — useful context, nothing personal.

| Action | Location | category | message | data |
|---|---|---|---|---|
| Session logged | `log-session.tsx` `handleFinish` | `"session"` | `"Session logged"` | `{ exercises, sets }` |
| Notes imported | `notes-import-review.tsx` on confirm | `"import"` | `"Notes import confirmed"` | `{ sessions }` |
| Strong CSV imported | `strong-import.tsx` on success | `"import"` | `"Strong import confirmed"` | `{ sessions }` |
| Rest timer started | rest timer hook | `"rest-timer"` | `"Rest timer started"` | `{ duration_s }` |
| Exercise added | add exercise screen on save | `"exercise"` | `"Exercise added"` | — |

### 3. Notification scheduling audit trail

Call `Sentry.captureMessage` (not just a breadcrumb) when a notification is
scheduled. This lands in Sentry regardless of whether an error ever occurs,
giving you a passive log to look up when a user reports a missed notification.

```ts
Sentry.captureMessage('Rest timer notification scheduled', {
  level: 'info',
  extra: {
    scheduled_for: targetFireTime.toISOString(),
    duration_s: durationSeconds,
    permissions_granted: permissionsStatus,
  },
});
```

This means every scheduled notification creates a Sentry event. On a personal
app with low volume this is fine; revisit if volume grows.

## Commit breakdown

1. **`feat(sentry): add navigation tracking integration`**
   - Add `reactNavigationIntegration()` to `Sentry.init`
   - Wire up navigation container registration in `app/_layout.tsx`
   - Add `tracesSampleRate: 1.0`
   - Update `__tests__/root-layout.test.tsx` to assert the new init options

2. **`feat(sentry): add breadcrumbs for key user actions`**
   - Add `addBreadcrumb` calls at the 5 locations above
   - Tests: mock `@sentry/react-native` and assert breadcrumb shape for each

3. **`feat(sentry): capture notification scheduling as Sentry event`**
   - Add `captureMessage` call in the notification scheduling path
   - Tests: assert `captureMessage` is called with correct level and extra fields

## Testing strategy

- Unit: mock `@sentry/react-native`; assert `addBreadcrumb` / `captureMessage`
  shape (category, message, level, data keys) for each instrumented action
- Manual: trigger each action in dev build, verify events appear in Sentry
  dashboard with expected properties
