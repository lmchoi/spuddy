# Await draft saves

## Problem

`saveDraft` was called fire-and-forget throughout `log-session.tsx`. If the OS killed the
app between the call and the AsyncStorage write completing, the draft could be one step
behind what the user saw.

## Solution

Await `saveDraft` before `setState` in handlers where losing the write would matter.

**Implemented:** `handleAddExercise` — awaited because it mutates the day shape (adds an
exercise). Losing this write means the added exercise disappears on resume, which is a
visible data loss bug. Shipped as part of the draft-includes-day feature.

**Intentionally left fire-and-forget:** `handleLogSet`, `handleSkipRest`, `handleJump`,
`handleNextExercise`, `handleAddSet` — these only mutate session state (set counts, rest
timer, position). The worst case is losing one step on an OS kill; drafts are a resilience
aid, not the primary save path, so this tradeoff is acceptable.

## Status

Done (scoped). The full-await-everything approach was considered and a branch was written
(`feat/await-draft-saves`), but the decision was made to await only where it had a visible
impact. The stale branch was removed.
