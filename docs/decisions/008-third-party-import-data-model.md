# ADR 008 — Third-party history import: field mapping and data model gaps

**Date:** 2026-05-25  
**Status:** Decided

---

## Context

We analysed the export formats of two major workout apps — **Strong** (semicolon-delimited CSV) and **Hevy** (comma-delimited CSV) — against Spuddy's existing `WorkingSet` / `Session` schema to understand what could be imported cleanly, what required schema changes, and what should be dropped.

### Strong CSV fields
`Workout #`, `Date`, `Workout Name`, `Duration (sec)`, `Exercise Name`, `Set Order`, `Weight (kg)`, `Reps`, `RPE`, `Distance (meters)`, `Seconds`, `Notes`, `Workout Notes`

### Hevy CSV fields
`title`, `start_time`, `end_time`, `description`, `exercise_title`, `superset_id`, `exercise_notes`, `set_index`, `set_type`, `weight_kg`, `reps`, `distance_km`, `duration_seconds`, `rpe`

---

## Field mapping

### Maps cleanly ✅

| Strong | Hevy | Spuddy |
|---|---|---|
| `Date` | `start_time` (date part) | `Session.date` |
| `Exercise Name` | `exercise_title` | `ExerciseEntry.name` |
| `Weight (kg)` | `weight_kg` | `WorkingSet.weight` |
| `Reps` | `reps` | `WorkingSet.reps` |
| `Set Order` / `set_index` | — | implicit array order |
| — | `set_type = "warmup"` | `WorkingSet.isWarmup` |

### Requires schema extension

| Field | Source | Decision |
|---|---|---|
| `RPE` / `rpe` | Both | Add `rpe?: number` to `WorkingSet`. Kept in schema for import fidelity and future AI coaching context. Not shown in live logging UI — user doesn't rate effort mid-workout. |
| `Distance (meters)` / `distance_km` | Both | Add `distanceMeters?: number` to `WorkingSet`. User wants cardio sets preserved, not silently dropped. |
| `Seconds` / `duration_seconds` | Both | Add `durationSeconds?: number` to `WorkingSet`. Covers timed sets (plank, carries). Live logging of these deferred to Garmin sync. |

### Dropped silently

| Field | Source | Reason |
|---|---|---|
| `Workout Name` / `title` | Both | Spuddy sessions are date-keyed, no name field. |
| `Duration (sec)` / `end_time` | Both | Session duration not stored. |
| `Notes` / `exercise_notes` / `Workout Notes` / `description` | Both | No notes model in Spuddy. |
| `superset_id` | Hevy | No superset grouping concept in Spuddy. |

### Spuddy fields that imports cannot fill

| Field | Gap |
|---|---|
| `WorkingSet.isBodyweight` | Neither app marks this explicitly — defaults to `false` on import. |
| `WorkingSet.repsLeft` | Unilateral left side — not tracked by either app. |
| `ExerciseEntry.targets[]` | Historical sets have no program target — always `[]` on import. |

---

## Warmup sets

Strong does not include a warmup flag in its CSV export. All sets from Strong are imported as working sets (`isWarmup: false`). Hevy's `set_type` field is mapped: `"warmup"` → `isWarmup = true`, all other values → `false`.

---

## Duplicate handling

Import uses **content-based deduplication** rather than date-based deduplication. A hash of each workout's content is computed at import time. If an identical hash already exists in the database, that workout is skipped. If the hash differs — even for the same date — the workout is imported. This supports:
- Re-importing the same file safely (no double entries)
- Importing from multiple sources on the same date (e.g. Strong + Hevy for the same day)

---

## Exercise library dependency

During logging UI design it became clear that exercises should reference a canonical exercise library (with images, muscle group data, equipment type) rather than being stored as bare name strings. This means:

- `ExerciseEntry.name` is a short-term placeholder
- A future migration will add an `exerciseId` foreign key referencing the library
- On import, exercise names from Strong/Hevy will need fuzzy-matching to library entries; unmatched names fall back to a user-created exercise record

This is tracked as an open question — the specific library is not yet chosen.

---

## Consequences

- `WorkingSet` gains three optional fields: `rpe?`, `distanceMeters?`, `durationSeconds?`
- DB schema requires a migration to add these columns (nullable, default null)
- Import preview UI must surface skipped-duplicate count so users know if data was dropped
- Cardio/timed sets are stored but not yet loggable from within the app (live logging covers weight + reps only for now)
- Exercise name → library ID matching is deferred; named strings are used until the library is chosen
