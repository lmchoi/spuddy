# Plan: Data Export — SQLite file (iteration 1)

## Goal

Let users back up everything in the app by exporting the raw `spuddy.db` file via the system share sheet. Targets internal testers. A future iteration will add a structured JSON dump.

## Background

- DB: `expo-sqlite` opens `spuddy.db` in the app document directory
- Five tables: `exercises`, `sessions`, `programs`, `program_days`, `program_exercises`
- Settings screen already has a "Data" section (`app/(tabs)/settings/index.tsx`) — export row slots in alongside the existing import rows

## Out of scope (iteration 2)

- JSON dump
- CSV / SQL dump
- Import from a backup file

---

## Steps

### Step 1 — Domain function: `exportDatabase` ✅

File: `src/domain/export.ts`

Pure async function (no React). Steps:
1. Run `PRAGMA wal_checkpoint(FULL)` on the open DB to flush the WAL before copying.
2. Resolve the source path via `(db as any).$client.databasePath` (normalised to a `file://` URI). **Deviation from plan:** original plan used `${FileSystem.documentDirectory}SQLite/spuddy.db` but this path is wrong in Expo Go and any scoped build. See ADR 017.
3. Copy to a temp path: `${FileSystem.cacheDirectory}spuddy-backup-<ISO-date>.db`
4. Return the temp path.

Import from `expo-file-system/legacy` (SDK 56 moved legacy APIs to this subpath). See ADR 017.

Tests: mock `FileSystem.copyAsync` and the DB `run`; assert checkpoint is called first and the returned path contains the date.

### Step 2 — Hook: `useExportDatabase` ✅

File: `src/hooks/useExportDatabase.ts`

Thin wiring hook. Calls `exportDatabase`, then `Sharing.shareAsync(path, { mimeType: 'application/x-sqlite3', dialogTitle: 'Back up Spuddy data' })`. Manages `exporting` boolean state and surfaces an error string if something goes wrong.

No domain logic here — just connects the domain function to React state and the sharing API.

### Step 3 — Settings UI row ✅

File: `app/(tabs)/settings/index.tsx`

Add a "Back up data" row to the existing "Data" section (above the import rows). Mirrors the style of existing `dataRow` rows. Disabled + shows "Backing up…" label while `exporting` is true.

No new styles needed — reuse `dataRow`, `dataRowPressed`, `dataRowDisabled`, `dataRowText`, `dataRowTextDisabled`, `dataRowChevron`.

### Step 4 — Verify on device ✅

Boot the app, tap "Back up data", confirm the share sheet appears with a `.db` file. Open the file in DB Browser for SQLite (or similar) and verify all five tables and their data are present.

---

## Commit breakdown

1. `feat(export): domain function to checkpoint and copy database file` — `src/domain/export.ts` + tests
2. `feat(export): hook to share exported database file` — `src/hooks/useExportDatabase.ts`
3. `feat(export): Back up data row in Settings` — settings screen change

---

## Dependencies

- `expo-file-system` — already in use (import screen uses it)
- `expo-sharing` — check if already installed; add if not
