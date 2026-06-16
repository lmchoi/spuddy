# Plan: SetEntry grouping

## Goal
Group reps stepper, weight stepper, and Done button into a single `SetEntry` component with local state, replacing the 7-callback pattern and eliminating the stale-closure problem at the design level.

## Out of scope
- Any visual change to the log-session UI
- Extracting `Stepper` or `SetEntry` into separate files

## Design
`SetEntry` owns local `reps` and `weight` state seeded from `initialReps`/`initialWeight`. It renders both `Stepper`s and the Done button, calling `onLog(reps, weight)` once on press. `Stepper`'s `onChangeValue` becomes a purely internal prop used to sync +/− presses into `SetEntry`'s local state.

`BottomAction` drops `onIncReps`, `onDecReps`, `onChangeReps`, `onIncWeight`, `onDecWeight`, `onChangeWeight`, `onLogSet` — replaced by `initialReps`, `initialWeight`, and `onLog(reps, weight)`.

The screen's `handleLogSet` changes signature to `(reps: number, weight: number) => void`. `input` state stays for carry-forward — it seeds `SetEntry` via `initialReps`/`initialWeight`. A `key` prop on `SetEntry` (encoding exercise index + logged set count) forces remount on each new set so local state resets to the carried-forward values.

No schema changes, no new files, no ADR needed.

**Files affected:**
- `app/log-session.tsx`

## Commits
1. ✅ Add `SetEntry` component (local reps/weight state, wraps both Steppers + Done button) alongside existing code — test: type reps and press Done without blur → logged payload uses typed value (the stale-closure bug case, now correct by design)
   - Deviation: `Stepper.handleChangeText` also calls `onChangeValue` immediately on keystroke (not just on blur) — this is what keeps `SetEntry`'s state current without requiring a blur before Done.
2. ✅ Wire `SetEntry` into `BottomAction`; remove the 7 individual callbacks from `BottomAction` and the screen — test: all existing stepper carry-forward and logging tests still pass
