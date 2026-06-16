# Extract `useProgramDay` hook from `[dayIndex].tsx`

## Problem

`[dayIndex].tsx` contains an async DB load directly in the component body via `useFocusEffect` (lines 237–250). This couples async infrastructure to the screen, making it impossible to test data loading without fighting React's `act()` boundary. The current workaround in `program-day-detail.test.tsx` — a `require('react').useEffect` mock and `await act(async () => {})` flush calls — is non-idiomatic and fragile.

The right fix is to extract the load into a `useProgramDay` hook so:
- The hook owns the async complexity and is testable via `renderHook` in isolation
- Screen tests mock the hook, receive data synchronously, and need no `act()` hacks
- CLAUDE.md rule upheld: "custom hooks are wiring, not logic" — the hook wires DB → state, not domain logic

## What changes

### New file: `src/hooks/useProgramDay.ts`

Returns `{ day, setDay, libraryData, setLibraryData }`. Owns the `useFocusEffect` + `getDB` + `getProgramDay` + `getExercisesLibraryData` call. Falls back to `SAMPLE_DAY` until data loads (matching current behaviour).

### Updated: `app/(tabs)/settings/[programName]/[dayIndex].tsx`

Replace the `useFocusEffect` block and the two `useState` calls it populates with a single `useProgramDay(name, idx)` call. No logic changes — just wiring.

### Updated: `__tests__/program-day-detail.test.tsx`

- Remove the `useFocusEffect` mock and the `act` import
- Add a `jest.mock('@/src/hooks/useProgramDay', ...)` that returns data synchronously
- Tests that previously needed `await act(async () => {})` become plain synchronous `render()`
- Tests for real data loading (`real data loading` describe block) become: mock the hook to return specific data, render, assert — no async at all

### New file: `__tests__/useProgramDay.test.ts`

`renderHook`-based tests that own the async behaviour:
- returns `SAMPLE_DAY` before DB responds
- updates `day` and `libraryData` once DB resolves
- re-fetches when `name` or `idx` changes

## Commit breakdown

1. **test: add failing tests for useProgramDay hook** — `renderHook` tests covering initial state, DB load, and param changes. All red.
2. **refactor: extract useProgramDay hook** — create `src/hooks/useProgramDay.ts`, wire it into `[dayIndex].tsx`. Hook tests go green. Screen still passes (hook is real, not mocked yet).
3. **test: simplify program-day-detail tests to mock useProgramDay** — replace `useFocusEffect` mock + `act` hacks with a synchronous `useProgramDay` mock. All 26 screen tests still green, zero `act()` warnings.

Outside-in order: tests for the hook first (commit 1), then the hook itself (commit 2), then the updated screen tests (commit 3). Commits 1 and 2 ship together as a unit before the screen tests are touched.

## Cleanup

Close PR #97 (`fix/act-warnings`) — it's superseded by this plan. The hacky test changes it contains will be replaced in commit 3.

## Status: Completed

- [x] Extract `useProgramDay` hook
- [x] Add tests for `useProgramDay` hook
- [x] Refactor `[dayIndex].tsx` to use the hook
- [x] Simplify `program-day-detail.test.tsx` by mocking the hook
- [x] Verify all tests pass and linting is clean

