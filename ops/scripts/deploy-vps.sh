#!/usr/bin/env bash
# Deploy this CRM onto the existing Hetzner practice VPS (same box as the forex bot).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${UK_SOLAR_VPS_HOST:-162.55.48.215}"
KEY="${UK_SOLAR_VPS_KEY:-$HOME/.ssh/forex-vps-deploy}"
SSH=(ssh -i "$KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new "root@$HOST")
REMOTE_ROOT=/opt/uk-solar-lead-engine

echo "Packing CRM…"
TAR="$(mktemp /tmp/uk-solar-crm.XXXXXX.tgz)"
tar -C "$ROOT" -czf "$TAR" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=ops/logs \
  --exclude=ops/bin \
  --exclude=friends-test-audience.csv \
  --exclude=.git \
  .

echo "Copying to $HOST…"
scp -i "$KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$TAR" "root@$HOST:/tmp/uk-solar-crm.tgz"
rm -f "$TAR"

echo "Installing on VPS…"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y -qq git ca-certificates curl
id uksolar >/dev/null 2>&1 || useradd --system --home /opt/uk-solar-lead-engine --shell /usr/sbin/nologin uksolar
mkdir -p /opt/uk-solar-lead-engine /var/lib/uk-solar
tar -xzf /tmp/uk-solar-crm.tgz -C /opt/uk-solar-lead-engine
rm -f /tmp/uk-solar-crm.tgz
if [[ ! -x /usr/local/bin/cloudflared ]]; then
  curl -fsSL -o /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x /usr/local/bin/cloudflared
fi
chmod +x /opt/uk-solar-lead-engine/ops/scripts/*.sh
install -m 644 /opt/uk-solar-lead-engine/ops/systemd/uk-solar-crm.service /etc/systemd/system/uk-solar-crm.service
install -m 644 /opt/uk-solar-lead-engine/ops/systemd/uk-solar-tunnel.service /etc/systemd/system/uk-solar-tunnel.service
install -m 644 /opt/uk-solar-lead-engine/ops/systemd/uk-solar-health.service /etc/systemd/system/uk-solar-health.service
install -m 644 /opt/uk-solar-lead-engine/ops/systemd/uk-solar-health.timer /etc/systemd/system/uk-solar-health.timer
REMOTE

echo "Uploading .env and database…"
python3 - <<PY
from pathlib import Path
src = Path("$ROOT") / ".env"
text = src.read_text()
lines = []
for line in text.splitlines(True):
    if line.startswith("DATABASE_URL="):
        lines.append('DATABASE_URL="file:/var/lib/uk-solar/prod.db"\n')
    else:
        lines.append(line)
Path("/tmp/uk-solar.env").write_text("".join(lines))
print("env_ready")
PY
scp -i "$KEY" -o BatchMode=yes /tmp/uk-solar.env "root@$HOST:/opt/uk-solar-lead-engine/.env"
rm -f /tmp/uk-solar.env
if [[ -f "$ROOT/prisma/dev.db" ]]; then
  scp -i "$KEY" -o BatchMode=yes "$ROOT/prisma/dev.db" "root@$HOST:/var/lib/uk-solar/prod.db"
fi

echo "Building and starting services…"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/uk-solar-lead-engine
chown -R uksolar:uksolar /opt/uk-solar-lead-engine /var/lib/uk-solar
chmod 600 /opt/uk-solar-lead-engine/.env
sudo -u uksolar bash -lc 'cd /opt/uk-solar-lead-engine && npm ci && npx prisma generate && npx prisma db push && npm run build'
systemctl daemon-reload
systemctl enable uk-solar-crm uk-solar-tunnel uk-solar-health.timer
systemctl start uk-solar-health.timer
systemctl restart uk-solar-crm
sleep 2
systemctl restart uk-solar-tunnel
systemctl --no-pager --full status uk-solar-crm --lines=20
curl -sf --max-time 8 http://127.0.0.1:3000/api/health
echo
REMOTE

echo "Waiting for public HTTPS URL…"
for i in $(seq 1 24); do
  url="$("${SSH[@]}" cat /var/lib/uk-solar/public-url 2>/dev/null || true)"
  if [[ "$url" == https://* ]]; then
    echo "Public URL: $url"
    "${SSH[@]}" curl -sf --max-time 15 "$url/api/health" && echo
    exit 0
  fi
  sleep 5
done
echo "Tunnel URL not ready yet. Check: journalctl -u uk-solar-tunnel -n 50"
exit 1
