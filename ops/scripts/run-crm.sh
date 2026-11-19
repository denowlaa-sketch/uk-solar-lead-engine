#!/usr/bin/env bash
# Start the CRM in production and keep the Mac from idle-sleeping while it runs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

NVM_BIN=""
if [[ -d "${HOME}/.nvm/versions/node" ]]; then
  NVM_BIN="${HOME}/.nvm/versions/node/$(ls "${HOME}/.nvm/versions/node" 2>/dev/null | tail -1)/bin"
fi
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:${NVM_BIN}:${PATH:-}"
export NODE_ENV=production
export PORT="${PORT:-3000}"
# Next.js uses HOSTNAME as the listen address. Do not inherit the Mac hostname.
export HOSTNAME="${BIND_HOST:-0.0.0.0}"

mkdir -p "$ROOT/ops/logs"

if [[ ! -f "$ROOT/.next/BUILD_ID" ]]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) building CRM" | tee -a "$ROOT/ops/logs/watchdog.log"
  npm run build
fi

npx prisma generate >/dev/null

if command -v caffeinate >/dev/null 2>&1; then
  exec caffeinate -i npx next start -H "$HOSTNAME" -p "$PORT"
fi

exec npx next start -H "$HOSTNAME" -p "$PORT"
