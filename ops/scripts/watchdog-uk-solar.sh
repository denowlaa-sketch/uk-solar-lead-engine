#!/usr/bin/env bash
# Same idea as the forex watchdog: if the CRM dies, start it again.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:${PATH:-}"
LOG="$ROOT/ops/logs"
mkdir -p "$LOG"

# Hold idle-sleep while this watcher is alive (lid-close can still sleep the Mac).
if command -v caffeinate >/dev/null 2>&1; then
  caffeinate -i -w $$ >/dev/null 2>&1 &
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) watchdog start" >>"$LOG/watchdog.log"

while true; do
  if curl -sf --max-time 3 "http://127.0.0.1:${PORT:-3000}/api/health" >/dev/null 2>&1; then
    sleep 20
    continue
  fi

  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) CRM down — starting" >>"$LOG/watchdog.log"
  bash "$ROOT/ops/scripts/run-crm.sh" >>"$LOG/crm.log" 2>&1 || true
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) CRM exited — retry in 5s" >>"$LOG/watchdog.log"
  sleep 5
done
