# Product Requirements Document
## Spuddy — Workout Tracker

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** May 2026

---

## 1. Overview

A mobile workout tracking app for people following structured strength programs. It logs sessions, surfaces progression trends, and makes it easy to feed workout data to an AI coach for analysis and next-session targets.

The app is personal-first: built for a specific user with a specific equipment setup, but designed cleanly enough to be shared and used by others. Data flows freely in and out — the app is not a walled garden.

**Design principle:** The app is a logging and analysis tool, not a program authoring tool. Programs are created or edited elsewhere (e.g. Liftosaur) and imported. The app owns the session log and the history.

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

- Not a program builder — programs are authored externally and imported
- Not a social or community platform
- Not a nutrition tracker
- Does not require any third-party subscription or account to function
- No barbell/powerlifting-specific features in v1
- No Liftosaur API integration — import is file-based only

---

## 6. Liftosaur Relationship

Liftosaur is used as an **external program authoring tool** and **one-time data bootstrap**. The app has no live API dependency on Liftosaur.

**What Liftosaur is used for:**
- Creating and editing programs (Liftosaur remains the program editor for now)
- Exporting existing session history and current program as a file
- That file is imported into the app once; after that the app is fully standalone

**What the app does not do:**
- Does not call the Liftosaur REST API
- Does not write back to Liftosaur
- Does not require Liftosaur premium

**Long term:** As the app matures and gets its own import/export, Liftosaur becomes fully optional.

---

## 7. Features

### 7.1 Session Logging

**Must have:**
- Log sets: reps, weight, optional notes
- Per-exercise target display (e.g. "3 × 10–12 @ 60s rest")
- Visual indicator per set: on target / exceeded / below target
- Rest timer with configurable duration, haptic on completion
- Session duration tracked automatically
- Previous session's weights shown as default input values

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

**Must have (v0.1):**
- Per-exercise view: all logged sessions, newest first
- Each entry: date, sets × reps @ weight, on-target indicator

**v0.2+:**
- Weight and reps progression charts with target reference lines
- Best set record
- Volume per muscle group per week

### 7.5 Smart Progression Engine (v0.3+)

- Suggest next session weight based on recent performance, constrained to available equipment
- Linear, rep-range, and deload progression patterns
- Stall detection and variation suggestions
- Bodyweight/band progressions: suggest harder variation, not heavier weight

### 7.6 Session Review Dashboard (v0.4+)

- Summary stats: duration, sets, reps, on-target percentage
- Muscle group volume chart
- Set-by-set breakdown

### 7.7 AI Coaching

Intentionally decoupled — user brings their own AI.

**MVP:** Export session data as JSON + copyable coaching prompt template. User pastes into Claude or any AI. No API key required.

**v0.4 — in-app Claude:** Claude API called directly from the app with user's own API key. Inline session analysis and progression suggestions.

**v2.0 — desktop MCP server:** Companion desktop app hosts an MCP server. Mobile syncs data to it. Claude Desktop connects to localhost on the desktop for full read-write AI integration.

### 7.8 Data Export

**Must have:** Export all sessions as JSON, shared via iOS share sheet.

**Nice to have:** CSV export, FIT export (post-MVP).

---

## 8. Milestones

Each milestone has its own implementation plan written just before work starts.

| Milestone | Scope |
|---|---|
| **v0.1** | Liftosaur file import (history + program), equipment profile, exercise history list, progression charts, JSON export + AI prompt template |
| **v0.2** | Session logging — log sets against program, targets display, rest timer + haptics, previous session defaults. Replaces Liftosaur for day-to-day logging. |
| **v0.3** | Smart progression engine — equipment-aware weight suggestions, plate calculator, stall detection, deload |
| **v0.4** | Session review dashboard, volume per muscle group, in-app Claude API integration |
| **v1.0** | Polish, CSV export, warm-up set support, deload suggestions |
| **v2.0** | Desktop MCP server companion, cloud sync, Apple Health write |
| **v2.1** | Garmin BLE companion (Connect IQ + real-time rep sync) |
| **v2.2** | Camera-based rep counting (on-device) |
| **v3.0** | FIT import/export, Strong/Hevy import, standalone program editor |

---

## 9. Open Questions

- What is the exact format of Liftosaur's file export? Does it include equipment type per exercise? — **verify before building import**
- How should band resistance be handled in progression — approximate kg equivalent, or named scale?
- Should the app support custom exercise creation in v0.1, or only exercises from the import?
- For in-app Claude (v0.4): user supplies their own API key — is that acceptable UX?
- At what point does the app get its own program editor and no longer need Liftosaur?
