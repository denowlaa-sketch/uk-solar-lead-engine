#!/usr/bin/env python3
"""Probe solar CRM connections. Prints status only — never prints secrets."""
from __future__ import annotations

import base64
import json
import os
import ssl
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENV_FILE = Path(os.environ.get("UK_SOLAR_ENV", "/opt/uk-solar-lead-engine/.env"))
ctx = ssl.create_default_context()
Check = tuple[bool, str, str]


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def get_json(url: str, timeout: float = 12.0, headers: dict[str, str] | None = None, as_text: bool = False):
    req = urllib.request.Request(url, headers={"User-Agent": "uk-solar-check/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            body = response.read().decode("utf-8", errors="replace")
            if as_text:
                return response.status, {"raw": body[:300]}, None
            try:
                return response.status, json.loads(body) if body else {}, None
            except json.JSONDecodeError:
                return response.status, {"raw": body[:300]}, None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:400]
        try:
            parsed = json.loads(detail)
        except json.JSONDecodeError:
            parsed = {"raw": detail}
        return error.code, parsed, None
    except Exception as error:  # noqa: BLE001
        return None, None, str(error)


def find_lead_gen_form_id(obj) -> str | None:
    if isinstance(obj, dict):
        if obj.get("lead_gen_form_id"):
            return str(obj["lead_gen_form_id"])
        for value in obj.values():
            found = find_lead_gen_form_id(value)
            if found:
                return found
    elif isinstance(obj, list):
        for value in obj:
            found = find_lead_gen_form_id(value)
            if found:
                return found
    return None


def graph_msg(payload: dict | None, err: str | None, status: int | None) -> str:
    if payload and isinstance(payload.get("error"), dict):
        return payload["error"].get("message") or str(payload["error"])
    return err or f"HTTP {status}"


def unit_active(name: str) -> str:
    try:
        return subprocess.check_output(["systemctl", "is-active", name], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return "unknown"


def collect_checks(env: dict[str, str] | None = None) -> list[Check]:
    env = env if env is not None else load_env(ENV_FILE)
    checks: list[Check] = []

    def add(ok: bool, name: str, detail: str) -> None:
        checks.append((ok, name, detail[:400]))

    for unit in ("uk-solar-crm", "uk-solar-tunnel", "uk-solar-health.timer"):
        state = unit_active(unit)
        add(state in {"active", "activating"}, f"systemd {unit}", state)

    status, health, err = get_json("http://127.0.0.1:3000/api/health")
    if status == 200 and (health or {}).get("ok"):
        fb = (health or {}).get("facebook") or {}
        detail = "ok"
        if fb.get("running"):
            detail += " · Meta pull running"
        if fb.get("lastPullAt"):
            detail += f" · last pull {fb['lastPullAt']}"
        last_err = str(fb.get("lastError") or "")
        if last_err and "80005" not in last_err:
            add(False, "CRM /api/health Meta pull", last_err[:280])
        else:
            if last_err:
                detail += " · Meta pull rate-limited (temporary)"
            add(True, "CRM /api/health", detail)
    else:
        add(False, "CRM /api/health", err or json.dumps(health)[:220])

    public = (env.get("FACEBOOK_PUBLIC_BASE_URL") or env.get("TWILIO_PUBLIC_BASE_URL") or "").rstrip("/")
    if public:
        status, body, err = get_json(f"{public}/api/health")
        add(status == 200 and (body or {}).get("ok"), "Public HTTPS health", err or f"HTTP {status}")
        verify = urllib.parse.quote(env.get("FACEBOOK_VERIFY_TOKEN") or "")
        status, body, err = get_json(
            f"{public}/api/facebook/leadgen?hub.mode=subscribe&hub.verify_token={verify}&hub.challenge=solar-ok",
            as_text=True,
        )
        raw = ((body or {}).get("raw") or "") if body else ""
        add(status == 200 and "solar-ok" in raw, "Facebook webhook verify", raw or err or f"HTTP {status}")
        status, _, err = get_json(f"{public}/privacy", as_text=True)
        add(status == 200, "Privacy policy HTTPS", err or f"HTTP {status}")
    else:
        add(False, "Public HTTPS URL", "FACEBOOK_PUBLIC_BASE_URL missing")

    token = env.get("FACEBOOK_PAGE_ACCESS_TOKEN") or ""
    if not token:
        add(False, "Facebook Page token", "missing")
    else:
        q = urllib.parse.quote(token)
        status, me, err = get_json(f"https://graph.facebook.com/v21.0/me?fields=id,name&access_token={q}")
        if status != 200 or not (me or {}).get("id"):
            add(False, "Facebook Graph /me", graph_msg(me, err, status))
        else:
            add(True, "Facebook Page", f"{me.get('name')} ({me.get('id')})")
            status, ads, err = get_json(
                "https://graph.facebook.com/v21.0/act_1878133263207457/ads"
                f"?fields=name,effective_status,creative&limit=5&access_token={q}"
            )
            if status == 200:
                data = (ads or {}).get("data") or []
                names = ", ".join(f"{a.get('name')}={a.get('effective_status')}" for a in data) or "no ads"
                live = any((a or {}).get("effective_status") == "ACTIVE" for a in data)
                add(live or bool(data), "Meta ads", names)
                creative_id = None
                for ad in data:
                    creative_id = ((ad or {}).get("creative") or {}).get("id")
                    if creative_id:
                        break
                if creative_id:
                    status, creative, err = get_json(
                        f"https://graph.facebook.com/v21.0/{creative_id}"
                        f"?fields=id,object_story_spec,asset_feed_spec&access_token={q}"
                    )
                    form_id = find_lead_gen_form_id(creative)
                    env_form = env.get("FACEBOOK_FORM_ID")
                    if form_id:
                        add(True, "Instant Form on ad", f"form {form_id} on creative {creative_id}")
                        if env_form and env_form != form_id:
                            add(False, "FACEBOOK_FORM_ID", f"env {env_form} != ad {form_id}")
                    else:
                        add(False, "Instant Form on ad", err or "ad creative has no lead_gen_form_id")
                else:
                    add(False, "Instant Form on ad", "no ad creative")
            else:
                add(False, "Meta ads", graph_msg(ads, err, status))

            status, insights, err = get_json(
                "https://graph.facebook.com/v21.0/act_1878133263207457/insights"
                f"?fields=impressions,spend,clicks&date_preset=today&access_token={q}"
            )
            if status == 200:
                row = ((insights or {}).get("data") or [{}])[0] if (insights or {}).get("data") else {}
                add(
                    True,
                    "Meta spend today",
                    f"impressions={row.get('impressions', '0')} spend=£{row.get('spend', '0')} clicks={row.get('clicks', '0')}",
                )
            else:
                add(False, "Meta spend today", graph_msg(insights, err, status))

            app_id = env.get("FACEBOOK_APP_ID")
            app_secret = env.get("FACEBOOK_APP_SECRET")
            if app_id and app_secret:
                app_token = f"{app_id}|{app_secret}"
                dq = urllib.parse.urlencode({"input_token": token, "access_token": app_token})
                status, info, err = get_json(f"https://graph.facebook.com/v21.0/debug_token?{dq}")
                data = ((info or {}).get("data") or {})
                if status == 200 and data:
                    add(data.get("is_valid") is True, "Page token validity", f"valid={data.get('is_valid')}")
                else:
                    add(False, "Page token validity", graph_msg(info, err, status))

    sid = env.get("TWILIO_ACCOUNT_SID") or ""
    twilio_token = env.get("TWILIO_AUTH_TOKEN") or ""
    from_number = env.get("TWILIO_PHONE_NUMBER") or ""
    if not sid or not twilio_token:
        add(False, "Twilio credentials", "SID or auth token missing")
    else:
        auth = base64.b64encode(f"{sid}:{twilio_token}".encode()).decode()
        headers = {"Authorization": f"Basic {auth}"}
        status, acct, err = get_json(f"https://api.twilio.com/2010-04-01/Accounts/{sid}.json", headers=headers)
        if status == 200:
            add(True, "Twilio account", f"status={(acct or {}).get('status')}")
        else:
            add(False, "Twilio account", err or ((acct or {}).get("message")) or f"HTTP {status}")
        if from_number:
            status, nums, err = get_json(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/IncomingPhoneNumbers.json?PhoneNumber={urllib.parse.quote(from_number)}",
                headers=headers,
            )
            incoming = ((nums or {}).get("incoming_phone_numbers") or [])
            if incoming:
                n = incoming[0]
                add(True, "Twilio number", f"{n.get('phone_number')} voice={(n.get('capabilities') or {}).get('voice')}")
            else:
                add(False, "Twilio number", err or f"{from_number} not on this account")

    dials = env.get("TWILIO_LIVE_DIALS") or "unset"
    if str(dials).lower() == "true":
        add(True, "TWILIO_LIVE_DIALS", "true")
    else:
        add(True, "TWILIO_LIVE_DIALS", f"{dials} (sandbox until you go live)")

    owner = env.get("OWNER_NOTIFY_EMAIL") or ""
    resend = env.get("RESEND_API_KEY") or ""
    add(bool(owner), "Owner notify email", owner or "missing")
    if not resend:
        add(False, "Resend", "RESEND_API_KEY missing")
    else:
        status, domains, err = get_json("https://api.resend.com/domains", headers={"Authorization": f"Bearer {resend}"})
        blob = json.dumps(domains or {}) + str(err or "")
        if status == 200:
            data = (domains or {}).get("data") or []
            names = ", ".join(f"{d.get('name')}[{d.get('status')}]" for d in data) or "onboarding@resend.dev"
            add(True, "Resend API", names)
        elif "restricted to only send" in blob.lower():
            add(True, "Resend API", "send-only key")
        else:
            add(False, "Resend API", err or ((domains or {}).get("message")) or f"HTTP {status}")

    ch_key = env.get("COMPANIES_HOUSE_API_KEY") or ""
    if ch_key:
        auth = base64.b64encode(f"{ch_key}:".encode()).decode()
        status, body, err = get_json(
            "https://api.company-information.service.gov.uk/search/companies?q=solar&items_per_page=1",
            headers={"Authorization": f"Basic {auth}"},
        )
        add(status == 200, "Companies House", err or f"HTTP {status}")
    else:
        add(True, "Companies House", "key not set (optional)")

    if env.get("GOOGLE_PLACES_API_KEY"):
        add(True, "Google Places", "key present")
    else:
        add(True, "Google Places", "not set — OSM fallback")

    if env.get("OPENAI_API_KEY"):
        add(True, "OpenAI call scoring", "key present")
    else:
        add(True, "OpenAI call scoring", "not set — scripted calls")

    return checks


def main() -> int:
    checks = collect_checks()
    failed = 0
    for ok, name, detail in checks:
        print(f"[{'OK' if ok else 'FAIL'}] {name}: {detail}")
        if not ok:
            failed += 1
    print("---")
    print("failures", failed)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
