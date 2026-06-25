# Android AVD Verifier

How to visually verify UI changes against the running Android emulator.

## Check emulator is running

```bash
~/Library/Android/sdk/platform-tools/adb devices
```

If no device is listed, the emulator is not running — tell the user to start it before verification can proceed.

## Launch the app

The app runs as the compiled dev build (`com.mchoi.spuddy`), **not** Expo Go. Always launch it directly:

```bash
~/Library/Android/sdk/platform-tools/adb shell am start -n com.mchoi.spuddy/.MainActivity
sleep 10
```

**Do not use `host.exp.exponent` (Expo Go).** Expo Go will show a `ReferenceError: Property 'FormData' doesn't exist` red screen when Metro is served from a worktree — this is a false alarm, not a regression.

The Maestro flow `select-day-flow.yaml` also targets Expo Go and will fail from a worktree for the same reason. Run Maestro flows only when Metro is started from the main workspace.

## Take a screenshot

```bash
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > /tmp/spuddy-verify.png
```

Then read `/tmp/spuddy-verify.png` to inspect the screen visually.

## Check for console errors

```bash
~/Library/Android/sdk/platform-tools/adb logcat -d -s ReactNativeJS:E | tail -20
```

Errors at `09:XX` or earlier timestamps are pre-existing — only flag errors whose timestamp matches your current verification session.

## What to verify

When called as part of `/sp:implement` or `/sp:push`:

1. The changed screen renders — no blank or crash screen
2. No console errors in logcat (from this session)
3. The visible UI matches what was intended by the plan

Report pass/fail with the screenshot and any logcat errors found.
