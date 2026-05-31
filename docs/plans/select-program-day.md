# Plan: Select Program Day

**Status:** In progress  
**Milestone:** M2

## Goal

Let the user pick which program day to run before a session starts. Currently `log-session` silently falls back to `activeDayIndex` with no UI to change it.

## Design

Variant B: wrapping pill strip of day names + exercise preview panel below + sticky "Start [Day]" button. Pill style matches the ExerciseStrip in `log-session`. See mockup at `docs/mockups/select-day-variants.html`.

## Flow

```
"+" tab (app/(tabs)/add.tsx) → redirects to app/select-day.tsx
  → app/select-day.tsx
      - pills wrap (flexWrap), active pill = green border + text
      - "Next up" badge on activeDayIndex day
      - preview shows exercises + targets for selected day
      - "Start [Day Name]" → /log-session?programName=X&dayIndex=Y
          → (after finish) advance activeDayIndex in DB
```

## Assumptions

- Single program only (`programs[0]`). Multi-program selection is out of scope.
- No confirm step after tapping "Start" — navigates immediately.

## Commits (outside-in, atomic)

1. **Domain fn** — `nextActiveDayIndex(current, total): number` in `src/domain/programDay.ts` + unit tests
2. **Select-day screen** — `app/select-day.tsx` + `styles/select-day.styles.ts`
3. **Wire entry point** — register `select-day` in `app/_layout.tsx` (`headerShown: false`); "+" tab redirect (`app/(tabs)/add.tsx` → `router.replace('/select-day')`)
4. **Advance active day** — call `updateActiveDayIndex` in `log-session.tsx` `handleFinish` after save
