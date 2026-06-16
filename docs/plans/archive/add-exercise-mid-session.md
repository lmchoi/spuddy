# Plan: Add exercise mid-session (PR 1 of 2)

## Goal

During an active log-session, the user can tap a dashed "+" pill below the exercise strip, name a new exercise, and immediately log sets for it alongside the planned exercises.

## Out of scope

- Draft persistence for added exercises (if the app is killed mid-session, added exercise sets are lost on resume; original exercises are unaffected) — deferred to PR 2 (`add-exercise-mid-session-draft.md`)
- Picking from the exercise library / fuzzy search
- Setting custom targets for the new exercise (always starts with 1 set: 10 reps, 0 kg)

## Design

### Domain

New function in `src/domain/sessionLogger.ts`:

```ts
addExercise(state: SessionState, day: ProgramDay, name: string): { session: SessionState; day: ProgramDay }
```

- Appends `{ name, targets: [{ reps: 10, weight: 0 }] }` to `day.exercises`
- Extends `loggedSets` with `[]`, `targetCounts` with `1`, `extraSetCounts` with `0`
- Returns the new session + day; does not mutate inputs

`buildNewDay` already skips exercises with 0 logged sets, so an added-but-unused exercise won't pollute the saved day. No changes needed there.

### UI

**Pill** — rendered below the `ExerciseStrip`, on its own row (`add-exercise-row` in styles). Dashed border (`#52402C`), transparent background, `+` icon + "Add exercise" label in muted colour (`C.muted`).

**Name sheet** — same bottom-sheet pattern as the existing note sheet (`noteSheetOpen`). Single `TextInput` for the exercise name + a confirm button. Empty name is ignored (button disabled). On confirm: call `addExercise`, update `ScreenState` (`day` + `session`), jump to new exercise via `jumpToExercise`, save draft.

### Files affected

- `src/domain/sessionLogger.ts` — add `addExercise`
- `__tests__/sessionLogger.test.ts` — tests for `addExercise`
- `app/log-session.tsx` — pill, name sheet, handler
- `styles/log-session.styles.ts` — pill row + sheet styles

No schema changes. No new ADR needed (no hard-to-reverse decisions in this PR).

## Commits

1. **`feat(domain): addExercise — append new exercise to session state and day`**
   Test: extending parallel arrays; `isExerciseDone` false for new exercise; `buildNewDay` includes it when ≥1 set logged, excludes it when 0 sets logged.

2. **`feat(ui): add exercise pill + name sheet in log-session`**
   Dashed pill below strip; name sheet on tap; on confirm updates state, jumps to new exercise, saves draft.
   Test: Maestro flow — tap pill → enter name → confirm → chip appears in strip → log a set.
