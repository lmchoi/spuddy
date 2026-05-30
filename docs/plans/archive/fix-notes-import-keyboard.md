# Plan: Fix keyboard hiding Import button on notes-import screen

## Goal
Keep the sticky "Import" button visible above the software keyboard when the user is typing.

## Out of scope
- Header / duplicate back button fix (separate plan: `fix-notes-import-header`)
- Any changes to button appearance or behaviour

## Design
The software keyboard on mobile slides up *over* app content by default — it doesn't push the layout up. The "Import" button lives in a `stickyBar` pinned below the `ScrollView`. When the keyboard appears it covers it entirely.

`KeyboardAvoidingView` is a built-in React Native component that listens for keyboard show/hide events and adjusts its own layout so content stays above the keyboard.

**File changed:** `app/notes-import.tsx`
- Add `KeyboardAvoidingView` and `Platform` to the react-native import
- Wrap the outermost `View` in a `KeyboardAvoidingView`:
  ```tsx
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <View style={[styles.container, { paddingTop: insets.top }]}>
      ...existing content...
    </View>
  </KeyboardAvoidingView>
  ```

**Why `padding` on iOS, `height` on Android?**
- iOS: adding bottom padding shifts the sticky bar up cleanly without reflowing content
- Android: Android handles keyboard differently at the OS level; `height` shrinks the available view area instead

**Hard-to-reverse?** No — wrapping/unwrapping a `KeyboardAvoidingView` is a safe structural change with no data or schema implications.

**Testability note:** This is a layout behaviour triggered by a hardware event (keyboard appearing). Unit tests cannot simulate it. Verified manually on device: paste text, confirm Import button is visible above keyboard.

## Commits
1. `fix: keep Import button visible above keyboard on notes-import screen` — manual verify: paste text on device, keyboard appears, Import button is still visible above it
