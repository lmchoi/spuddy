# Product Requirements Document
## Workout Tracker — Mobile App

**Version:** 0.3  
**Status:** Draft  
**Author:** TBD  
**Last Updated:** May 2026

---

## 1. Overview

A mobile-first workout tracking app for recreational athletes focused on strength training, posture improvement, and sport-specific fitness (basketball, snowboarding). The app logs sessions, tracks progression over time, and provides AI-powered feedback and equipment-aware progression suggestions.

The app is designed as an open platform: data flows freely in and out, and it integrates with whatever tools and devices the user already has — rather than locking them into a new ecosystem.

**Liftosaur bridge strategy:** Liftosaur is used as the initial program authoring tool and data bootstrap. The app imports session history and program structure from Liftosaur, and pushes computed progression updates back automatically — no manual re-entry. Over time the app owns the full logging and intelligence experience; Liftosaur becomes optional and eventually replaceable.

---

## 2. Problem Statement

Existing workout apps are either too complex for beginners or too simple to provide meaningful progression insights. Users following structured beginner programs need:

- A frictionless way to log sets, reps, and weights during a session
- Clear visibility of whether they hit their targets
- Historical data per exercise to understand progression
- Contextual coaching feedback without needing a personal trainer
- Progression suggestions that respect what equipment they actually have

Existing apps also tend to be walled gardens — data goes in but doesn't come out easily, and they don't play well with other platforms the user may already use (Garmin, Apple Health, Strong, Liftosaur, etc.).

---

## 3. Target User

**Primary:** Beginner to intermediate home gym / gym user, 20–35, training 3–5x per week with a structured program. Interested in strength, posture, and recreational sport performance. Training with a fixed equipment set (e.g. adjustable dumbbells, resistance bands, pull-up bar) rather than a full commercial gym.

**Secondary:** Users following physio-prescribed exercise programs who want to track adherence and progress.

---

## 4. Goals

- Make logging a session during a workout as fast as possible (under 30 seconds per set)
- Surface progression trends without the user having to dig for them
- Provide AI coaching feedback that is specific, not generic
- Suggest progressions that only use weights and equipment the user actually has
- Work fully offline — gym/home wifi is unreliable
- Make it trivially easy to get data in and out — the app should feel like it belongs in the user's existing ecosystem, not replace it

---

## 5. Non-Goals

- Not a social or community platform
- Not a nutrition tracker
- Not a program builder in v1 (programs are authored in Liftosaur or imported)
- No barbell/powerlifting-specific features in v1
- The app never *requires* an external platform — all core functionality works standalone without any connected service

---

## 6. Features

### 6.1 Session Logging

**Must have:**
- Log sets with reps, weight, and optional notes
- Per-exercise target display (e.g. "3x10–12 @ 60s rest")
- Visual indicator per set: on target / exceeded / below target
- Rest timer with configurable duration per exercise
- Warm-up set flag (excluded from working set analysis)
- Session duration tracked automatically

**Nice to have:**
- Quick-add previous session's weights as defaults
- Swipe to complete a set
- Haptic feedback on rest timer completion
- Garmin watch companion (Connect IQ): real-time rep count sent to app over BLE during set; user can correct count between sets. Watch acts as sensor only — app remains source of truth. (post-MVP, see milestones)
- Camera-based rep counting: on-device computer vision (e.g. MediaPipe pose estimation) detects reps via phone camera; user corrects if needed. No watch required. (post-MVP)

### 6.2 Equipment Profile

The equipment profile is a first-class feature that makes progression suggestions genuinely useful rather than generic.

**Must have:**
- User defines available equipment at setup: dumbbell pairs (list exact weights available), resistance bands (light/medium/heavy or named), bodyweight, pull-up bar, etc.
- Per-exercise, user assigns which equipment it uses
- All progression suggestions and weight targets are constrained to available equipment — the app never suggests a weight the user can't load
- When the user has maxed out available weight for an exercise, the app flags it and suggests a harder variation instead of a heavier weight

**Nice to have:**
- Multiple equipment profiles (e.g. "home" vs "gym")
- Bar + plates calculator for users who also train at a commercial gym

### 6.3 Smart Progression Engine

The core differentiator. Goes beyond generic linear progression by being equipment- and context-aware.

**Must have:**
- Per-exercise progression tracking: did user hit target reps across all sets?
- Suggest next session weight based on performance history, constrained to available equipment increments
- Handle common progression patterns: linear (add weight), rep-range (increase reps before adding weight), deload (reduce weight after repeated failures)
- Distinguish bodyweight / band progressions (harder variation, not heavier weight)
- Push updated progression targets back to Liftosaur automatically via API (see 6.6)

