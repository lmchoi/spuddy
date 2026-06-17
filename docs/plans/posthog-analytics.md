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

Install `posthog-react-native` via `npx expo install posthog-react-native`.
`expo-application`, `expo-device`, and `expo-localization` are optional peer
deps that add device metadata to events — install if richer event context is
wanted later.

Token is passed via `app.config.js → extra → Constants.expoConfig.extra`,
consistent with the existing multi-variant build setup. This allows different
tokens per build variant (dev/preview/prod) if needed.

A singleton client lives in `src/config/posthog.ts`. It is disabled when no
token is configured so local dev is silent by default.

Wrap the app in `PostHogProvider` in `app/_layout.tsx`:

```tsx
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/src/config/posthog';

<PostHogProvider client={posthog} autocapture>
  ...
</PostHogProvider>
```

**Automatic (no extra code once provider is set up):**
- App lifecycle: `Application Installed`, `Application Updated`,
  `Application Opened`, `Application Backgrounded`
- Generic tap events on interactive elements

### Screen tracking (manual)

Expo Router uses React Navigation v7, which by design restricts navigation
hooks to inside Screen contexts. PostHog's automatic screen tracking does not
work with v7. Call `posthog.screen()` manually instead, co-located with the
Sentry navigation integration wiring in `app/_layout.tsx` or via a shared
navigation listener.

### Key events to capture manually

Named using `snake_case` consistently. PostHog supports both `snake_case` and
space-separated names — `snake_case` is safer for query autocomplete.

| Event | Where | Properties |
|---|---|---|
| `session_started` | `log-session.tsx` on mount | `{ exercise_count, source: 'program'|'import' }` |
| `session_completed` | `handleFinish` | `{ exercise_count, total_sets, duration_ms }` |
| `session_abandoned` | back-press / exit without finish | `{ exercise_count, sets_logged }` |
| `rest_timer_started` | rest timer hook | `{ duration_s }` |
| `set_completed` | set save handler | `{ exercise, set_index, default_reps, entered_reps, default_weight, entered_weight }` |
| `import_completed` | notes + strong import confirm | `{ source: 'notes'|'strong', session_count }` |
| `screen_viewed` | navigation listener | `{ screen_name }` |

The `set_completed` event is the most valuable for understanding defaults vs
actual values. Keep property names consistent — they become your query columns.

### User identity

PostHog generates its own stable anonymous `distinct_id` on first launch —
no action needed. Do not call `posthog.identify()` with any PII.

## Commit breakdown

1. **`feat(posthog): install posthog-react-native and add singleton config`** ✅
   - Install `posthog-react-native`
   - Add `src/config/posthog.ts` singleton
   - Add `extra` block to `app.config.js`

2. **`feat(posthog): wrap root layout in PostHogProvider`** ✅
   - Add `PostHogProvider` wrapper in `app/_layout.tsx`

3. **`feat(posthog): add manual screen tracking via navigation listener`**
   - Call `posthog.screen()` via navigation listener co-located with Sentry
   - Test: assert screen event fired on navigation

4. **`feat(posthog): capture session lifecycle events`**
   - `session_started` and `session_completed` / `session_abandoned`
   - Tests: mock `posthog-react-native` and assert event + property shape

5. **`feat(posthog): capture set_completed events`**
   - Add `posthog.capture('set_completed', {...})` in the set save handler
   - Include default and entered values for reps and weight
   - Tests: assert event fired with correct property keys

6. **`feat(posthog): capture rest_timer_started and import_completed events`**
   - `rest_timer_started` in rest timer hook
   - `import_completed` in notes and strong import confirm handlers
   - Tests: assert event + property shape for each

## Testing strategy

- Unit: mock `posthog-react-native`; assert `capture` called with correct event
  name and property keys for each instrumented action
- Manual: trigger actions in dev build, verify events appear in PostHog Live
  Events view with expected properties

## Open questions

- **`set_completed` volume** — a typical session is ~20 sets. At 3 sessions/week
  that's ~60 events/week per user. Well within PostHog's free tier (1M events/month).
