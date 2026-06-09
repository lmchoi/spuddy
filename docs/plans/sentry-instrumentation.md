# Plan: Sentry instrumentation — navigation tracking + breadcrumbs

## Goal

Give crash reports enough context to understand what a user was doing before
an error. Right now Sentry only catches unhandled errors; there are no
breadcrumbs, no navigation history, and no indication of which features were
touched. Two additions fix this:

1. **Navigation tracking** — auto-capture every screen transition as a Sentry
   span/breadcrumb so crash reports always include a route history.
2. **Manual breadcrumbs** — record the 5 most important user actions so the
   event timeline shows what the user did, not just where they were.

## Out of scope

- Session replay (heavyweight, not worth it for a personal app)
- Custom performance spans (no perf problem to solve yet)
- Explicit user identity (`setUser`) — Sentry already generates a stable
  anonymous installation ID automatically
- Any changes to error sampling rates or alerting rules

## Design

### 1. Navigation tracking

Expo Router is built on React Navigation, so Sentry's
`reactNavigationIntegration()` works directly.

**`app/_layout.tsx` changes:**

```ts
// in Sentry.init options
integrations: [Sentry.reactNavigationIntegration()],
tracesSampleRate: 1.0,          // 100% during dev; can lower in prod
```

Wrap the `<Stack>` (or its parent) with `Sentry.NavigationContainer` —
a drop-in replacement for React Navigation's `NavigationContainer` that
handles registration automatically. Since Expo Router owns the container,
the right hook point is the `ref` forwarded to the root `<Stack>`.

Actually, the correct Expo Router approach: use the `reactNavigationIntegration`
and call `navigationIntegration.registerNavigationContainer(ref)` in the
root layout's `onLayout` / via a `ref` on the navigator, per Sentry docs for
Expo Router setups.

**What this captures automatically:**
- Every screen transition as a breadcrumb and span
- Time spent on each screen
- Navigation history visible in every crash report

### 2. Manual breadcrumbs

Call `Sentry.addBreadcrumb(...)` at the 5 key moments. These live in the
screen/hook that already owns the action — no new abstraction needed.

| Action | Location | category | message |
|---|---|---|---|
| Session logged (finish) | `log-session.tsx` `handleFinish` | `"session"` | `"Session logged"` |
| Notes imported | `notes-import-review.tsx` on confirm | `"import"` | `"Notes import confirmed"` |
| Strong CSV imported | `strong-import.tsx` on success | `"import"` | `"Strong import confirmed"` |
| Rest timer started | rest timer hook/screen | `"rest-timer"` | `"Rest timer started"` |
| Exercise added | add exercise screen on save | `"exercise"` | `"Exercise added"` |

Each breadcrumb gets `level: "info"` and a `data` object with 1-2 relevant
counts (e.g. `{ sets: 4 }`, `{ exercises: 12 }`) — enough to be useful
without logging anything personal.

## Commit breakdown

1. **`feat(sentry): add navigation tracking integration`**
   - Add `reactNavigationIntegration()` to `Sentry.init`
   - Wire up navigation container registration in `app/_layout.tsx`
   - Add `tracesSampleRate: 1.0`
   - Update `__tests__/root-layout.test.tsx` to assert the new init options

2. **`feat(sentry): add breadcrumbs for key user actions`**
   - Add `addBreadcrumb` calls at the 5 locations above
   - Tests: verify breadcrumb is called with correct shape for each action
     (mock `@sentry/react-native` and assert on `addBreadcrumb`)

## Testing strategy

- Unit: mock `@sentry/react-native` and assert `addBreadcrumb` shape for each
  action (category, message, level, data keys present)
- Manual: trigger each action in dev build, check Sentry dashboard breadcrumb
  trail on a test event

## Open questions

- **`tracesSampleRate` in prod** — 1.0 is fine for a personal app with low
  traffic; no need to lower it.
- **Expo Router navigation container ref** — need to confirm the exact API for
  registering the ref with Sentry when Expo Router owns the container (check
  Sentry docs for the Expo Router-specific snippet before implementing).
