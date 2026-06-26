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
| `session_abandoned` | abandon-session-prompt confirm | `{ exercise_count, sets_logged }` — **depends on `abandon-session-prompt` feature** |
| `rest_timer_started` | rest timer hook | `{ duration_s }` |
| `set_completed` | set save handler | `{ exercise, set_index, default_reps, entered_reps, default_weight, entered_weight }` |
| `import_completed` | notes + strong import confirm | `{ source: 'notes'|'strong', session_count }` |
| `exercise_added` | `AddExerciseSheet` in `log-session.tsx` | `{ source: 'history'|'custom' }` — `'library'` added when Stage 3 ships |
| `screen_viewed` | navigation listener | `{ screen_name }` |

The `set_completed` event is the most valuable for understanding defaults vs
actual values. `exercise_added` with `source` answers whether the exercise
picker is being used or users still type everything. Keep property names
consistent — they become your query columns.

### User identity

PostHog generates its own stable anonymous `distinct_id` on first launch —
no action needed. Do not call `posthog.identify()` with any PII.

## Commit breakdown

All remaining commits ship in one PR.

1. **`feat(posthog): install posthog-react-native and add singleton config`** ✅
2. **`feat(posthog): wrap root layout in PostHogProvider`** ✅
3. **`feat(posthog): add manual screen tracking via navigation listener`** ✅
   - Extracted `trackScreen(routeName)` to `src/analytics/screenTracking.ts` (testable pure fn)
   - Added `ref.addListener('state', ...)` in `RootLayoutNav` alongside Sentry wiring
   - Screen tracking unit tests removed in review — function is a 3-line guard with no testable logic

4. **`feat(posthog): capture session lifecycle events`** ✅
   - `session_started` and `session_completed` only
   - `session_abandoned` deferred — requires `abandon-session-prompt` feature first
   - Tests: render LogSession, assert event + property shape

5. **`feat(posthog): capture set_completed events`** ✅
   - Added `posthog.capture('set_completed', {...})` in `handleLogSet`
   - Includes default and entered values for reps and weight
   - Tests: assert event fired with correct property keys

6. **`feat(posthog): capture rest_timer_started and import_completed events`** ✅
   - `rest_timer_started` in `RestTimer` component's mount effect
   - `import_completed` in notes-import-review and strong-import confirm handlers
   - Tests: assert event + property shape for each

7. **`feat(posthog): capture exercise_added event`** ✅
   - Passed `source: 'history'|'custom'` through `AddExerciseSheet.onAdd` callback
   - Fire `exercise_added` in `handleAddExercise`
   - `source: 'library'` added when exercise picker Stage 3 ships
   - Tests: assert event fired with correct source for each path

### Review fixes (pre-merge)

- **`exercise_added`**: added `exercise: name` property — missing it would leave a permanent gap since event data can't be backfilled
- **`import_completed`**: renamed `session_count` → `imported_count` — `session_count` was semantically wrong for the notes path (counts program days, not sessions)
- **`rest_timer_started`**: changed `duration_s` → `duration_ms` to match `session_completed`; mixed units would require silent conversion in PostHog queries
- **Screen tracking test**: deleted — tested a 3-line `if`-statement with no real logic

## Testing strategy

- Unit: mock `posthog-react-native`; assert `capture` called with correct event
  name and property keys for each instrumented action
- Manual: trigger actions in dev build, verify events appear in PostHog Live
  Events view with expected properties
