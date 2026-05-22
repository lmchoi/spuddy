# Implementation Plan
## Workout Tracker — v0.1 MVP

This document is intended as a starting brief for Claude Code. Read the PRD alongside this.

---

## Goal for v0.1

A working Expo app on iOS that lets me:
1. Import my workout history and current program from Liftosaur
2. Log a session against today's program day
3. See a simple history list per exercise
4. Export session data as JSON (for pasting into Claude chat for AI analysis)

No charts, no progression engine, no AI in the app yet. Just solid data model and logging flow.

---

## Stack

- **Expo SDK 51+** with Expo Router (file-based navigation)
- **TypeScript** throughout
- **expo-sqlite** for local storage
- **Zustand** for app state management (lightweight, no boilerplate)
- **NativeWind** for styling (Tailwind classes in React Native)
- **expo-secure-store** for Liftosaur API key
- **expo-file-system + expo-sharing** for JSON export

Bootstrap command:
```bash
npx create-expo-app@latest workout-tracker --template tabs
cd workout-tracker
npx expo install expo-sqlite expo-secure-store expo-file-system expo-sharing expo-haptics
npx expo install zustand
npx expo install nativewind tailwindcss
```

---

## Data Model

Define these TypeScript types first — everything else depends on them.

```typescript
// Equipment
type DumbbellSet = { weightKg: number } // one dumbbell, pairs assumed
type Band = { name: string; approximateKg?: number }
type EquipmentProfile = {
  id: string
  name: string // e.g. "home"
  dumbbells: DumbbellSet[]
  bands: Band[]
  hasBarbell: boolean
  hasPullupBar: boolean
  hasCableMachine: boolean
  notes?: string
}

// Program
type ExerciseTarget = {
  sets: number
  repsMin: number
  repsMax: number
  weightKg: number
  restSeconds: number
}

type ProgramExercise = {
  id: string
  name: string
  muscleGroups: string[]
  target: ExerciseTarget
  equipmentType: 'dumbbell' | 'band' | 'bodyweight' | 'barbell' | 'cable' | 'other'
  notes?: string
}

type ProgramDay = {
  id: string
  name: string // e.g. "Day 1 — Lower"
  exercises: ProgramExercise[]
}

type Program = {
  id: string
  name: string
  days: ProgramDay[]
  source: 'liftosaur' | 'manual' | 'import'
  importedAt: string
}

// Sessions
type SetLog = {
  id: string
  setNumber: number
  reps: number
  weightKg: number
  isWarmup: boolean
  notes?: string
  timestamp: string
}

type ExerciseLog = {
  id: string
  exerciseId: string
  exerciseName: string
  target: ExerciseTarget
  sets: SetLog[]
}

type Session = {
  id: string
  programDayId: string
  programDayName: string
  startedAt: string
  endedAt?: string
  exercises: ExerciseLog[]
  source: 'manual' | 'liftosaur_import'
}
```

---

## Database Schema (expo-sqlite)

Four tables:

```sql
CREATE TABLE equipment_profiles (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL -- JSON blob of EquipmentProfile
);

CREATE TABLE programs (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL -- JSON blob of Program
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  program_day_id TEXT,
  program_day_name TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  source TEXT DEFAULT 'manual',
  data TEXT NOT NULL -- JSON blob of Session
);

CREATE TABLE set_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER,
  reps INTEGER,
  weight_kg REAL,
  is_warmup INTEGER DEFAULT 0,
  notes TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

Store the full JSON blob on the session row for easy export, and individual set_logs rows for querying history per exercise.

---

## Screen Structure (Expo Router)

```
app/
  _layout.tsx          # Root layout, tab bar
  (tabs)/
    index.tsx          # Today — current program day + log session
    history.tsx        # Exercise list → drill into per-exercise history
    settings.tsx       # Equipment profile, Liftosaur API key, export
  session/
    [id].tsx           # Active session logging screen
  exercise/
    [id].tsx           # Per-exercise history (list only in v0.1, charts in v0.2)
