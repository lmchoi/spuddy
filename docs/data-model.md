# Data model

> **State:** current as of v0.4 — includes exercise library enrichment columns.

## Tables

```mermaid
erDiagram
    exercises {
        int     id              PK
        text    name
        text    library_id
        text    muscle_groups
        text    equipment
        int     library_confidence
    }

    sessions {
        int     id              PK
        text    date
        int     exercise_id     FK
        text    sets_json
        text    targets_json
    }

    programs {
        int     id              PK
        text    name
        int     active_day_index
    }

    program_days {
        int     id              PK
        int     program_id      FK
        int     day_index
        text    name
    }

    program_exercises {
        int     id              PK
        int     program_day_id  FK
        int     exercise_index
        int     exercise_id     FK
        text    targets_json
    }

    exercises      ||--o{ sessions          : "recorded in"
    exercises      ||--o{ program_exercises : "planned in"
    programs       ||--o{ program_days      : "has"
    program_days   ||--o{ program_exercises : "has"
```

## Notes

**`exercises` is the canonical name registry and library bridge.** Both `sessions` and `program_exercises` reference `exercises.id` via foreign key. The table is enriched with metadata from the bundled `exercises.json` library (via `library_id`, `muscle_groups`, etc.) during app initialization. This enrichment is "lazy" and depends on an exact name match.

**Sessions and programs are still separate domains.**
 Sessions are immutable historical facts; programs are plans. A program change or deletion must not touch session rows. The shared FK into `exercises` is a naming contract, not a behavioural coupling.

**Same exercise across days.** If an exercise appears on multiple program days (e.g. Squat on Day 1 and Day 3), `program_exercises` has independent rows for each. Progression state will key on `exercise_id` so both days advance together — to be resolved when the progression engine is built.

**`sets_json` / `targets_json`** store arrays of `WorkingSet` / `Target` objects (see `src/types.ts`). Kept as JSON blobs to avoid a join-heavy schema while the shape is still evolving.

**Day-centric by design.** `program_days` has no week or block concept — just named days in order. This keeps the schema simple and accommodates programs from other sources that may not have a week structure.
