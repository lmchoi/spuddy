# First-run redirect

## Problem
Fresh app install shows "Oops!" 404 screen because there's no `app/index.tsx` to handle the root `/` route.

## Solution
Create `app/index.tsx` that:
1. Checks if user has any sessions (via `getDB()` + `getAllSessions()`)
2. Redirects to `/progress` if data exists
3. Redirects to `/settings` if fresh install (no data)
4. Falls back to `/settings` on DB error
5. Renders nothing while checking (fast redirect)

## Commits

### 1. Add first-run root redirect ✓
- Create `app/index.tsx`
- Create `__tests__/index.test.tsx` (pre-commit hook required tests; mocked `getDB`/`getAllSessions`/`router.replace`)

### 2. Replace getAllSessions with hasAnySessions ✓
- Add `hasAnySessions` to `src/storage.ts` — `SELECT 1 LIMIT 1`, no join, no deserialization
- Update `app/index.tsx` and `__tests__/index.test.tsx` to use it
- `getAllSessions` was wasteful: fetched and deserialized every row just to check `length > 0`

### 3. Fix initialRouteName so index screen is actually reached ✓
- `unstable_settings.initialRouteName` was `'(tabs)'`, causing Expo Router to skip `index.tsx` on native boot entirely
- Changed to `'index'`; added `Stack.Screen name="index" options={{ headerShown: false }}` to suppress native header
- Added regression test to `root-layout.test.tsx` asserting `initialRouteName === 'index'`

### 4. Remove dead type annotation from hasAnySessions ✓
- `<{ n: number }>` type param and `AS n` alias were unused — only `rows.length` is checked
- Simplified to `db.all(sql\`SELECT 1 FROM sessions LIMIT 1\`)`
