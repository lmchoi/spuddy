# Plan: Fix orphaned x in exercise name from trailing set markers

**Status:** Complete

## Problem

`TOKEN_RE` only captures a **leading** `x` before a number (`x80`). When the user writes
a trailing `x` after a number (`3x`), the digit is matched as a bare token but the `x`
is left behind in the name:

- `"3x bench - 10 x 80"` → name `"x bench"` (leading orphan)
- `"Squat 3x - 10x80"` → name `"Squat x"` (trailing orphan)

## Fix

Extend `TOKEN_RE` (defined locally inside `parseBulletLine`) to also consume an optional
trailing `x` after the number. One character group added — no logic changes:

```
Before: /([xX])?\s*(\d+\.?\d*)\s*(kg|lbs)?/gi
After:  /([xX])?\s*(\d+\.?\d*)\s*[xX]?\s*(kg|lbs)?/gi
```

The trailing `[xX]?` silently swallows the marker so it never ends up in the name.

## Commits

1. `fix: consume trailing x in TOKEN_RE so set markers don't leak into exercise name` ✅
   - Add `[xX]?` to `TOKEN_RE` in `parseBulletLine`
   - Add failing tests first, then the fix
