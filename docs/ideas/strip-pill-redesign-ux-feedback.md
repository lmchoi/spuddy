# Strip-pill redesign — UX feedback

> Parked feedback from review of `docs/mockups/strip-pill-redesign/`. Not yet triaged into a plan.

---

## What's working well

**Dot-in-pill progress indicator** — compact, glanceable, and the encoding is legible once you understand it (filled = done, ring = current). Grows naturally as sets complete without taking up extra space.

**Orange for a miss** — Set 2 at `10 × 0 kg` in amber is a nice way to flag "you didn't hit target" without being punishing. It's subtle at rest but informative when you look.

**Rest timer replacing the input panel** — clean context switch. The thin progress bar at the bottom is elegant and doesn't clutter.

**Global progress counter** — "0 → 1 → 2 of 15 sets" in the header gives good workout-level awareness without dominating the screen.

---

## Issues and questions

### 1. Two-row pill layout burns vertical real estate
Five exercises in a 2-row wrap layout costs ~100 px permanently. With 15 sets spread across 5 exercises, most workouts will have this many exercises or more. A **single horizontally scrolling row** would reclaim that space and scale to any exercise count. The tradeoff is losing "see all at once" — but if scroll position snaps to the active pill, that's probably fine.

### 2. Large dead zone in the middle
There's a huge empty area between the set list card and the bottom controls. The gear button floating alone there looks stranded. Options:
- Move the gear into the header or into a bottom sheet
- Fill the space with **last session data** (what you lifted last time for this exercise) — high value during a workout
- Or simply let the set card expand to fill more of the space

### 3. Inactive pill dots vs active pill dots — two different semantics
On inactive pills (Bent Over Row, Push Up, etc.) the three dots appear to mean *"3 sets total, none started."* On the active pill they mean *"progress."* That's two different encodings for visually identical elements. A user might read the inactive dots as "those exercises are 100% done" (all filled) or just be confused.

Consider distinguishing the two states — e.g. inactive pills could show a row of **rings only** (set count as outlines) while the active pill replaces rings with filled dots as sets complete. Or use a count badge ("×3") instead of dots for inactive pills.

### 4. Miss dots don't propagate to the pill
In screen 3, Set 2 was a miss (amber in the list), but the two filled dots in the "Goblet Squat" pill both appear green. This is a reasonable simplification — the pill is just "done/not done" — but it's worth a deliberate call. If you want the pill to carry quality signal, an orange dot for a missed set would distinguish "completed cleanly" from "completed short."

### 5. Future sets show "0 kg" but the stepper shows "BW"
The weight stepper says **BW** (bodyweight), but the set rows say **12 × 0 kg**. A user logging a bodyweight squat sees "0 kg" for all future sets — that could read as a data error. The set list rows should mirror the stepper's unit, showing **BW** instead of `0 kg` when bodyweight is selected.

### 6. "Done · Set 2 of 3" — missing rep confirmation
The Done button tells you *which set* you're logging, which is great. It doesn't show *what you're logging* (12 reps, BW). Adding the rep count — e.g. **"Done · 12 reps · Set 2 of 3"** — gives a quick sanity check right at the tap point and reduces mis-logs without much extra cost.

### 7. Can you tap inactive pills mid-set?
These mockups don't show what happens if you tap "Bent Over Row" while in the middle of Goblet Squat. That path probably needs explicit handling (discard/save the current set? navigate away freely?). Worth calling out in the plan if not already covered.

---

## Priority order

| Priority | Issue |
|---|---|
| 🔴 High | `0 kg` vs `BW` mismatch — looks like a bug |
| 🔴 High | Dead zone / floating gear — wastes space and looks unfinished |
| 🟡 Medium | Inactive pill dot semantics — risks confusion with active dots |
| 🟡 Medium | Two-row pill layout — scale problem as exercise count grows |
| 🟢 Low | Done button rep confirmation — nice-to-have polish |
| 🟢 Low | Miss dots in pill — intentional call, just document it |
| 🟢 Low | Mid-set exercise switching — needs a defined flow |
