# Plan: Stepper direct input

## Goal
Users can tap the reps or weight number in the log-session stepper to type a value directly, in addition to using the +/− buttons.

## Out of scope
- Any visual change to the stepper (no underline, no highlight)
- Extracting `Stepper` into its own file

## Design
`Stepper` in `app/log-session.tsx` swaps its `Text` value display for a `TextInput` with `keyboardType="numeric"`. A local `draft` string state handles partial typing (e.g. `"1"` before `"10"`); the parent's numeric value is only updated on `onBlur`/`onSubmitEditing`. If the draft is empty or unparseable on blur, it resets to `format(value)`. A `useEffect` on `value` resets the draft whenever the prop changes from outside (e.g. exercise transition).

A new `onChangeValue` prop is added to `Stepper`, threaded through `BottomAction` props, and wired in the screen's `setState` calls alongside the existing `onIncReps` / `onDecReps` etc.

No schema changes, no new files, no ADR needed.

**Files affected:**
- `app/log-session.tsx`
- `styles/log-session.styles.ts` (verify `stepNum` style is compatible with `TextInput`)

## Commits
1. Add `onChangeValue` to `Stepper`, swap value `Text` → `TextInput` with local draft state — test: `changeText` on the reps stepper updates the displayed value and is used when logging the set
2. Wire `onChangeValue` for reps and weight through `BottomAction` and the screen — test: same integration test covers both fields end-to-end
