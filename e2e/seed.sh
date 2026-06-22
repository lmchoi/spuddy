#!/usr/bin/env bash
# Push the seed database to a connected Android device/emulator.
# Usage: ./e2e/seed.sh [APP_ID]
# APP_ID defaults to the development variant.
set -euo pipefail
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"

APP_ID="${1:-com.mchoi.spuddy}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Pushing seed.db -> /data/data/$APP_ID/files/SQLite/spuddy.db"
adb shell pm clear "$APP_ID"
adb push "$SCRIPT_DIR/seed.db" /data/local/tmp/spuddy-seed.db

if adb root 2>&1 | grep -q "cannot run as root"; then
  # Non-rootable emulator (Play Store image) — use run-as instead (requires debuggable build)
  adb shell "run-as $APP_ID sh -c 'mkdir -p files/SQLite && cp /data/local/tmp/spuddy-seed.db files/SQLite/spuddy.db && chmod 660 files/SQLite/spuddy.db'"
else
  # adb root restarts the daemon — wait for reconnect before issuing the next command
  adb wait-for-device
  # Files created by adb root are owned by root:root; the app user (other) can't read them.
  # Read the app's UID/GID from its data dir and chown the whole files/ subtree after copying.
  APP_UGID=$(adb shell stat -c '%u:%g' "/data/data/$APP_ID" 2>/dev/null | tr -d '\r\n')
  adb shell "mkdir -p /data/data/$APP_ID/files/SQLite && cp /data/local/tmp/spuddy-seed.db /data/data/$APP_ID/files/SQLite/spuddy.db && chown -R ${APP_UGID} /data/data/$APP_ID/files && chmod 660 /data/data/$APP_ID/files/SQLite/spuddy.db"
  adb unroot
fi

adb shell rm /data/local/tmp/spuddy-seed.db
echo "Done."