**Nice to have:**
- Detect stalls (e.g. 3 sessions without progression) and suggest deload or variation swap
- RPE-aware adjustments — if user logs RPE, factor into progression rate

### 6.4 Exercise History & Analytics

- Per-exercise view showing all logged sessions
- Avg reps per session charted over time with target min/max reference lines
- Weight progression chart
- Best set record
- Muscle group tagging per exercise
- Volume per muscle group per week (the insight Liftosaur paywalls)

### 6.5 Session Review Dashboard

- Summary stats: duration, total sets, total reps, on-target percentage
- Muscle group volume bar chart
- Set-by-set breakdown with colour coding
- AI session analysis (see 6.7)

### 6.6 Liftosaur Integration

Liftosaur is the bootstrap platform. This integration covers the full two-way sync loop.

**Import (v0.1):**
- Pull session history from Liftosaur REST API (`GET /api/v1/history`) — paginated, full backfill on first connect
- Pull current active program from Liftosaur (`GET /api/v1/programs/current`) — parse Liftoscript to extract days, exercises, sets/reps targets, rest times
- Store locally; Liftosaur becomes optional after initial import

**Sync back (v0.2+):**
- After each session, app computes next progression targets via the progression engine
- Generate updated Liftoscript reflecting new weights/targets
- Push to Liftosaur via `PUT /api/v1/programs/current`
- Liftosaur reflects updated targets next time user opens it — no manual entry
- Validate Liftoscript before pushing; surface errors to user if push fails

**Auth:**
- User provides Liftosaur API key (bearer token, starts with `lftsk_`)
- Stored securely in device keychain
- Note: Liftosaur REST API requires a premium subscription on their end

**Long-term:**
- As the app matures, Liftosaur dependency reduces — the app can own the full experience
- Liftosaur integration remains available indefinitely for users who prefer it as their program editor

### 6.7 AI Coaching

AI coaching is intentionally decoupled from the app — the user brings their own AI (Claude, GPT, local model, etc.) and the app makes it easy to feed it the right data.

**MVP (v0.1):**
- User exports session data from Liftosaur (JSON or CSV)
- Pastes into their AI chat alongside a coaching prompt (provided by the app as a copyable template)
- AI returns progression suggestions and session analysis in plain language
- User applies suggestions manually in Liftosaur
- No API key required, no backend, works with any AI

**v2 — Liftoscript generation:**
- App reads history via Liftosaur API
- AI suggestions returned as valid Liftoscript
- User pastes Liftoscript back into Liftosaur program editor (one paste replaces many manual edits)

**v3 — MCP server (desktop):**
- App exposes a local MCP server over localhost
- User's AI client connects directly — reads session history, writes updated targets back to app and Liftosaur
- Full read-write, no manual steps
- Mobile remains the logging/viewing interface; desktop handles the AI integration

**Coaching prompt:**
- A well-crafted system prompt is a standalone deliverable, shareable and refinable independently of the app
- Encodes: user goals, equipment profile, how to read the export format, progression logic, plain language output rules
- Versioned alongside the app; users can customise it

### 6.8 Program Support

- Import program structure from Liftosaur (via API, see 6.6) or from file (JSON/Liftoscript)
- Multi-day program support (Day 1 lower / Day 2 upper etc.)
- Week tracking
- Support for band/bodyweight exercises where weight is 0 or approximate

### 6.9 Data Portability & Other Integrations

**Design principle:** The app is not a walled garden. Users own their data and can move it freely in any direction. Integration with external platforms is additive — the app works fully without any of them.

#### Import
- JSON (native app format)
- Liftosaur history + program (via REST API or manual export file)
- FIT files — from Garmin, Wahoo, and other devices; parse strength session data where available
- CSV — generic tabular import for sets/reps/weight data

#### Export
- JSON (full fidelity, all sessions and metadata)
- CSV (per-session or full history)
- FIT (for re-importing into Garmin Connect or other platforms) — post-MVP

#### Other platform integrations (all optional, post-MVP)
- **Garmin Connect** — import activity history; note: Garmin does not expose a write API for strength sessions
- **Apple Health / Google Fit** — write workout summaries (calories, duration, muscle groups) after each session
- **Strong / Hevy** — import historical workout data via their export formats

#### Automated input methods (post-MVP)
- **Garmin BLE companion** — Connect IQ watch app sends rep counts over BLE in real time; user corrects between sets
- **Camera rep counting** — on-device pose estimation (MediaPipe) counts reps via phone camera; no watch needed

---

## 7. User Flows

### First-time setup
1. User connects Liftosaur account (enters API key)
2. App pulls full session history and current program
3. User defines equipment profile (dumbbells available, bands, etc.)
4. App is ready — historical data visible, today's program loaded

