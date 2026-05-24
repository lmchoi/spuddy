# Plan: Personal Records — storage and display

**Status:** Draft  
**Depends on:** v0.3 session logging (live logger must exist before PR celebrations make sense)

---

## Goal

Every exercise has a "best ever" set. The app knows what it is, surfaces it in the right places, and tells the user when they beat it.

---

## What counts as a PR

Three record types, tracked independently:

| Type | Definition | Applies to |
|---|---|---|
| **Best weight** | Heaviest weight on any single working set | Weighted exercises only |
| **Best reps** | Most reps in any single working set | Bodyweight exercises (weight = 0) |
| **e1RM** | Epley estimated 1-rep max: `weight × (1 + reps / 30)` | Weighted exercises only |

**Exclusions:**
- Warmup sets (`isWarmup: true`) are never considered.
- Bodyweight sets (`isBodyweight: true, weight: 0`) use rep PR only; e1RM is undefined.

**Why e1RM?** A user who hits 20 kg × 12 has a higher e1RM than one who hits 22 kg × 3. Best weight alone doesn't capture progress across rep ranges. Both are shown so the user can see both dimensions.

**Why not volume PR?** Total session volume (sets × reps × weight) is a useful metric but belongs in the analytics / session review screen, not the PR system. Defer.

---

## Storage approach

**Computed on demand — no separate `personal_records` table.**

Rationale:
- One user, expected < 2 000 session rows in SQLite. Scan is fast (< 20 ms).
- No sync complexity — no risk of the PRs table drifting from the sessions log.
- Adding a new PR type later (e.g. volume) requires no schema migration.
- If performance becomes a real issue, a materialized cache can be added later without changing any calling code (swap the function implementation, not the interface).

The one query that is more expensive is "most recently achieved PR" for the progress hero (must scan all exercises). This is acceptable at current scale. If it is measured to be slow, memoize it with a 60-second TTL in React state.

---

## Domain functions

All pure functions in `src/domain/records.ts`. TDD — tests written first.

```ts
// The PR for a single exercise, computed from its session history
export type ExerciseBestRecord = {
  exerciseName: string;
  // Weighted exercises
  bestWeight?: number;       // kg
  bestWeightReps?: number;   // reps achieved at bestWeight
  bestE1rm?: number;         // Epley, rounded to 1 decimal
  bestE1rmWeight?: number;   // weight used for that e1RM
  bestE1rmReps?: number;     // reps used for that e1RM
  // Bodyweight exercises
  bestReps?: number;
  // Metadata
  achievedDate: string;      // YYYY-MM-DD of the session where the record was set
};

// Returns the current best record for one exercise.
// Returns null if the exercise has no logged sessions.
export function computeBestRecord(
  sessions: Session[],     // all sessions containing this exercise, any order
  exerciseName: string
): ExerciseBestRecord | null

// Returns a list of sets that beat the best record that existed
// BEFORE this session — i.e. "new PR" events from a single session.
// Used by the live logger and session detail to badge individual sets.
export type PREvent = {
  exerciseName: string;
  type: 'weight' | 'reps' | 'e1rm';
  setIndex: number;        // index into the exercise's sets array
  newValue: number;        // the new record value
  previousValue: number;   // what the record was before (0 if first ever)
};

export function detectPREvents(
  completedSession: Session,
  priorHistory: Session[]  // all sessions BEFORE the completed one
): PREvent[]

// For the progress hero: returns the most recently achieved PR across
// all exercises, or null if no PR has ever been set.
export type LatestPRSummary = {
  exerciseName: string;
  type: 'weight' | 'reps' | 'e1rm';
  value: number;
  date: string;
};

export function findLatestPR(
  allSessions: Session[]
): LatestPRSummary | null
```

`findLatestPR` works by iterating sessions chronologically, building up the best record seen so far, and recording whenever a new record is set. O(sessions × sets per session).

---

## Display surfaces

### Surface 1 — Exercise history screen (per-exercise view)

The header of the exercise history screen shows the current best record prominently.

```
Dumbbell Row
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PB  22 kg × 8    e1RM 28.7 kg
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[session list below]
```

For bodyweight:
```
Pull-Up
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PB  14 reps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Data: call `computeBestRecord` with sessions from `getSessionsForExercise`.

### Surface 2 — Progress hero "Last PR" stat

The deferred "—" placeholder in the Streak Hero is filled in:

```
Last PR
Dumbbell Row  22 kg
3 days ago
```

Format: `exerciseName + " " + value` on line 1, relative date on line 2. If the type is e1RM, show the weight achieved (not the e1RM figure) — the number the user actually lifted is more tangible.

Data: call `findLatestPR(allSessions)` where `allSessions` is already loaded by the Progress screen.

### Surface 3 — Gold badge on sets in session detail (bento tile)

The bento detail screen already plans for `isPR` on exercise rows (see v0.3 plan). A set gets a gold "PR" pill if it is a PR-event set for that session.

The bento screen calls `detectPREvents(session, priorSessions)` and marks the matching sets. Prior sessions are already available since `getAllSessions` is loaded; just filter `date < session.date`.

Visual: a small gold `PR` pill next to the rep/weight label on the set row. Same pill for any of the three types — the type distinction matters less in context.

### Surface 4 — Live logger celebration (deferred to live logging milestone)

When the user logs a set that beats their best, show a brief "New PR!" celebration (subtle animation, haptic). This surface is left for the live logger milestone since it requires the logger to exist.

---

## Implementation slices

**Slice 1 — Domain functions (TDD)**
- Write tests for `computeBestRecord`, `detectPREvents`, `findLatestPR` with edge cases:
  - Warmup sets excluded
  - Bodyweight exercise (no weight PR / e1RM)
  - Tie (same value, earlier date wins — keep first occurrence date)
  - No sessions
- Implement `src/domain/records.ts` until tests pass

**Slice 2 — Exercise history header**
- Add PB row to the exercise history screen header
- No new storage queries — uses `getSessionsForExercise` already called by the screen

**Slice 3 — Progress hero "Last PR"**
- Replace "—" with real data from `findLatestPR`
- `allSessions` is already in scope on the Progress screen

**Slice 4 — Bento session detail PR badges**
- Call `detectPREvents` in the bento detail screen
- Pass PR flags down to the set row component
- Render gold pill

---

## Out of scope

- Volume PR (total session volume)
- Rep PR at a specific weight ("most reps ever at 20 kg") — too granular for v1
- PR notifications / push alerts
- Historical PR chart ("my e1RM over time") — belongs in progression charts

---

## Open questions

- **Tie-breaking:** if the same weight × reps appear in two sessions, the earlier session "owns" the record. Is that right, or should we prefer the most recent (to surface a fresh achievement date)?
- **e1RM display precision:** round to nearest 0.5 kg (matches equipment step sizes) or 1 decimal?
- **"Last PR" recency cap:** if the user's last PR was 8 months ago, does showing it feel stale? Option: cap at 90 days and show "—" with a gentle nudge instead.
- **Session detail badge scope:** badge only the set that is the PR, or also badge the exercise row heading? Leaning: badge the set row only — simpler.
