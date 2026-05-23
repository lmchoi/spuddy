# ADR-005: Bento layout and warm palette for workout detail screen

**Date:** 2026-05-23  
**Status:** Accepted

## Context

Five design directions were prototyped for `app/(tabs)/progress/[date].tsx` (exported from claude.ai/design, bundle `sRE5G5nLqJepdh4IQiV5Wg`):

1. **Coach Cards** — warm evolution of the existing layout; status pills + Spuddy nudge
2. **Bento Summary** — stat grid (on-target %, volume, set distribution bar) + collapsible exercise rows
3. **Set Timeline** — vertical timeline, one beat per set, warmups dimmed
4. **Hero PR** — large celebratory card for the session's best moment + compact log
5. **Matrix / Spread** — dense grid, sets × exercises, status cells

The existing screen used a cold dark palette (deep navy/neon green) with a flat, always-expanded exercise list.

## Decision

**Adopt Bento Summary (v2) for the workout detail screen**, and shift the palette from cold neon-green to warm dark (cocoa brown / cream / sprout green / butter yellow / paprika).

The other four designs are not discarded — they each have a natural home on a future screen:

| Design | Future home |
|---|---|
| Set Timeline | Live logger (`add.tsx`) — one beat per set in progress |
| Hero PR | End-of-session celebration / share card |
| Matrix / Spread | Per-exercise history view (progress drill-down) |
| Coach Cards | Fallback for sparse sessions where bento would feel empty |

## Consequences

- The warm palette is currently inlined in `[date].tsx`. Before other screens adopt it, centralise to `constants/Colors.ts` (tracked in v0.3 plan).
- Four bento tiles are stubbed until the data model catches up: Duration, PR count, Program day, Muscle group. They are intentionally absent rather than showing placeholder values.
- `WorkingSet.repsLeft` (unilateral rep count) is not displayed in the new design — the bento set grid shows `reps × weight` only. This is a known gap tracked in the v0.3 plan.
- Warmup set count is no longer shown in the detail view. Revisit when the live logger is built.
