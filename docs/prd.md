# Product Requirements Document
## Spuddy — Workout Tracker

**Status:** Active development — M1 shipped, M2 in progress
**Last Updated:** May 2026

---

## 1. Overview

A mobile workout tracking app for people following structured strength programs. It logs sessions, surfaces progression trends, and makes it easy to feed workout data to an AI coach for analysis and next-session targets.

The app is personal-first: built for a specific user with a specific equipment setup, but designed cleanly enough to be shared and used by others. Data flows freely in and out — the app is not a walled garden.

**Design principle:** The app is a logging and analysis tool that can also evolve your program based on what you actually did. Programs are bootstrapped externally (e.g. Liftosaur) and imported once; after that the app owns both the session log and the program.

---

## 2. Problem Statement

Existing workout apps are either too complex or too limited for intermediate home gym users following a structured program:

- Logging a set mid-workout should be fast — most apps have too much friction
- Progression suggestions are usually generic and ignore what equipment you actually have
- History and trends are buried or paywalled
- Getting data into an AI for analysis requires too many manual steps
- Data is locked in — switching apps means losing history

---

## 3. Target User

**Primary (v0.1):** A specific user — recreational athlete, home gym setup (adjustable dumbbells, resistance bands, bench, pull-up bar), training 3–5x per week following a structured program. Goals: strength, posture, basketball and snowboarding performance.

**Expanded (v1+):** Beginner to intermediate gym users following structured programs, home gym or commercial gym. Interest in progression and AI coaching without needing a personal trainer.

---

## 4. Goals

- Log a set in under 30 seconds during a workout
- Surface whether you hit your targets, every set, every session
- Show progression trends per exercise without the user having to dig for them
- Suggest next-session weights constrained to equipment you actually own
- Work fully offline — no network required during a session
- Make it easy to export data for AI analysis
- Import existing history — don't start from zero

---

## 5. Non-Goals

- Not a full program builder — programs are bootstrapped externally; the app can evolve them based on session data but not author them from scratch
- Not a social or community platform
- Not a nutrition tracker
- Does not require any third-party subscription or account to function
- No barbell/powerlifting-specific features in v1
- No Liftosaur API integration — import is file-based only

---

## 6. Liftosaur Relationship

Liftosaur is used as a **one-time bootstrap** — not an ongoing dependency.

**What Liftosaur is used for:**
- Creating the initial program structure and exporting existing session history
- That file is imported once; after that the app is fully standalone and owns the program

**What the app does not do:**
- Does not call the Liftosaur REST API
- Does not write back to Liftosaur
- Does not require Liftosaur premium

**Post-import:** The app is the source of truth for both session history and program structure. Liftosaur edits will not be reflected unless re-imported (which would overwrite in-app changes).

**Long term:** Liftosaur becomes fully optional once the app has enough program evolution capability to replace it.

---

## 7. Features

### 7.1 Session Logging

**Shipped (M1):**
- Log sets: reps, weight, optional notes
- Per-exercise target display (e.g. "3 × 10–12 @ 60s rest")
- Visual indicator per set: on target / exceeded / below target
- Rest timer with configurable duration, haptic on completion
- Session duration tracked automatically
- Previous session's weights shown as default input values

**Must have (M2):**
- Rest timer push notifications (background alert when rest expires)
- Select which program day to run before starting a session
- Finish workout button always visible (not just after final set)

**Nice to have (post-MVP):**
- Warm-up set flag (excluded from working-set analysis)
- Swipe to complete a set
- Garmin watch BLE companion — real-time rep count sent to app, user corrects between sets
- Camera-based rep counting — on-device pose estimation, no watch needed

### 7.2 Equipment Profile

Makes progression suggestions genuinely useful rather than generic.

**Must have:**
- Define available equipment: resistance bands, bodyweight, pull-up bar, bench, barbell (toggle)
- Adjustable dumbbells: specify plates owned — app calculates achievable weights from combinations
- Barbell: specify plates owned — app calculates achievable loads
- All weight suggestions constrained to achievable weights — never suggest a weight the user can't load
- When user has maxed out available weight, suggest harder variation instead

### 7.3 Program Import

**Must have:**
- Import from Liftosaur file export
- Mirror Liftosaur's program structure — don't invent our own model
- Import session history — full backfill from Liftosaur export

**Nice to have:**
- Import from generic CSV
- Import from Strong or Hevy export format

### 7.4 Exercise History & Analytics

**Shipped (M1):**
- Per-exercise view: all logged sessions, newest first
- Each entry: date, sets × reps @ weight, on-target indicator

**M2+:**
- Weight and reps progression charts with target reference lines
- Best set record
- Volume per muscle group per week

### 7.5 Post-Session Program Update (M2)

When a session is finished and the app detects that the user changed sets, reps, or weight from the program targets, prompt them to save those changes back to the program.

**Two options presented:**
- **Update this day** — overwrite the current `ProgramDay` targets to match what was actually done
- **Save as new day** — prompt the user to name the new day, then create a new `ProgramDay` with that name, leaving the original intact

**Detection rule:** Compare working sets (non-warmup) against the day's targets. A prompt is shown if any of these are true:
- An exercise in the program has **zero sets logged** (skipped entirely)
- A logged exercise has a **different weight or rep target** than the program specifies
- A logged exercise is **not in the program** (added mid-session)

Partial set completion (e.g. did 3 of 5 sets) does **not** trigger the prompt — that's stopping early, not a program change.

**When saving a new day:** include only exercises that had at least one set logged. Keep the original program targets (set count, reps, weight) for each included exercise — do not reduce targets to match what was done today. If weight or reps changed deliberately, use the new values as the target for those exercises.

**No prompt if:** nothing diverged, or only warmup sets were logged.

### 7.6 Smart Progression Engine (M3)

- Suggest next session weight based on recent performance, constrained to available equipment
- Linear, rep-range, and deload progression patterns
- Stall detection and variation suggestions
- Bodyweight/band progressions: suggest harder variation, not heavier weight

### 7.7 Session Review Dashboard (M4)

- Summary stats: duration, sets, reps, on-target percentage
- Muscle group volume chart
- Set-by-set breakdown

### 7.8 AI Coaching

Intentionally decoupled — user brings their own AI.

**MVP:** Export session data as JSON + copyable coaching prompt template. User pastes into Claude or any AI. No API key required.

**M4 — in-app Claude:** Claude API called directly from the app with user's own API key. Inline session analysis and progression suggestions.

**v2.0 — desktop MCP server:** Companion desktop app hosts an MCP server. Mobile syncs data to it. Claude Desktop connects to localhost on the desktop for full read-write AI integration.

### 7.9 Data Export

**Must have (implement before any schema migration):** Export all sessions as JSON, shared via the system share sheet (iOS and Android). Primary safety net to protect user data during updates.

**Nice to have:** CSV export, FIT export (post-MVP).

---

## 8. Open Questions

- What is the exact format of Liftosaur's file export? Does it include equipment type per exercise? — **verify before building import**
- How should band resistance be handled in progression — approximate kg equivalent, or named scale?
- Should the app support custom exercise creation in M1, or only exercises from the import?
- For in-app Claude (v0.4): user supplies their own API key — is that acceptable UX?
- At what point does the app get its own program editor and no longer need Liftosaur?
