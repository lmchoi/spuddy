# Await session draft saves

## Problem

All five session-mutating handlers in `app/log-session.tsx` call `saveDraft()` without `await`. If the OS kills the app between the handler firing and the AsyncStorage write completing, the draft on disk is one step behind what the user saw — losing their last logged set.

## Solution

Make each handler `async` and `await saveDraft()` before calling `setState`. The write is guaranteed to land before the UI updates. AsyncStorage writes are <50ms so the button response is imperceptible to users.

## Affected handlers

- `handleLogSet` (line 507)
- `handleSkipRest` (line 519)
- `handleJump` (line 528)
- `handleNextExercise` (line 536)
- `handleAddSet` (line 544)

## Out of scope

- AppState background-flush (fix 2) — separate PR
- Draft corruption visibility (fix 3/4) — separate PR

## Commits

1. `test: saveDraft is awaited before setState in all session handlers` — update/add tests in `__tests__/log-session.test.tsx` that spy on `saveDraft` and assert it resolves before state changes are reflected
2. `fix: await saveDraft in all log-session mutation handlers` — make all five handlers async and await the draft save
