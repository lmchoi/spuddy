# Android AVD Verifier

How to visually verify UI changes against the running Android emulator.

## Check emulator is running

```bash
~/Library/Android/sdk/platform-tools/adb devices
```

If no device is listed, the emulator is not running — tell the user to start it before verification can proceed.

## Take a screenshot

```bash
~/Library/Android/sdk/platform-tools/adb exec-out screencap -p > /tmp/spuddy-verify.png
```

Then read `/tmp/spuddy-verify.png` to inspect the screen visually.

## Check for console errors

```bash
~/Library/Android/sdk/platform-tools/adb logcat -d -s ReactNativeJS:E | tail -20
```

Flag any errors or red-screen output.

## What to verify

When called as part of `/sp:implement` or `/sp:push`:

1. The changed screen renders — no blank or crash screen
2. No console errors in logcat
3. The visible UI matches what was intended by the plan

Report pass/fail with the screenshot and any logcat errors found.
