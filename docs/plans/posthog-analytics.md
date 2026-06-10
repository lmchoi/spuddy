# Plan: PostHog — usage analytics

## Goal

Understand how the app is being used without relying on user reports:

- Which screens and features are actually used
- Whether users complete sessions or abandon them
- What set values and defaults users see and record
- App lifecycle (opened, backgrounded) as passive context

This is the analytics layer. Crash context and notification debugging live in
Sentry (`docs/plans/sentry-instrumentation.md`).

## Out of scope

- Feature flags and A/B testing
- Session replay (PostHog supports it but overkill for now)
- Any PII — no names, emails, or device identifiers beyond PostHog's own
  anonymous distinct ID

## Tool choice rationale

Sentry breadcrumbs are only visible when an error fires and aren't queryable
across sessions. PostHog events are queryable at any time, making it possible
to ask "how often do users complete a session?" or "what's the typical rest
timer duration?" without waiting for a crash.

## Design

### Setup

Install `posthog-react-native` (Expo-compatible, uses `expo-file-system`).

Wrap the app in `PostHogProvider` in `app/_layout.tsx`:

```tsx
import PostHog, { PostHogProvider } from 'posthog-react-native';

const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, {
  host: 'https://eu.i.posthog.com',   // or us.i.posthog.com depending on region
  autocapture: true,                  // tap events on PostHogProvider children
  captureScreens: false,              // disable — React Navigation v7 bug; done manually
  captureDeepLinks: false,
});
```

`PostHogProvider` must wrap the entire navigator so autocapture works.

**Automatic (no extra code once provider is set up):**
- App lifecycle: `Application Installed`, `Application Updated`,
  `Application Opened`, `Application Backgrounded`
- Generic tap events on interactive elements

### Screen tracking (manual)

React Navigation v7 / Expo Router has a known incompatibility with PostHog's
automatic screen tracking. Call `posthog.screen()` manually instead, co-located
with the Sentry navigation integration wiring in `app/_layout.tsx` or via a
shared navigation listener.

### Key events to capture manually

These are the events that answer the specific questions above. Named using
PostHog's recommended `"[object] [verb]"` convention.

| Event | Where | Properties |
|---|---|---|
| `session started` | `log-session.tsx` on mount | `{ exercise_count, source: 'program'|'import' }` |
| `session completed` | `handleFinish` | `{ exercise_count, total_sets, duration_ms }` |
| `session abandoned` | back-press / exit without finish | `{ exercise_count, sets_logged }` |
| `rest timer started` | rest timer hook | `{ duration_s }` |
| `set completed` | set save handler | `{ exercise, set_index, default_reps, entered_reps, default_weight, entered_weight }` |
| `import completed` | notes + strong import confirm | `{ source: 'notes'|'strong', session_count }` |
| `screen viewed` | navigation listener | `{ screen_name }` |

The `set completed` event is the most valuable for understanding defaults vs
actual values. Keep property names consistent — they become your query columns.

### User identity

PostHog generates its own stable anonymous `distinct_id` on first launch —
no action needed. Do not call `posthog.identify()` with any PII.

## Commit breakdown

1. **`feat(posthog): install and initialise PostHog provider`**
   - Install `posthog-react-native`
   - Add `PostHogProvider` wrapper in `app/_layout.tsx`
   - Add `EXPO_PUBLIC_POSTHOG_API_KEY` to env (`.env.example` + docs)
   - Add manual `posthog.screen()` calls via navigation listener
   - Test: assert provider is rendered in root layout test

2. **`feat(posthog): capture session lifecycle events`**
   - `session started` and `session completed` / `session abandoned`
   - Tests: mock `posthog-react-native` and assert event + property shape

3. **`feat(posthog): capture set completed events`**
   - Add `posthog.capture('set completed', {...})` in the set save handler
   - Include default and entered values for reps and weight
   - Tests: assert event fired with correct property keys

4. **`feat(posthog): capture rest timer and import events`**
   - `rest timer started` in rest timer hook
   - `import completed` in notes and strong import confirm handlers
   - Tests: assert event + property shape for each

## Testing strategy

- Unit: mock `posthog-react-native`; assert `capture` called with correct event
  name and property keys for each instrumented action
- Manual: trigger actions in dev build, verify events appear in PostHog Live
  Events view with expected properties

## Open questions

- **EU vs US hosting** — choose region before setup; can't migrate data after.
  EU (`eu.i.posthog.com`) is the safer default for GDPR if the app ever has
  non-US users.
- **`set completed` volume** — a typical session is ~20 sets. At 3 sessions/week
  that's ~60 events/week per user. Well within PostHog's free tier (1M events/month).
