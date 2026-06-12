# Abandon session prompt

## Problem

When a user backs out of an in-progress session (via the back button in `log-session.tsx`), the draft is preserved in AsyncStorage. On next app launch, auto-resume will bring them straight back in — which is usually correct, but gives no way to deliberately discard the session.

## Solution

When the user taps the back button in `log-session`, show an alert or bottom sheet:
- **Keep** — navigates back (draft preserved, will auto-resume next launch)
- **Discard** — calls `clearDraft` then navigates back

## Dependencies

- Auto-resume feature must be shipped first (otherwise there's no reason to prompt)

## Open questions

- Should "Keep" be the default / prominent action?
- Same prompt if the user has logged zero sets (i.e. nothing meaningful to keep)?

## Out of scope

- Multi-draft support
