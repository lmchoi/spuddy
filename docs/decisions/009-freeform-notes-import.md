# ADR 009 — Freeform notes import: parsing strategy and exercise identity

**Date:** 2026-05-25  
**Status:** Decided

---

## Context

Users keep their own workout notes in plain text — a list of exercises with weights, grouped under a heading. The format is personal and inconsistent: no standard delimiter, optional reps/sets, parenthetical nicknames, mixed unit annotation. Example:

```
May
- Leg press - 68.3
- Hip abduction (ass) - 42.4
- Bench press 2x 15kg
```

We want to let users paste this text during onboarding and have the app create programs from it — frictionlessly, without requiring a structured CSV or a specific app export.

---

## Decisions

### 1. Heuristic parser — no AI, first iteration

Use a regex/heuristic parser rather than calling the Claude API. The format is consistent enough (bullet list, name–weight separator, optional `Nx` prefix) that a small parser handles the common cases well. AI-assisted parsing is deferred until the heuristic demonstrably fails.

Two line patterns are supported:

- `- {name} - {weight[unit]}` → 1 set, weight stored, reps null
- `- {name} Nx {weight[unit]}` → N sets, weight stored, reps null

Lines matching neither pattern are silently skipped; a skipped-line count is shown inline so the user knows something was dropped.

### 2. Section header → program name

A non-bullet line (e.g. `May`, `Push`, `Legs`) is treated as a section header and becomes the program name. Multiple sections in one paste → multiple programs created. If no header is present, the program name defaults to `"My Workout"`.

Headers are not interpreted as dates. `May` is a label, not a timestamp.

### 3. Missing reps → null; single set

Most freeform entries have no rep count. These are stored as a single set with `reps: null`. The user fills in reps during their first session or edits the program manually. We do not default to `reps: 1` — that would imply false precision.

### 4. Unit handling

If any line contains an explicit `kg` or `lbs`/`lb` suffix, that unit is used for all weights in the paste. If the unit is ambiguous or absent, a `kg | lbs` pill is shown inline (same pattern as Strong import) for the user to confirm before saving. All weights are stored in kg.

### 5. Exercise identity: stable UUID, name as display label

Every exercise created from a freeform import is assigned a **stable internal UUID** at creation time. The raw user string (e.g. `"Hip abduction (ass)"`) is stored as the display label only.

Program entries, session sets, and all history reference the UUID — not the string. This means:

- The user can rename the display label without breaking history
- The user can later link the exercise to a canonical library entry (e.g. free-exercise-db) without a data migration
- Re-importing different text with the same exercise name creates a new UUID (no silent merging)

This follows the pattern established in ADR-008 (`exerciseId` FK to a canonical library is a future migration).

### 6. No exercise library matching in this iteration

Matching to free-exercise-db (for muscle group data, images, equipment type) is deferred entirely. The library is only load-bearing when muscle group analytics are built (v0.2+). Prompting the user to match exercises at import time is friction for a feature that does not exist yet.

When muscle group analytics are scoped, matching will be surfaced contextually on the analytics screen — not at import or session logging time.

### 7. One-off onboarding flow

This import is positioned as a first-run onboarding step, not an ongoing workflow. It is also accessible from Settings for users who discover it later. After import the user lands on the programs view.

---

## Consequences

- Parser is intentionally narrow — it handles the two known patterns well and skips everything else. Unusual formats (e.g. `3 sets × 10 reps @ 70kg`) will be skipped until the parser is extended.
- `reps: null` must be handled gracefully throughout the logging UI — a null rep target should render as an empty/editable field, not crash or show `0`.
- Exercise UUIDs are created eagerly at import time. A second import of the same text creates new UUIDs for every exercise — no dedup. This is acceptable for a one-time bootstrap flow.
- The `exerciseId` FK migration (ADR-008 open question) remains unresolved — this ADR does not choose the library or define the schema; it only commits to using a stable UUID so the migration is cheap when it comes.
