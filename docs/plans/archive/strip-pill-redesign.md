# Plan: Exercise Strip Pill Redesign

**Status:** Done — `20d2551`  
**Created:** 2026-05-27

---

## Context

The exercise strip chips in the log-session screen look like status indicators, not navigation controls. They're square cards with a stacked name/dots layout, and done chips fade to `opacity: 0.45` which reads as disabled rather than completed. The dot system uses a single green colour with no distinction between hit and missed sets.

This plan redesigns the strip into pill-shaped chips with an inline name + dots layout and a richer dot colour language. It is a pure visual change — no domain logic changes.

---

## Scope

One atomic commit.

---

## Commit — `feat: strip pill chips with hit/miss dot colours`

**Files:** `app/log-session.tsx`, `__tests__/log-session.test.tsx` (extend existing)

### Chip layout — pill, name then dots inline

```
[ Bench Press  ●  ◎  ○ ]   ← active (green border + hitBg)
[ OHP          ○  ○  ○ ]   ← not started
[ Tricep Ext   ●  ●  ● ]   ← done (0.6 opacity)
```

Key style changes:

```ts
stripChip: {
  flexDirection: 'row',    // was column
  alignItems: 'center',
  gap: 7,
  borderRadius: 999,       // was 12 — full pill
  paddingHorizontal: 11,
  paddingVertical: 7,
  // remove minWidth
},
stripChipDone: { opacity: 0.6 },  // was 0.45
```

### Dot colour language

Each dot reflects its set's outcome:

| Dot state | Colour | Condition |
|---|---|---|
| Logged, hit target | `C.hit` (green) | `loggedSet.reps >= target.reps` |
| Logged, missed target | `C.below` (orange) | `loggedSet.reps < target.reps` |
| Currently active | transparent + dashed `C.hit` border | `si === loggedSets[i].length` and not done |
| Not yet reached | `C.border` (grey) | future sets |

New styles:
```ts
stripDotHit:    { backgroundColor: C.hit },
stripDotMiss:   { backgroundColor: C.below },
stripDotActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.hit },
// Note: borderStyle 'dashed' requires wrapping in an SVG or using a custom component
// on Android. Start with solid border; refine to dashed if feasible.
```

The `ExerciseStrip` component needs access to the program targets to compute hit/miss per dot — pass `day` as a prop (it already receives `sessionState` and `onSelect`).

### Active set dot in SetList

While here, update `setDotActive` in the set-list card to match the dashed-outline language:

```ts
setDotActive: {
  backgroundColor: 'transparent',
  borderWidth: 1.5,
  borderColor: C.hit,
  // dashed border: same caveat as above
},
```

### Integration tests (extend `__tests__/log-session.test.tsx`)

- Strip chip has pill border-radius (snapshot or style assertion)
- Done chip has reduced opacity
- Dot for a logged set that hit target renders with `C.hit` background
- Dot for a logged set that missed target renders with `C.below` background
- Active dot renders with transparent background + hit border colour

---

## Files touched

| File | Change |
|---|---|
| `app/log-session.tsx` | Chip layout, dot colour logic, `setDotActive` style |
| `__tests__/log-session.test.tsx` | Extend — strip dot colour assertions |

---

## Verification

1. `npm test` — all existing and new tests pass
2. `expo start` — strip shows pill chips; complete a set below target → dot turns orange; active set dot is outlined
3. Done exercises fade to 0.6 — still clearly tappable, colours readable