### Logging a session
1. Open app → today's program day shown with targets
2. Tap exercise → log set (reps + weight) → rest timer starts automatically
3. Repeat for all sets → move to next exercise
4. End session → summary shown
5. App computes next session targets → pushes updated Liftoscript to Liftosaur in background

### Reviewing progress
1. Navigate to Exercises tab
2. Select exercise
3. View weight and reps progression charts over time
4. Tap any session entry to see full set breakdown

### Getting AI feedback
1. Open session review
2. Tap "Analyse session"
3. AI summary generated using session data, equipment profile, and user goals
4. Displayed inline in session view

### Importing from Garmin
1. User exports FIT file from Garmin Connect
2. Opens file in app via share sheet / file picker
3. App parses strength session data from FIT
4. User reviews and confirms import
5. Session appears in history with Garmin source tag

---

## 8. Technical Considerations

- **Platform:** iOS and Android via **Expo + React Native** (TypeScript). Web support available as a secondary target but not prioritised. Run on device during development via Expo Go (no App Store submission needed).
- **Offline-first:** `expo-sqlite` for local database; all features work without connection
- **AI:** User-driven — MVP is paste JSON export into Claude chat; v2+ via MCP server; no API key managed by the app
- **Data model:** Equipment Profile + Programs → Days → Exercises → Sessions → Sets
- **Liftosaur API:** REST, bearer token auth, Liftoscript format for programs and history. Requires Liftosaur premium. Base URL: `https://www.liftosaur.com/api/v1`
- **Liftoscript parsing:** Need a parser for the Liftoscript workout format to extract structured data from history records and generate valid program updates. Use the open-source Liftosaur repo as reference.
- **Export format:** JSON (compatible with existing workouts.json structure); CSV; FIT (post-MVP)
- **FIT parsing:** Use an existing FIT SDK (official Garmin SDK or open-source equivalent) — do not hand-roll
- **Camera CV:** MediaPipe Pose (cross-platform, on-device) for rep counting (post-MVP)
- **Garmin BLE:** `react-native-ble-plx` on the app side; companion Connect IQ app in Monkey C on the watch (post-MVP)
- **API key storage:** `expo-secure-store` for Liftosaur API key (Keychain on iOS, Keystore on Android)
- **Key libraries:**
  - `expo-sqlite` — local database
  - `expo-secure-store` — secure key storage
  - `expo-file-system` — JSON/CSV import/export
  - `expo-haptics` — rest timer feedback
  - `react-native-ble-plx` — Garmin BLE (post-MVP)
  - `victory-native` or `react-native-gifted-charts` — progression charts
- **Auth:** None in v1 — local profile only

---

## 9. Metrics

- Session logging completion rate (started vs finished)
- Average time to log a set
- AI analysis usage rate
- Liftosaur sync usage rate (how many users connect and actively use two-way sync)
- Weekly active users
- Retention at 4 weeks and 12 weeks
- Import/export usage rate

---

## 10. Milestones

| Milestone | Scope |
|---|---|
| v0.1 MVP | Liftosaur import (history + program), session logging, targets, rest timer, local storage |
| v0.2 | Equipment profile, smart progression engine, Liftosaur write-back sync |
| v0.3 | Exercise history, progression charts, session dashboard, volume analytics |
| v0.4 | AI coaching integration |
| v0.5 | FIT import, JSON/CSV export, multi-day program support |
| v1.0 | Polish, offline reliability, stall detection, deload suggestions |
| v2.0 | Cloud sync, optional account, notifications, Apple Health / Google Fit write |
| v2.1 | Garmin BLE companion (Connect IQ watch app + real-time rep sync) |
| v2.2 | Camera-based rep counting (MediaPipe on-device CV) |
| v3.0 | FIT export, Strong/Hevy import, broader platform integrations, standalone program editor |

---

## 11. Open Questions

- Should the app support custom exercise creation or only a predefined library?
- How should band resistance be handled — approximate kg equivalent, or a separate light/medium/heavy/extra-heavy scale?
- Should warm-up sets be configurable per user preference or per exercise?
- What is the right default for AI analysis — opt-in per session or always shown?
- For Liftoscript parsing: build a custom parser, use the open-source Liftosaur repo as reference, or contribute a parser library upstream?
- When the app pushes updated Liftoscript back to Liftosaur, should it create a new program version or overwrite the current one? (Overwriting is simpler but loses history.)
- For Garmin BLE integration: should rep detection be purely additive (watch auto-fills, user confirms) or should the app prompt for correction after every set?
- For camera rep counting: should the phone need to be in a fixed position (e.g. propped up), or can it work hand-held / pocket? This affects which exercises it can realistically support.
- At what point does the app offer its own program editor and no longer need Liftosaur as the authoring tool?
