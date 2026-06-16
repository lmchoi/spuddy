# Plan: Sentry instrumentation — crash context + notification debugging

## Goal

Add navigation tracking, action breadcrumbs, and a notification scheduling audit trail to the existing Sentry setup so crash reports have context and "notification didn't fire" reports are debuggable without asking the user.

## Out of scope

- Session replay
- Custom performance spans
- Explicit user identity (`setUser`) — Sentry auto-generates a stable anonymous installation ID
- Any changes to error sampling rates or alerting rules
- Rest timer breadcrumb — `captureMessage` covers the notification audit trail; add breadcrumb later if crash context during rest timer becomes a real gap

## Design

### 1. Navigation tracking

Expo Router is built on React Navigation, so Sentry's `reactNavigationIntegration()` works directly.

`navigationIntegration` is created at module level (outside the component) so it can be registered in a `useEffect`. `useNavigationContainerRef()` from `expo-router` provides the ref. `isRunningInExpoGo()` guards `enableTimeToInitialDisplay` and `enableNativeFramesTracking`.

```ts
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  integrations: [navigationIntegration],
  tracesSampleRate: 1.0,
  enableNativeFramesTracking: !isRunningInExpoGo(),
});
```

**What this captures automatically:**
- Every screen transition as a breadcrumb and span
- Navigation history visible in every crash report

App foreground/background transitions are already captured automatically by the native SDK.

### 2. Manual breadcrumbs on key actions

`Sentry.addBreadcrumb(...)` at 4 sites. Each gets `level: "info"`. Breadcrumbs are held in memory and attached to the next crash report — they are not standalone Sentry events.

| Action | File | category | message | data |
|---|---|---|---|---|
| Session logged | `app/log-session.tsx` `handleFinish` | `"session"` | `"Session logged"` | `{ exercises, sets }` |
| Notes imported | `app/notes-import-review.tsx` `handleImport` | `"import"` | `"Notes import confirmed"` | `{ programs }` (note: `importFromNotes` returns `programsCreated`, not sessions) |
| Strong CSV imported | `app/strong-import.tsx` after `result.success` | `"import"` | `"Strong import confirmed"` | `{ sessions }` |
| Exercise added | `app/(tabs)/settings/[programId]/[dayIndex].tsx` `addExercise` | `"exercise"` | `"Exercise added"` | — |

### 3. Notification scheduling audit trail

`captureMessage` in `scheduleRestExpiredNotification` in `src/notifications.ts`. Creates a standalone Sentry event every time a notification is scheduled — searchable any time, not just on crash.

`permissions_granted` was dropped from `extra` — not accessible at the call site.

```ts
Sentry.captureMessage('Rest timer notification scheduled', {
  level: 'info',
  extra: {
    duration_s: seconds,
    scheduled_for: new Date(Date.now() + seconds * 1000).toISOString(),
  },
});
```

Low volume on a personal app — revisit if event count becomes noise.

### Testing approach

Unit tests are not written for `addBreadcrumb` or `captureMessage` calls — asserting third-party call shape has low regression value. The `Sentry.init` tests in `root-layout.test.tsx` are extended to cover the `integrations` and `tracesSampleRate` options.

Manual verification checklist (dev build):
- [ ] Navigate between screens — confirm breadcrumbs appear in Sentry
- [ ] Log a session — confirm `session` breadcrumb on next Sentry event
- [ ] Confirm a notes import — confirm `import` breadcrumb
- [ ] Confirm a Strong import — confirm `import` breadcrumb
- [ ] Add an exercise — confirm `exercise` breadcrumb
- [ ] Start a rest timer — confirm `captureMessage` event appears in Sentry with `duration_s` and `scheduled_for`

## Commits

1. ✅ `feat(sentry): add navigation tracking integration` — `app/_layout.tsx`, `__tests__/root-layout.test.tsx`
2. ✅ `feat(sentry): add breadcrumbs for key user actions` — 4 sites; no unit tests (deliberate, see testing approach above)
3. ✅ `feat(sentry): capture notification scheduling as Sentry event` — `src/notifications.ts`; no unit tests (deliberate)
