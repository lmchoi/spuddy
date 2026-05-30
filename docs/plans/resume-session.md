# Plan: Resume In-Progress Session

## Goal

If the user navigates away from `log-session` before finishing, their progress is preserved. When they return to the same session, they resume exactly where they left off.

## Decisions

- **Storage:** `AsyncStorage` — lightweight, survives app kills, no migration needed. Appropriate for ephemeral UI draft state.
- **Resume behaviour (MVP):** always resume silently. No prompt.
- **Stale drafts:** no expiry for now — always resume regardless of when they left. Cross-day expiry and the "resume vs. start fresh" prompt are tracked in `docs/backlog.md`.
- **`isResting` on restore:** force `false` — resuming into a live countdown is disorienting.
- **Discard path:** not in scope. Tracked in backlog alongside the resume prompt.

## Draft key

```
draft_session__{programName}__{dayIndex}
```

Uses the *resolved* program name and day index (i.e. after the default-program fallback in `load()`), so the key is stable regardless of how the screen was navigated to.

## What gets persisted

The full `SessionState` object (already serialisable — no functions, no non-primitive values). `InputState` (reps/weight steppers) is *not* persisted — it is recalculated from the active target on restore, same as on fresh load.

## Lifecycle

| Event | Action |
|---|---|
| Any `SessionState` change | Write draft to AsyncStorage |
| Screen mounts, draft exists | Restore draft (with `isResting: false`) |
| Screen mounts, no draft | `initSession(day)` as today |
| `handleFinish` succeeds | Clear draft |
| `handleFinish` fails (save error) | Leave draft intact |

## Implementation steps

1. ✅ **`src/sessionDraft.ts`** — three thin helpers:
   - `draftKey(programName, dayIndex): string`
   - `saveDraft(key, state: SessionState): Promise<void>`
   - `loadDraft(key): Promise<SessionState | null>`
   - `clearDraft(key): Promise<void>`

2. ✅ **`log-session.tsx` — load path:** after resolving program name and day index, call `loadDraft(key)`. If a draft is returned, use it (with `isResting: false`) instead of `initSession(day)`.

3. ✅ **`log-session.tsx` — state change path:** after every `setState` call that updates `session`, call `saveDraft(key, nextSession)`. The key must be available in screen scope (store alongside `resolvedProgramName` in the `ready` state).

4. ✅ **`log-session.tsx` — finish path:** call `clearDraft(key)` before navigating away in `handleFinish`. Clear even if the post-session prompt is shown, since the session has been saved.

## Tests

- `saveDraft` / `loadDraft` / `clearDraft` round-trip (mock AsyncStorage)
- `loadDraft` returns `null` when no key exists
- Restored state has `isResting: false` regardless of what was saved
- Draft key is stable: same resolved name + index always produces same key

## Out of scope

- "Resume or start fresh?" prompt → backlog
- Stale/cross-day draft expiry → backlog
- Discard session UI → backlog (same item as prompt)
