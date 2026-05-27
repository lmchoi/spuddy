# Plan: Add Extra Set During Workout

**Status:** Complete (PR open, pending merge)
**Created:** 2026-05-27  
**Depends on:** `strip-pill-redesign` (dot colour system must land first)

## Deviations from plan

- **`+ Add set` always visible** — plan gated visibility on `isExerciseDone`; changed to always show for the current exercise so the affordance is more discoverable.
- **Extra-set target uses last planned target** — plan pre-filled from last logged set's values. Discussed two scenarios (exceeded / fell short) and settled on `ex.targets[last]` as the stable comparison point for hit/miss colour.
- **Option C layout** — plan described an inset dashed pill inside the card. Iterated through four mockup options (`docs/mockups/add-set-button.html`); chose C: card rows in an `overflow:hidden` inner view, dashed add-set footer attached below with transparent background (page bg shows through, same treatment as completed exercise pills). Follow-up fix restructured to the proper nested `setCard` wrapper (outer solid border + `overflow:hidden`) so the dashed button's full four-sided border is clipped to the card's rounded corners, matching the `card-c` / `card-c-inner` HTML structure exactly.
- **Three refine commits** added beyond the two planned commits, covering UX iteration on always-visible, target logic, and layout.

---

## Context

The program prescribes a fixed number of sets per exercise (e.g. 3×10). Once all planned sets are logged the exercise is "done" and there is no way to log a fourth set — the UI immediately advances to "Next exercise". Users who feel good and want an extra set are blocked. This feature adds a minimal "+ Add set" affordance that extends the live session without restructuring the saved data model.

---

## Scope

Two atomic commits, each shipping tests and implementation together.

---

## Commit 1 — `feat: domain addExtraSet and updated isExerciseDone`

**Files:** `src/domain/sessionLogger.ts`, `__tests__/sessionLogger.test.ts` (new)

### `SessionState` gains `extraSetCounts: number[]`

```ts
export type SessionState = {
  loggedSets:         LoggedSet[][];
  targetCounts:       number[];
  extraSetCounts:     number[];   // sets added beyond program targets, per exercise
  currentExerciseIdx: number;
  isResting:          boolean;
  startedAt:          number;
};
```

### `initSession` — initialise `extraSetCounts: day.exercises.map(() => 0)`

### New function `addExtraSet(state, exIdx): SessionState`

```ts
export function addExtraSet(state: SessionState, exIdx: number): SessionState {
  const extraSetCounts = state.extraSetCounts.map((c, i) => i === exIdx ? c + 1 : c);
  return { ...state, extraSetCounts, isResting: false };
}
```

After this call `isExerciseDone` returns false, so `BottomAction` reverts to steppers + Done button automatically.

### Update `isExerciseDone`

```ts
export function isExerciseDone(state, day, exIdx): boolean {
  const total = day.exercises[exIdx].targets.length + state.extraSetCounts[exIdx];
  return state.loggedSets[exIdx].length >= total;
}
```

### Update `getActiveTarget`

When `logged >= targets.length` (extra set territory), pre-fill from the **last logged set's actual values**, not the last planned target. If the user hit 7 reps instead of 8, the extra set defaults to 7.

```ts
export function getActiveTarget(state, day, exIdx): Target {
  const logged = state.loggedSets[exIdx].length;
  const targets = day.exercises[exIdx].targets;
  if (logged >= targets.length && logged > 0) {
    const last = state.loggedSets[exIdx][logged - 1];
    return { reps: last.reps, weight: last.weight };
  }
  const raw = targets[Math.min(logged, targets.length - 1)];
  return raw.reps ? raw : { ...raw, reps: 10 };
}
```

### Update `logSet`

`isResting` uses `targetCounts[exIdx]` as `required` — update to include extra sets:

```ts
const required = state.targetCounts[exIdx] + state.extraSetCounts[exIdx];
const isResting = logged < required;
```

### Unit tests

- `initSession` → `extraSetCounts` all zero
- `addExtraSet` → increments count for target exercise only, clears `isResting`
- `isExerciseDone` → false after `addExtraSet`, true again after logging the extra set
- `getActiveTarget` → returns last logged values when in extra-set territory
- `buildSavePayload` → extra logged sets appear in output unchanged

---

## Commit 2 — `feat: ui add-set row and handleAddSet`

**Files:** `app/log-session.tsx`, `__tests__/log-session.test.tsx` (extend existing)

### `SetList` — "+ Add set" row

After all set rows, render a centred "+ Add set" row **only when**:
- `exIdx === session.currentExerciseIdx`
- `isExerciseDone(session, day, exIdx)`

```tsx
<Pressable onPress={onAddSet} style={s.addSetRow}>
  <Text style={s.addSetText}>＋  Add set</Text>
</Pressable>
```

```ts
addSetRow: {
  alignItems: 'center', justifyContent: 'center',
  paddingVertical: 12,
  backgroundColor: C.cardSoft,
  borderTopWidth: 1, borderTopColor: C.muted,
  // Note: borderStyle 'dashed' not supported on Android Views —
  // use a dashed SVG line or omit and rely on background colour alone
},
addSetText: { fontSize: 13, fontWeight: '500', color: C.muted },
```

### `ExerciseStrip` — dot count includes extra sets

```ts
// dot count per exercise
ex.targets.length + session.extraSetCounts[i]
```

The dot colour logic (green/orange/dashed) is owned by `strip-pill-redesign`. This commit only adds the extra dot(s).

### `handleAddSet(exIdx)` in screen root

```ts
const handleAddSet = useCallback((exIdx: number) => {
  if (state.status !== 'ready') return;
  const next = addExtraSet(state.session, exIdx);
  const nextInput = inputFromTarget(state.day, next);
  setState({ status: 'ready', day: state.day, session: next, input: nextInput });
}, [state]);
```

### Integration tests

- "+ Add set" row absent while planned sets remain
- "+ Add set" row appears after all planned sets for the current exercise are logged
- Tapping it brings back steppers + Done button (not "Next exercise")
- Strip dot count for that exercise increments by 1
- `saveSession` receives the extra set in the payload on finish

---

## Files touched

| File | Change |
|---|---|
| `src/domain/sessionLogger.ts` | `extraSetCounts`, `addExtraSet`, update `isExerciseDone`, `initSession`, `logSet`, `getActiveTarget` |
| `app/log-session.tsx` | `handleAddSet`, `SetList.onAddSet` prop + row, strip dot count |
| `__tests__/sessionLogger.test.ts` | **new** — domain unit tests |
| `__tests__/log-session.test.tsx` | extend — UI integration tests |

---

## Verification

1. `npm test` — all existing and new tests pass
2. `expo start` — complete all planned sets → "+ Add set" row appears (lighter bg, dashed border)
3. Tap it → steppers pre-fill with last logged set's actual reps/weight
4. Log the extra set → strip dot grows, coloured per result (requires `strip-pill-redesign`)
5. Finish session → extra set visible in progress view for that date
