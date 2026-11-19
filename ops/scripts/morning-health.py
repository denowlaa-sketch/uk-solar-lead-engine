#!/usr/bin/env python3
"""Email a 6am UK solar CRM connection health check every morning."""
from __future__ import annotations

import importlib.util
import json
import os
import sqlite3
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
ENV_FILE = Path(os.environ.get("UK_SOLAR_ENV", "/opt/uk-solar-lead-engine/.env"))
DB_PATH = os.environ.get("UK_SOLAR_DB", "/var/lib/uk-solar/prod.db")


def _load_checks():
    path = HERE / "check-connections.py"
    spec = importlib.util.spec_from_file_location("uk_solar_check_connections", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def solar_counts(db: str) -> str:
    path = db.replace("file:", "")
    if not Path(path).exists():
        return "Lead database not found"
    try:
        conn = sqlite3.connect(path)
        total = conn.execute("SELECT COUNT(*) FROM Lead").fetchone()[0]
        fb = conn.execute("SELECT COUNT(*) FROM Lead WHERE source = 'FACEBOOK'").fetchone()[0]
        qualified = conn.execute(
            "SELECT COUNT(*) FROM Lead WHERE status IN ('QUALIFIED','PROPOSAL','NEGOTIATION','WON')"
        ).fetchone()[0]
        conn.close()
        return f"{fb} Facebook leads, {qualified} qualified, {total} total in CRM"
    except Exception as error:  # noqa: BLE001
        return f"Could not read CRM database ({error})"


def send_resend(api_key: str, from_addr: str, to_addr: str, subject: str, body: str) -> None:
    payload = json.dumps({"from": from_addr, "to": [to_addr], "subject": subject, "text": body}).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "uk-solar-morning-health/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"Resend {error.code}: {detail}") from error


def deliver(api_key: str, from_addr: str, owner: str, subject: str, body: str) -> str:
    """Owner inbox first; Resend test-mode only allows the account email until a domain is verified."""
    try:
        send_resend(api_key, from_addr, owner, subject, body)
        return owner
    except RuntimeError as error:
        if "403" not in str(error) or "testing emails" not in str(error).lower():
            raise
        fallback = "denowlaa@gmail.com"
        note = (
            f"Note: Resend is still on the test sender, so it cannot deliver to {owner} yet. "
            f"This copy went to {fallback}. Verify a domain at resend.com/domains to send to {owner}.\n\n"
        )
        send_resend(api_key, from_addr, fallback, subject, note + body)
        return fallback


def main() -> int:
    checks_mod = _load_checks()
    env = checks_mod.load_env(ENV_FILE)
    to_addr = env.get("OWNER_NOTIFY_EMAIL", "")
    api_key = env.get("RESEND_API_KEY", "")
    from_addr = env.get("EMAIL_FROM") or "UK Solar Lead Engine <onboarding@resend.dev>"
    if not to_addr or not api_key:
        print("OWNER_NOTIFY_EMAIL or RESEND_API_KEY missing")
        return 1

    now = datetime.now(ZoneInfo("Europe/London")).strftime("%A %-d %B %Y, %H:%M %Z")
    checks = checks_mod.collect_checks(env)
    failed = [(name, detail) for ok, name, detail in checks if not ok]
    lines = [f"[{'OK' if ok else 'FAIL'}] {name}: {detail}" for ok, name, detail in checks]

    db = env.get("DATABASE_URL", "").replace("file:", "") or DB_PATH
    public = (env.get("FACEBOOK_PUBLIC_BASE_URL") or "").rstrip("/")
    body = "\n".join(
        [
            f"Solar CRM morning health — {now}",
            "",
            f"{len(checks) - len(failed)}/{len(checks)} checks passed.",
            "",
            *lines,
            "",
            solar_counts(db),
            "",
            f"Solar CRM: {public}/facebook" if public else "Solar CRM: public URL missing",
            "",
            "This is an automated health email. No customer was contacted.",
        ]
    )
    subject = "Solar morning health: all OK" if not failed else f"ALERT solar morning health: {len(failed)} issue(s)"
    delivered_to = deliver(api_key, from_addr, to_addr, subject, body)
    print("sent", subject, "to", delivered_to)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
