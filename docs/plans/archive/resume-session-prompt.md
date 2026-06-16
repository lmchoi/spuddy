# Plan: Auto-resume in-progress session

## Goal

When the app is opened with an active draft in AsyncStorage, route directly to `log-session` instead of the normal progress/settings destination.

## Out of scope

- Abandon / discard prompt when backing out of a session (see `abandon-session-prompt.md`)
- AppState background-flush
- Multiple simultaneous drafts (silent fallthrough to normal routing if >1 draft found)

## Design

Two files change:

- **`src/sessionDraft.ts`** — add `parseDraftKey(key: string)` (pure function) and `findActiveDraft()` (AsyncStorage scan). Returns `{ programId, dayIndex }` for a single match, `null` for zero or multiple.
- **`app/index.tsx`** — call `findActiveDraft()` alongside the existing `hasAnySessions` check; if a draft is found, `router.replace('/log-session?programId=X&dayIndex=Y')`.

Draft keys follow the existing format `draft_session__${programId}__${dayIndex}` defined in `draftKey()`.

`__tests__/index.test.tsx` and `__tests__/sessionDraft.test.ts` were also updated.

No schema changes. No hard-to-reverse decisions.

## Commits

1. ✅ `feat: wire index.tsx to resume draft session when found` — call `findActiveDraft` (stubbed to return `null`); app behaviour unchanged
2. ✅ `feat: add parseDraftKey to sessionDraft` — pure function parsing `draft_session__X__Y` → `{ programId, dayIndex }` or `null`; test: valid key, malformed key, unrelated key
3. ✅ `feat: implement findActiveDraft with AsyncStorage scan` — scans `getAllKeys`, filters draft keys, uses `parseDraftKey`; returns single match or `null`; test: zero keys, one key, multiple keys
4. ✅ `fix: handle missing back stack in log-session` — `router.back()` crashes when log-session is the first screen (auto-resume lands here with no history); fall back to `router.replace(HOME_ROUTE)` when `canGoBack()` is false
5. ✅ `fix: handle findActiveDraft rejection in index.tsx` — unhandled rejection left app on a blank screen if AsyncStorage was unavailable; unified catch covers both `findActiveDraft` and `getDB` errors
