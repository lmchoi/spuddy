# Plan: Post-session program update

## Goal

When the user finishes a session, detect whether what they logged diverged from the program day. If so, prompt them to save a new program day with a custom name.

## Out of scope

- "Update this day" (rewrite existing day) — deferred, ship "save as new" first
- Exercises added mid-session that were not in the program (not currently possible in the UI)
- Warmup set detection
- Renaming or reordering program days after creation
- Any UI for managing the resulting days (settings screen work, tracked separately in `program-import-ux.md`)
- Android text-input name prompt (shipped a simpler `Alert.alert` Save/Skip fallback instead — a text-input modal is a future improvement)

## Design

**Detection rules** — a prompt is shown if any of the following are true:
- Any `state.loggedSets[i].length === 0` (exercise skipped entirely)
- Any `state.extraSetCounts[i] > 0` (extra sets added)

Partial completion (fewer sets, no extra), different reps, different weight — do not trigger.

**What "save as new day" produces:**
- Exercises included if ≥1 set logged **or** `extraSetCounts[i] > 0` (extra sets were added even if none were logged)
- Original program targets preserved (reps, weight)
- Set count increased if extra sets were added; never reduced for partial completion

**Files changing:**
- `src/domain/sessionLogger.ts` — `detectSessionChanges`, `buildNewDay`, `resolvePostSessionAction`
- `src/programStorage.ts` — `addProgramDay`
- `app/log-session.tsx` — wire alert into `handleFinish`

No schema changes. `addProgramDay` appends to the existing `days` array via the existing `savePrograms` path.

## Commits

1. `feat: add detectSessionChanges domain function` — test: skipped exercise → true, extra sets → true, partial completion / weight / rep diff → false ✓
2. `feat: add buildNewDay domain function` — test: only logged exercises included, set count increased for extra sets, reps/weight preserved from original targets ✓
3. `feat: add addProgramDay storage function` — test: new day appended to correct program's days array ✓
4. `feat: add resolvePostSessionAction domain function` — test: returns `'prompt'` when changes detected, `'navigate'` when not ✓
5. `feat: wire post-session prompt in log-session` — manual verify: alert appears on iOS when changes detected, name prompt saves new day, keep-as-is navigates normally ✓

## Notes

- A pre-existing failing test in `notes-import-review.test.tsx` blocked the pre-commit hook. It was a stale expectation from before `formatExerciseMeta` was wired in (commit 72c382b changed null-sets behaviour to show just the weight, not "1 set"). Fixed in `fix: update stale test for null-sets meta display` before the feature commits.
- `resolvedProgramName` was added to the `ready` ScreenState so `handleFinish` can pass it to `addProgramDay` without relying on the URL param (which may be undefined when the screen auto-resolves the first program).
- Commit 5 wires the prompt; a follow-up fix (6584e33) added an `Alert.alert` fallback for Android — iOS uses `Alert.prompt` with a pre-filled default name, Android uses a Save/Skip alert with the same default.
- Manual verify still required on Android device.
- Follow-up fix `fix: include exercises with extra sets added but 0 logged in buildNewDay` (96c4332) — widened `buildNewDay` exclusion guard from `loggedSets[i].length === 0` to `loggedSets[i].length === 0 && extraSetCounts[i] === 0`. Also resolved a pre-existing `@react-native-async-storage/async-storage` package missing from node_modules that was blocking the pre-commit hook. ✓
