#!/usr/bin/env bash
# Push the seed database to a connected Android device/emulator.
# Usage: ./e2e/seed.sh [APP_ID]
# APP_ID defaults to the development variant.
set -euo pipefail
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"

APP_ID="${1:-com.mchoi.spuddy}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Pushing seed.db -> /data/data/$APP_ID/files/SQLite/spuddy.db"
adb push "$SCRIPT_DIR/seed.db" /data/local/tmp/spuddy-seed.db
adb root
adb shell "cp /data/local/tmp/spuddy-seed.db /data/data/$APP_ID/files/SQLite/spuddy.db && chmod 660 /data/data/$APP_ID/files/SQLite/spuddy.db"
adb shell rm /data/local/tmp/spuddy-seed.db
adb unroot
echo "Done."
