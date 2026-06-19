# Draft includes day snapshot

## Problem

When a user adds an exercise mid-session, the new exercise is appended to `state.day`
but the draft on disk only stored `SessionState` — no day shape. On resume, the freshly-
fetched `ProgramDay` from the database wouldn't include the added exercise, so it was
silently dropped.

A secondary problem (tracked separately): the five session-mutating handlers still call
`saveDraft` without `await`, so the draft can be one step behind on an unexpected app kill.

## Solution

Store `{ state: SessionState, day: ProgramDay }` in the draft instead of bare `SessionState`.
On resume, use `draft.day` as the working day so any mid-session additions are preserved.

Only `handleAddExercise` is awaited — because that handler changes the day shape, so the
new structure must be flushed to disk before the UI reflects it. The other five handlers
(logSet, skipRest, jump, nextExercise, addSet) remain fire-and-forget because the day shape
doesn't change there; see backlog for the full-await follow-up.

## Migration

Old-format drafts (bare `SessionState`, no `state`/`day` keys) are detected in `loadDraft`,
cleared from AsyncStorage, and `null` is returned. Users lose an in-progress draft on first
open after the update; acceptable given drafts are a resilience aid, not the primary save path.

## Out of scope

- Await `saveDraft` in all five session-mutating handlers — separate backlog item
- AppState background-flush — separate PR
- Draft corruption visibility — separate PR

## Commits

1. `feat(draft): save day snapshot alongside session state` — introduce `Draft = { state, day }`,
   update `saveDraft`/`loadDraft` signatures, add old-format migration guard, update resume path
   to use `draft.day` as `workingDay`, update all tests and call sites
2. `fix(draft): await saveDraft in handleAddExercise so day snapshot is guaranteed written` —
   make `handleAddExercise` async and await the draft write before `setState`
