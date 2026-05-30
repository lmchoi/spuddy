# Plan: Fix duplicate header on notes-import screen

## Goal
Remove the auto-generated Stack header so only the screen's own custom header is visible.

## Out of scope
- Keyboard / sticky button fix (separate plan: `fix-notes-import-keyboard`)
- Any changes to the custom header content or style

## Design
Expo Router renders a default header for every `Stack.Screen` unless told not to. Because `notes-import` isn't registered in `_layout.tsx`, it gets a default header ("notes-import" title + back arrow) stacked above the screen's own custom header ("Paste workout notes" + back arrow).

**File changed:** `app/_layout.tsx` — add one `Stack.Screen` entry inside `RootLayoutNav`:
```tsx
<Stack.Screen name="notes-import" options={{ headerShown: false }} />
```

No logic changes. No new components. The screen's existing custom header and back button handle navigation unchanged.

**Hard-to-reverse?** No — this is easily toggled. If we ever want the system header we just remove `headerShown: false`.

## Commits
1. `fix: suppress auto Stack header on notes-import screen` — manual verify: open the screen, confirm only one back button and "Paste workout notes" title visible
