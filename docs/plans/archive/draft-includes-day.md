# Plan: Draft includes day snapshot

## Goal

When a user adds an exercise mid-session and then backgrounds the app or presses back, the added exercise survives the resume. Currently the draft only saves `SessionState`; the `day` (which holds mid-session additions) is always re-fetched from program storage on resume, losing any in-flight additions.

## Approach

Widen the draft payload to `{ state: SessionState; day: ProgramDay }`. On resume, use `draft.day` instead of the freshly-fetched day. The session is already a snapshot (day is loaded once on mount and held in React state) — the draft just wasn't capturing that snapshot.

**Why not re-fetch?** Program editing doesn't exist yet. Even when it does, a session in flight should be treated as a locked copy of the day it started from — consistent with how `addExercise` already works (mutates the local `day` copy, not storage).

## Files affected

- `src/sessionDraft.ts` — widen save/load to `{ state: SessionState; day: ProgramDay }`
- `app/log-session.tsx` — pass `day` to `saveDraft`; use `draft.day` on resume instead of fetched day
- `__tests__/log-session.test.tsx` — new tests for resume with added exercise; update existing draft tests to pass day
- `src/types.ts` or `src/domain/sessionLogger.ts` — no change needed (ProgramDay already imported)

## Commits

1. `feat(draft): save day snapshot alongside session state`
   - Widen `saveDraft` / `loadDraft` signatures to `{ state: SessionState; day: ProgramDay }`
   - Update all `saveDraft` call sites in `log-session.tsx` to pass current `day`
   - On resume: use `draft.day` as the working day instead of the fetched day
   - Test: resume with a draft that includes an added exercise — strip shows the added exercise
   - Test: resume without a draft still uses freshly-fetched day (backwards compat)
   - Test: existing draft tests updated to supply day in mock
