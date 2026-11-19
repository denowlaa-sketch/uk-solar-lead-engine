#!/usr/bin/env bash
# Install a Login LaunchAgent so the CRM restarts like the forex practice bot.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LABEL="com.uksolar.leadengine"
SRC="$ROOT/ops/macos/${LABEL}.plist"
DEST="$HOME/Library/LaunchAgents/${LABEL}.plist"

mkdir -p "$HOME/Library/LaunchAgents" "$ROOT/ops/logs"
chmod +x "$ROOT/ops/scripts/run-crm.sh" "$ROOT/ops/scripts/watchdog-uk-solar.sh"

sed "s|ROOT_PLACEHOLDER|$ROOT|g" "$SRC" >"$DEST"

launchctl bootout "gui/$(id -u)/$LABEL" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$DEST"
launchctl enable "gui/$(id -u)/$LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Installed $DEST"
echo "CRM watchdog is running. Open http://localhost:3000/facebook"
echo "Logs: $ROOT/ops/logs/"
echo "Laptop sleep still stops it unless it stays awake (the process uses caffeinate -i)."
