#!/usr/bin/env bash
# Regenerate seed.db from a connected device that already has the correct
# program loaded (1 program, Push/Pull/Legs days).
#
# Steps:
#   1. Open the app and import a 3-day program via Settings > Paste workout notes
#   2. Confirm the program looks right in the app
#   3. Run this script
#
# Usage: ./e2e/create-seed.sh [APP_ID]
set -euo pipefail

APP_ID="${1:-com.mchoi.spuddy}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$SCRIPT_DIR/seed.db"

echo "Pulling database from $APP_ID..."
adb exec-out "run-as $APP_ID cat files/SQLite/spuddy.db" > "$OUT"

echo "Normalising to single 3-day program..."
sqlite3 "$OUT" "
BEGIN;
UPDATE programs SET name = 'My Program' WHERE id = 1;
UPDATE program_days SET program_id = 1, day_index = 1 WHERE id = 3;
UPDATE program_days SET program_id = 1, day_index = 2 WHERE id = 2;
DELETE FROM programs WHERE id IN (2, 3);
DELETE FROM sessions;
COMMIT;
"
echo "Saved to $OUT"
