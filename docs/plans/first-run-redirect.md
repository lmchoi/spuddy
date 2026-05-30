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
