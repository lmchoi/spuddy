# Plan: Session exit UX

## Goal

When the user navigates away from an active session, show a Keep / Discard prompt so they can deliberately abandon the draft rather than silently leaving it for auto-resume.

## Out of scope

- Skipping the prompt when zero sets have been logged (deferred — see backlog)
- Session state properties on PostHog events (deferred — see backlog)
- Multi-draft support

## Design

**Single `beforeRemove` listener** covers all exit paths — the `←` Pressable (already calls `router.back()`), iOS swipe-to-go-back gesture, and Android hardware back button. No separate `BackHandler` needed.

On `beforeRemove`:
1. Call `shouldPromptOnExit()` — currently a stub returning `true`; the hook for future set-count logic
2. Call `e.preventDefault()` to block navigation
3. Show `Alert.alert` with three buttons:
   - **Cancel** — does nothing; user stays in session; fires `session_exit_cancel`
   - **Resume later** — navigates back *and* keeps the draft (auto-resume on next open); fires `session_exit_resume_later`
   - **Discard** — calls `clearDraft(key)` then `navigation.dispatch(e.data.action)`; fires `session_exit_discard`

**Files changing:**
- `src/domain/sessionLogger.ts` — add `shouldPromptOnExit()`
- `app/log-session.tsx` — add `useNavigation` + `beforeRemove` listener

No schema changes, no new storage keys, no new routes.

**PostHog events:** `session_exit_cancel`, `session_exit_resume_later`, `session_exit_discard` — no properties in this PR (deferred).

## Commits

1. `feat: add shouldPromptOnExit domain function` — test: returns `true`; exists as hook for future set-count guard ✓
2. `feat: wire session exit prompt via beforeRemove` — initial 2-button Keep/Discard wiring ✓
3. `fix: session exit prompt — 3-button UX (Dismiss / Keep / Discard)` — Dismiss stays in session, Keep goes back keeping draft, Discard clears draft then goes back
