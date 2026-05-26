# Plan: Finish button always visible

## Goal

Add a "Finish" text button to the top-right of the log session header so users can end a session at any point, without having to complete the last set of the last exercise.

## Design

Muted text link (`C.sub` / `#666`) in the header's right slot. No background, no border. Calls the existing `handleFinish` handler.

```
← │  Push A          Finish
   │  4 of 15 sets
```

The existing bottom "Finish session" button (appears when session or exercise is done) is left unchanged — it serves as the primary CTA at natural stopping points.

## Slices

### 1. Failing test ✅
Added tests to `__tests__/log-session.test.tsx`: header finish button is visible mid-session, and tapping it calls `saveSession` and navigates.

### 2. Implementation ✅
- Added `Pressable` to the right of `headerMid` in the `LogSession` render, wired to `handleFinish`.
- Added `finishBtnText` style: `fontSize: 14`, `fontWeight: '600'`, `color: C.sub`, `hitSlop: 12`.

### 3. Commit ✅
`4e84dbc` — tests + implementation in one commit.

## Out of scope
- Confirmation dialog before finishing early (can revisit if users complain).
- Any change to the bottom `BottomAction` component.
