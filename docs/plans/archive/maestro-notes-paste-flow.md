# Plan: Maestro notes-paste E2E flow

## Goal
A Maestro flow that exercises the primary happy path: navigate to Add, paste valid workout notes, save, and assert "Saved!" appears.

## Out of scope
- Error/duplicate state flows
- `testID` audit across other screens
- CI wiring

## Design
The Add screen TextInput has no accessibility identifier, so Maestro cannot target it reliably. A one-line `accessibilityLabel="Workout notes input"` addition to `app/(tabs)/add.tsx` (line ~345) fixes this without any structural change.

The flow uses a minimal valid notes string that parses to 1 exercise, so the save button renders the predictable text `"Save 1 exercise"`.

Flow steps:
1. `launchApp`
2. `tapOn: "Add"` (tab bar pill)
3. `tapOn: "Workout notes input"` (TextInput by accessibility label)
4. `inputText` with a valid single-exercise notes string
5. `tapOn: "Save 1 exercise"`
6. `assertVisible: "Saved!"`

Files affected:
- `app/(tabs)/add.tsx` — add `accessibilityLabel` to TextInput
- `e2e/notes-paste.yaml` — new flow

No new ADR required.

## Commits
1. **chore(add): add accessibilityLabel to workout notes TextInput** — add `accessibilityLabel="Workout notes input"` to the TextInput in `add.tsx`; test: `npm run check` passes (existing add-screen tests still green)
2. **test(e2e): add notes-paste flow** — scaffold `e2e/notes-paste.yaml` covering navigate → paste → save → "Saved!" assertion; test: `maestro test e2e/notes-paste.yaml` passes against a running dev build
