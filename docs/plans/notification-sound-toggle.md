# Plan: Notification sound toggle

**Status:** Not started  
**Depends on:** rest-timer-notifications milestone (complete)

---

## Goal

Let users turn notification sound on or off from the Settings screen. Sound is off by default (preserving current behaviour). This also lays the groundwork for future user preferences.

---

## Out of scope

- Per-exercise or per-session sound settings
- Vibration toggle (separate concern)
- iOS-specific sound configuration (deferred with rest of iOS notification work)

---

## Android channel complication

Android locks a notification channel's sound setting at creation time — the OS ignores any subsequent changes. We cannot flip sound on the existing `rest-timer-expiry` channel. The solution is two channels:

| ID | Sound | Use |
|---|---|---|
| `rest-timer-expiry` | none | existing, no-sound path |
| `rest-timer-expiry-sound` | default system sound | new, sound-enabled path |

Both channels are registered at app init. Scheduling picks the right one based on the user's preference. Channel IDs are permanent once shipped — do not rename.

---

## Storage: preferences table (SQLite)

A single-row `preferences` table in the existing Drizzle DB. One row is always present (upserted on first write). New settings are added as columns + a migration. This keeps all persistence in one place and avoids introducing `AsyncStorage` as a second storage system.

Schema:
```ts
export const preferences = sqliteTable('preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  notificationSound: integer('notification_sound', { mode: 'boolean' }).notNull().default(false),
});
```

---

## Commits

**1. `preferences` table migration**  
Add the `preferences` table to `src/db/schema.ts` and a new migration entry. No logic yet — just schema. Tests: migration runs without error on a fresh DB and on a DB with existing data.

**2. `src/preferences.ts` — read/write preferences**  
Pure module exposing `getPreferences(db)` and `setNotificationSound(db, on)`. `getPreferences` returns the single preferences row, inserting a default row if none exists. Tests: default row is created on first read; write then read round-trips correctly.

**3. Add sound-enabled notification channel**  
In `setupNotificationChannel()`, register `rest-timer-expiry-sound` alongside the existing channel. Update `scheduleRestExpiredNotification` to accept a `sound: boolean` parameter and route to the appropriate channel ID. Update `setNotificationHandler` to set `shouldPlaySound` from the same value. Tests: sound `true` → `rest-timer-expiry-sound` channel + `shouldPlaySound: true`; sound `false` → existing channel + `shouldPlaySound: false`.

**4. Settings UI toggle**  
Add a "Notifications" section to `app/(tabs)/settings/index.tsx` with a `Switch` row labelled "Sound when rest is complete". Reads preference via `getPreferences` on focus; writes via `setNotificationSound` on toggle. No new screen needed.
