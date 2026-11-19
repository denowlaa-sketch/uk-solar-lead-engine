#!/usr/bin/env bash
# Keep a public HTTPS URL in front of the CRM and rewrite .env when it changes.
set -euo pipefail

BIN="${CLOUDFLARED_BIN:-/usr/local/bin/cloudflared}"
ENV_FILE="${UK_SOLAR_ENV:-/opt/uk-solar-lead-engine/.env}"
URL_FILE="${UK_SOLAR_URL_FILE:-/var/lib/uk-solar/public-url}"
mkdir -p "$(dirname "$URL_FILE")"

apply_url() {
  local url="$1"
  [[ -z "$url" ]] && return 0
  mkdir -p "$(dirname "$URL_FILE")"
  local prev=""
  [[ -f "$URL_FILE" ]] && prev="$(cat "$URL_FILE")"
  echo "$url" >"$URL_FILE"
  if [[ -f "$ENV_FILE" ]]; then
    if grep -q '^FACEBOOK_PUBLIC_BASE_URL=' "$ENV_FILE"; then
      sed -i "s|^FACEBOOK_PUBLIC_BASE_URL=.*|FACEBOOK_PUBLIC_BASE_URL=\"${url}\"|" "$ENV_FILE"
    else
      echo "FACEBOOK_PUBLIC_BASE_URL=\"${url}\"" >>"$ENV_FILE"
    fi
    if grep -q '^TWILIO_PUBLIC_BASE_URL=' "$ENV_FILE"; then
      sed -i "s|^TWILIO_PUBLIC_BASE_URL=.*|TWILIO_PUBLIC_BASE_URL=\"${url}\"|" "$ENV_FILE"
    else
      echo "TWILIO_PUBLIC_BASE_URL=\"${url}\"" >>"$ENV_FILE"
    fi
  fi
  if [[ "$prev" != "$url" ]] && command -v systemctl >/dev/null 2>&1; then
    systemctl try-restart uk-solar-crm.service >/dev/null 2>&1 || true
  fi
}

"$BIN" tunnel --url http://127.0.0.1:3000 --no-autoupdate 2>&1 | while IFS= read -r line; do
  echo "$line"
  url="$(printf '%s\n' "$line" | grep -oE 'https://[a-z0-9-]+\.trycloudflare.com' | head -1 || true)"
  if [[ -n "${url:-}" ]]; then
    apply_url "$url"
  fi
done
