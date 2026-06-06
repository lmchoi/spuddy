# Plan: Progress tab — Streak Hero + Pill tab bar

**Milestone:** v0.1 polish (replaces existing `app/(tabs)/progress/index.tsx`
list view and the colour palette in `app/(tabs)/_layout.tsx`)
**Status:** In Progress (PR #4 open)

## What we're building

The Progress tab becomes the most rewarding screen in the app. The user
opens it and gets a one-glance answer to "how am I doing?" — streak,
on-target %, last PR — followed by the activity strip and a compact
session list.

The tab bar across the whole app moves to a floating pill: warm palette,
active-tab pill behind the icon, `+` button as the prominent green dot.

See [`../decisions/0003-progress-streak-hero.md`](../decisions/0003-progress-streak-hero.md)
for why this layout over Warm Stack, Calendar, and Matrix.

## Vertical-slice approach

### Slice 1 — Tab bar swap ✓ done

Replace the `Tabs` styling in `app/(tabs)/_layout.tsx`:

- `tabBarBackground` becomes a custom React component rendering the
  floating pill — see `tabbar.jsx` `TabBarPill` in the design bundle
- Use Expo Router's `Tabs.Screen` slots; render the icon and label inside
  the custom `tabBarButton` so we can paint our own pill background
- Replace the colour constants in `_layout.tsx`:
  - `TAB_BG #08080E` → `#181109`
  - `TAB_ACTIVE #39FF82` → `#B7D26A`
  - `TAB_INACTIVE #5C5C88` → `#A89175`
  - `ADD_COLOR #39FF82` → `#B7D26A`
- Add `safeAreaInsets` handling for Android — the pill sits 12 px above
  the gesture pill

### Slice 2 — Visual rebuild of the Progress page ✓ done (PR #4)

Replace `progress/index.tsx`'s body with the Streak Hero layout. Uses
only existing storage (`getAllSessions`) — every value in the hero is
derived from the session list:

- **Streak**: `getCurrentStreak(dates, today)` in `src/domain/streak.ts`. Pure, TDD.
- **Longest streak**: `getLongestStreak(dates)`. Same module.
- **Sessions**: `withinWindow(sessions).length` — rolling 30-day window (constant `WINDOW_DAYS`).
  Note: the list below shows all sessions; the stat counts only the window.
  Label says "sessions" without a qualifier — an open UX question (see below).
- **On target %**: `computeStats` aggregated over the 30-day window.
- **Last PR**: deferred ("—") until PR detection lands (bento slice 4).

Date handling: all session date comparisons use `localDateStr()` (local
wall-clock YYYY-MM-DD). `toISOString()` was never used — it returns UTC
and would mis-date sessions for users in UTC-negative timezones.

Extracted components: `SessionRow`, `ActivityStrip`, `HeroStat` →
`components/spuddy/` for reuse in the upcoming Bento detail screen.

### Slice 3 — Hero customisation (deferred)

User picks 1–3 stats to show in the hero from a known catalogue. Settings
panel surfaces the choice; the hero reads from `AsyncStorage`.

**Defer until** at least one user explicitly says the default trio doesn't
fit them. Not before.

### Slice 4 (future direction) — Cycle pattern overlay

Calendar variant with opt-in cycle-phase background tint per day.

- The app **does not call out the pattern** and **does not prescribe** sessions
- Cycle data is **opt-in**, **local only**, never exported without explicit opt-in
- Source: user input → Apple Health / Health Connect → none

See the full framing in the design handoff plan.

## Out of scope

- Per-exercise progression charts (PRD §7.4 v0.2)
- Volume by muscle group (PRD §7.4 v0.2)
- Search across sessions

## Open questions

- **"sessions" label**: stat counts 30-day window; list shows all sessions.
  Should the tile say "30d sessions" or "this month" to set expectations?
  Current lean: leave unlabelled until a user is confused.
- **Broken-streak display**: when streak breaks, show the number faded with a
  friendly fallback subtitle, or replace entirely? Not yet decided.
- **Streak scope**: should cardio/mobility sessions count once those are
  importable? Lean: yes — streak is *training*, not strength-only.
