# Technical Notes
## Extracted from PRD — unreviewed, for reference when writing impl plans

---

## Data Model (draft)

```typescript
type PlateSet = {
  weightKg: number
  count: number
}

type EquipmentProfile = {
  id: string
  name: string
  dumbbell: {
    handleBaseKg: number       // weight of one handle/bar
    plates: PlateSet[]         // available plates (pairs assumed); app derives achievable weights
  } | null
  barbell: {
    barWeightKg: number        // typically 20kg
    plates: PlateSet[]         // available plates (pairs); app derives achievable loads
  } | null
  bands: string[]              // e.g. ["light", "medium", "heavy"]
  hasPullupBar: boolean
  hasBench: boolean
  notes?: string
}

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
  name: string
  exercises: ProgramExercise[]
}

type Program = {
  id: string
  name: string
  days: ProgramDay[]
  source: 'liftosaur_import' | 'manual' | 'file_import'
  importedAt: string
}

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

## Screen Structure (draft)

```
app/
  _layout.tsx             # Root layout, tab bar
  (tabs)/
    index.tsx             # Today — current program day + start/resume session
    history.tsx           # Exercise list → per-exercise history
    settings.tsx          # Equipment profile, import, export, AI prompt
  session/
    [id].tsx              # Active session logging screen
  exercise/
    [id].tsx              # Per-exercise history (list v0.1, charts v0.2)
```

---

## Stack Candidates

- **Expo SDK 51+** with Expo Router (file-based navigation)
- **TypeScript** throughout
- **expo-sqlite** for local storage
- **Zustand** for app state
- **NativeWind** for styling (Tailwind classes in React Native)
- **expo-secure-store** for future API keys
- **expo-file-system + expo-sharing** for JSON export
- **expo-haptics** for rest timer
- **victory-native** or **react-native-gifted-charts** for charts (v0.2+, evaluate when needed)
- **react-native-ble-plx** for Garmin BLE (post-MVP)
- FIT SDK for FIT parsing (post-MVP, don't hand-roll)
- MediaPipe Pose for camera CV (post-MVP)

---

## JSON Export Format (draft — stable, AI prompts depend on this)

```json
{
  "exportedAt": "2026-05-22T10:00:00Z",
  "appVersion": "0.1.0",
  "equipmentProfile": {
    "dumbbell": {
      "handleBaseKg": 2,
      "plates": [
        { "weightKg": 1.25, "count": 8 },
        { "weightKg": 2.5, "count": 4 },
        { "weightKg": 5, "count": 4 }
      ]
    },
    "barbell": null,
    "bands": ["light", "medium", "heavy"],
    "hasPullupBar": true,
    "hasBench": true
  },
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

---

## AI Coaching Prompt Template

Copyable template for Settings screen. User fills in `[PASTE EXPORT HERE]`.

```
You are a strength training coach helping me analyse my workout and suggest progressions.

My goals: building strength, improving posture, sport performance for basketball and snowboarding.
My level: beginner to intermediate.
My available equipment is in the equipmentProfile field of the JSON below.

Here is my recent workout history:
[PASTE EXPORT HERE]

Please:
1. Summarise how this session went — what I hit, what I missed
2. Identify trends across recent sessions (improving, stalling, regressing)
3. Suggest next session targets for each exercise, using only weights in my equipment profile
4. Flag anything that looks like it needs a deload or variation change
5. Keep it plain language, no jargon
```
