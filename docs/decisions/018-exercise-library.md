# ADR-018: Exercise library — schema, seeding, and matching strategy

## Context

Spuddy needed muscle group balance data on the program day screen and library metadata in the exercise edit sheet. The choices were: (a) hardcode a minimal hand-crafted list, (b) let users tag exercises manually, or (c) ship a bundled dataset and auto-link on init.

The free-exercise-db project (yuhonas/free-exercise-db, Unlicense / public domain) provides 873 exercises with `primaryMuscles`, `equipment`, `force`, and other metadata as a single JSON file (~163 KB gzipped), which is negligible relative to a typical Expo APK.

## Decision

1. **Bundled dataset** — `src/data/exercises.json` is checked in directly (not a submodule). No attribution required (Unlicense).

2. **Schema extension** — four nullable columns added to the `exercises` table via migration 0002: `muscle_groups TEXT`, `equipment TEXT`, `library_id TEXT`, `library_confidence INTEGER`. All nullable so existing rows are unaffected.

3. **Exact-match seeding on init** — `seedLibraryMatches` runs once per `initDB` call, case-insensitively matching each unlinked exercise name against the library. Matched rows are updated with `library_confidence = 100`. No fuzzy matching; if the name doesn't match, the exercise stays unlinked.

4. **Muscle group classification from stored `muscle_groups`** — `muscle_groups` stores the library entry's `primaryMuscles` JSON array. The balance selector (`muscleGroupBalance`) classifies each exercise into push / pull / legs / core using a fixed priority: legs > push > pull > core. The `force` field from the library is not stored; classification is derived entirely from muscle names.

5. **`library_id` references the dataset's `id` field** (a slugified name like `Barbell_Squat`) rather than a numeric FK. This keeps the column human-readable and avoids a second bundled table.

## Consequences

- Exercises whose names don't exactly match a library entry remain unlinked (`library_id IS NULL`) and appear as "unmatched" in the balance bar.
- A rename in the program editor does not re-run matching; re-linking happens on next app launch (next `initDB`).
- The bundled JSON adds ~1 MB to the JS bundle (uncompressed). Acceptable for the data value provided; revisit only if APK size becomes a constraint.
- Fuzzy matching, user-initiated search, and manual link overrides are deferred to a future milestone.
