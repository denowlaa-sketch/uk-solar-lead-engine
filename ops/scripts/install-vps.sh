#!/usr/bin/env bash
# Bootstrap on Ubuntu (same pattern as the forex VPS install).
set -euo pipefail

ROOT="${1:-/opt/uk-solar-lead-engine}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: bash ops/scripts/install-vps.sh /opt/uk-solar-lead-engine"
  exit 1
fi

id uksolar >/dev/null 2>&1 || useradd --system --home "$ROOT" --shell /usr/sbin/nologin uksolar

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git

mkdir -p "$ROOT" /var/lib/uk-solar
if [[ ! -d "$ROOT/.git" ]]; then
  echo "Clone the repo into $ROOT first."
  exit 1
fi

cd "$ROOT"
npm ci
npx prisma generate
npx prisma db push
npm run build

install -m 644 "$ROOT/ops/systemd/uk-solar-crm.service" /etc/systemd/system/uk-solar-crm.service
install -m 644 "$ROOT/ops/systemd/uk-solar-health.service" /etc/systemd/system/uk-solar-health.service
install -m 644 "$ROOT/ops/systemd/uk-solar-health.timer" /etc/systemd/system/uk-solar-health.timer
chown -R uksolar:uksolar "$ROOT" /var/lib/uk-solar
systemctl daemon-reload
systemctl enable uk-solar-crm uk-solar-health.timer
systemctl restart uk-solar-crm
systemctl start uk-solar-health.timer
systemctl --no-pager --full status uk-solar-crm
curl -sf http://127.0.0.1:3000/api/health && echo