```

---

## Screens in Detail

### Today tab (`index.tsx`)
- Shows current program day name and exercise list with targets
- "Start Session" button → navigates to `/session/new`
- If a session is in progress, shows "Resume Session"
- If today's session is complete, shows summary stats

### Active Session (`/session/[id]`)
- Exercise list on left/top, current exercise expanded
- Per set: reps input + weight input + "Log Set" button
- After logging: rest timer starts (configurable seconds), haptic on completion
- Set rows show: on-target ✓ / exceeded ↑ / below ✗ based on target reps
- "End Session" button → saves session, returns to Today tab
- Previous session's weights shown as default input values

### History tab
- Flat list of exercises (grouped by muscle group)
- Each row: exercise name, last session date, last weight
- Tap → `/exercise/[id]`

### Exercise History (`/exercise/[id]`)
- List of all sessions for this exercise, newest first
- Each row: date, sets × reps @ weight, on-target indicator
- v0.1: list only. v0.2: add charts above the list

### Settings tab
- **Equipment Profile** — list dumbbells (add/remove weights), toggle bands/barbell/pullup bar
- **Liftosaur** — enter API key, "Import program + history" button, last sync date
- **Export** — "Export all sessions as JSON" → shares file via iOS share sheet

---

## Liftosaur Import

On "Import program + history":

1. `GET /api/v1/programs/current` — parse Liftoscript text into Program type
2. `GET /api/v1/history?limit=200` — paginate until `hasMore: false`
3. Parse each history record's `text` field (Liftoscript Workout format) into Session type
4. Upsert into local DB — don't duplicate on re-import (use Liftosaur record ID as key)
5. Show progress indicator; surface errors if parse fails

**Liftoscript parsing notes:**
The history record text format looks like:
```
2026-03-01T10:00:00Z / program: "5/3/1" / dayName: "Squat Day" / week: 1 / dayInWeek: 1 / duration: 3600s / exercises: {
  Squat, Barbell / 3x5 185lb / warmup: 1x5 95lb, 1x3 135lb / target: 3x5 185lb 120s
  Leg Press / 3x10 200lb / target: 3x10 200lb 90s
}
```
Write a simple line-by-line parser — no need for a full grammar. Extract: date, duration, exercise name, sets×reps, weight, warmup sets, target.

---

## JSON Export Format

When user taps "Export", generate and share this structure:

```json
{
  "exportedAt": "2026-05-22T10:00:00Z",
  "appVersion": "0.1.0",
  "equipmentProfile": { ... },
  "sessions": [
    {
      "id": "...",
      "date": "2026-05-20",
      "programDay": "Day 1 — Lower",
      "durationMinutes": 52,
      "exercises": [
        {
          "name": "Romanian Deadlift",
          "muscleGroups": ["hamstrings", "glutes"],
          "target": { "sets": 3, "repsMin": 10, "repsMax": 12, "weightKg": 24 },
          "sets": [
            { "setNumber": 1, "reps": 12, "weightKg": 24, "isWarmup": false },
            { "setNumber": 2, "reps": 11, "weightKg": 24, "isWarmup": false },
            { "setNumber": 3, "reps": 10, "weightKg": 24, "isWarmup": false }
          ]
        }
      ]
    }
  ]
}
```

This is the format the user pastes into Claude chat for AI analysis.

---

## AI Coaching Prompt (paste into Claude)

Include this as a copyable template in the Settings screen:

```
You are a strength training coach helping me analyse my workout and suggest progressions.

My goals: building strength, improving posture, sport performance for basketball and snowboarding.
My level: beginner to intermediate.
My available equipment: [USER FILLS IN FROM THEIR PROFILE]

Here is my recent workout history as JSON:
[PASTE EXPORT HERE]

Please:
1. Summarise how this session went — what I hit, what I missed
2. Identify any trends across recent sessions (improving, stalling, regressing)
3. Suggest next session targets for each exercise, using only weights available in my equipment profile
4. Flag anything that looks like it needs a deload or variation change
5. Keep it plain language, no jargon
```

---

## What to Build First (order matters)

1. Expo scaffold + navigation structure
2. TypeScript types and DB schema
3. Settings screen — equipment profile (local only, no Liftosaur yet)
4. Liftosaur import — get real data into the app early, everything else is more motivating with real data
5. History tab — list view, proves data is in DB correctly
6. Today tab — program day display
7. Active session screen — the core logging flow
8. Rest timer + haptics
9. JSON export

---

## Out of Scope for v0.1

- Charts (v0.2)
- Progression engine (v0.2)
- Liftosaur write-back (v0.2)
- AI in the app (v0.3+)
- Garmin / camera (v2+)

---

## Notes for Claude Code

- Use TypeScript strict mode throughout
- Prefer functional components and hooks
- Use Zustand for session state (active session in progress) and DB reads; write directly to SQLite on mutations
- Don't over-engineer the Liftoscript parser — a pragmatic line-by-line approach is fine for v0.1; it can be hardened later
- The JSON export format above is fixed — future AI prompts depend on it being stable
- Test on iOS simulator and physical device via Expo Go throughout
