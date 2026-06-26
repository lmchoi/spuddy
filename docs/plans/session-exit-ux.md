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
3. Show `Alert.alert` with two buttons:
   - **Keep** — does nothing; user stays in session; fires `session_exit_keep`
   - **Discard** — calls `clearDraft(key)` then `navigation.dispatch(e.data.action)` to complete the blocked navigation; fires `session_exit_discard`

**Files changing:**
- `src/domain/sessionLogger.ts` — add `shouldPromptOnExit()`
- `app/log-session.tsx` — add `useNavigation` + `beforeRemove` listener

No schema changes, no new storage keys, no new routes.

**PostHog events:** `session_exit_keep`, `session_exit_discard` — no properties in this PR (deferred).

## Commits

1. `feat: add shouldPromptOnExit domain function` — test: returns `true`; exists as hook for future set-count guard
2. `feat: wire session exit prompt via beforeRemove` — manual verify: prompt appears on back tap, Discard clears draft and navigates, Keep stays in session; `session_exit_keep` / `session_exit_discard` fired
