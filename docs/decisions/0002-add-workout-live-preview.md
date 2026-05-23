# ADR 0002 — Add Workout screen uses single-page Live Preview

**Status:** Proposed
**Date:** 2026-05-23

## Context

The current `app/(tabs)/add.tsx` is a placeholder: white background, a
multi-line `TextInput`, a blue Save button. On save it parses the text via
`parseLiftohistoryText`, alerts on duplicate dates, and saves on success.
It's the only screen still in stock React Native styling — the rest of the
app has moved to the warm-dark vocabulary established in the
`progress/[date].tsx` redesign.

We explored five candidate layouts:

1. **Live Preview** — single page; paste at the top, parsed preview below
2. **Two-Step Wizard** — paste → review with parse log, duplicate banner,
   edit-on-tap
3. **Sources Hub** — the + tab as a launcher into multiple flows
   (paste, file, future watch/photo/voice)
4. **Spuddy Conversational** — chat-style; quick-reply branching
5. **Voice / Dictation** — mic + live transcript + parsed chips

The PRD pins us to a single import source for v0.1 (Liftosaur paste). It
also calls out future import sources (CSV, JSON file, share sheet, on-device
OCR, watch) under §7.3 and §7.8.

| Layout | Day-one fit | Future fit | Complexity |
|---|---|---|---|
| **Live Preview** | ✓ best — paste is the only flow | ✓ slots inside a hub | low |
| Wizard | △ extra step for a clean paste | △ same step works in hub | medium |
| Sources Hub | ✗ extra tap before paste, only one source today | ✓ best — its native form | medium |
| Chat | ✗ slow for repeat use | △ niche | medium-high |
| Voice | ✗ STT not built | △ public-gym social cost | high |

## Decision

Adopt **Live Preview** as the v0.1 Add Workout screen.

The Sources Hub (variant C in the exploration) is the long-term target once
there is more than one import source. It is **not discarded** — it becomes
the wrapper screen above this one when we add a second source (likely file
pick from §7.3).

The Two-Step Wizard's parse-log / per-set-chip / edit-on-tap patterns are
inlined into Live Preview as an expandable error banner and collapsible
exercise rows. We get the "review surface" features without paying for an
extra screen.

The conversational and voice directions are not adopted. Voice may return
post-v2 once an on-device STT model is shipped.

## Consequences

### Positive

- Lowest-friction path for the only import source we have today
- Visually consistent with the rest of the app (warm-dark, Spuddy, Chip)
- Parse-error surfacing comes for free — the same banner pattern works
  whether you paste once or paste twice
- Sources Hub becomes additive later: A is the destination, not a thing
  that gets replaced

### Negative

- Live preview re-renders on every keystroke. The mock parser is fast and
  pure; the real parser is too. We do not expect a perf issue at workout
  size (≤ ~20 lines) but should profile on Android if anyone notices.
- A single page does both authoring and reviewing. Power-typists may
  accidentally hit Save before checking the preview. The Save button is
  sticky and the preview is taller than the textarea — we think that
  framing is enough.
- The Sources Hub future requires us to extract this screen's chrome
  (header, sticky save) into a way that can be reused inside the hub flow.
  Worth doing during the v0.1 build, not deferred.

### Future-direction contract

The Sources Hub (C variant) is wired to land cleanly above this screen.
Contract:

- Live Preview accepts no source-selection state — it assumes paste
- When the hub lands, this screen becomes one of N destinations from the
  hub. The hub passes nothing in; this screen still owns its textarea and
  parse state
- The hub's "Start today's program day" CTA — the primary action by usage
  — does **not** route here. It routes to the v0.2 logging screen
- This screen's header back-arrow routes to whichever screen pushed it:
  hub once it exists, the tab root otherwise. Standard `expo-router` back

This contract means we can ship Live Preview today and add the hub later
without changing this file.

## Supersedes

Nothing. First decision on the Add screen layout.
