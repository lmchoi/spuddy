# Plan: Maestro E2E flows — fix for current UI

## Goal
Keep the Maestro E2E flows passing against the pre-release APK build by updating them to match the current app UI.

## Background
Three flows broke due to accumulated UI changes:
1. The Add tab now redirects to `/select-day` instead of showing a notes input.
2. The `⚙ Fill sample` debug button is `__DEV__`-only and invisible in release APK builds.
3. The AddExercise sheet replaced a standalone "Add" header button with a searchable list and a `Create '...'` row.

## What was done

### notes-paste.yaml
Full rewrite. Original test navigated via the Add tab (now a redirect) and used a legacy text format (`2099-01-01\nexercises: {...}`) that the current parser doesn't understand. Also referenced non-existent UI labels ("Save 1 exercise", "Saved!").

New flow: Settings → Paste workout notes → setClipboard (block scalar for real newlines) + pasteText → Review 1 day → Import 1 program → assertVisible "Push".

`inputText` was tried first but triggers the Android emoji keyboard shortcut when text contains `-`. Replaced with `setClipboard` + `pasteText` which injects text programmatically, bypassing the keyboard entirely. Works in both dev and CI release builds.

### select-day.yaml
Removed the entire notes-import preamble. Flow now uses `launchApp: clearState: false` and relies on a seed database (see below) for the 3-day program. Rest of the flow unchanged.

### add-exercise-mid-session.yaml
Same setup change as select-day — seed database replaces UI preamble. Removed the "empty name — Add button should not submit" section (the Add button no longer exists; the guard is now in `onSubmitEditing` and `showCreate`). Changed `tapOn: text: "Add" below: "Add exercise"` to `tapOn: "Create 'Cable Fly'"`. Uses `setClipboard` + `pasteText` to enter the exercise name (same emoji keyboard reason as notes-paste).

### Seed database (e2e/seed.db, seed.sh, create-seed.sh)
Added a pre-built SQLite database containing 1 program with 3 days (Push/Pull/Legs) and real exercises. `seed.sh` pushes it to a connected device via `/data/local/tmp/` + `run-as cp`. `create-seed.sh` pulls and normalises the database from a device that already has the correct program loaded.

In CI: `bash e2e/seed.sh com.mchoi.spuddy.prerelease` runs after `adb install` and before `maestro test`.

### CI workflow (.github/workflows/android-debug.yml)
- Added `bash e2e/seed.sh` step between APK install and Maestro test run.
- Added `add-exercise-mid-session.yaml` to the explicit flow list.

### LogBox suppression (app/_layout.tsx)
A third-party library (`BridgelessReactContext`) emits a `CatalystInstance` warning on every dev build launch. This caused an "Open debugger to view warnings" bar to appear at the bottom of the screen, overlapping the tab bar and blocking Maestro taps in local dev testing. `LogBox.ignoreLogs` suppresses the on-device overlay; Metro terminal output is unaffected. No effect on release builds.

## Commits
1. **fix(e2e): update Maestro flows to match current app UI** ✓
2. **docs: update maestro-notes-paste-flow plan to reflect actual fixes** ✓
3. **ci: add add-exercise-mid-session to E2E flow list** ✓
4. **test(e2e): add seed database and scripts for E2E setup** ✓
5. **test(e2e): switch select-day and add-exercise flows to seed-based setup** ✓
6. **test(e2e): fix notes-paste flow to use setClipboard instead of inputText** ✓
7. **ci: seed database before E2E flows in Android Pre-release workflow** ✓
8. **fix(dev): suppress CatalystInstance LogBox warning in dev builds** ✓
