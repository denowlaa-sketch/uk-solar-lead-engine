#!/usr/bin/env python3
"""Connect Meta app webhook + Twilio number URLs to the current public CRM URL."""
from __future__ import annotations

import json
import os
import ssl
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ENV_FILE = Path(os.environ.get("UK_SOLAR_ENV", "/opt/uk-solar-lead-engine/.env"))
APP_ID_DEFAULT = "1173344460347619"
ctx = ssl.create_default_context()


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def upsert_env(path: Path, key: str, value: str) -> None:
    lines = path.read_text().splitlines()
    found = False
    out = []
    for line in lines:
        if line.startswith(f"{key}="):
            out.append(f"{key}={value}")
            found = True
        else:
            out.append(line)
    if not found:
        out.append(f"{key}={value}")
    path.write_text("\n".join(out) + "\n")


def request(url: str, method: str = "GET", data: dict | None = None, headers: dict | None = None, form: bool = False):
    body = None
    hdrs = {"User-Agent": "uk-solar-repair/1.0", **(headers or {})}
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            hdrs["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, method=method, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as response:
            raw = response.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"raw": raw[:300]}
            return response.status, parsed
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw[:300]}
        return error.code, parsed


def err_msg(payload: dict) -> str:
    if "error" in payload and isinstance(payload["error"], dict):
        return payload["error"].get("message") or str(payload["error"])
    return json.dumps(payload)[:240]


def main() -> int:
    env = load_env(ENV_FILE)
    app_id = env.get("FACEBOOK_APP_ID") or APP_ID_DEFAULT
    if not env.get("FACEBOOK_APP_ID"):
        upsert_env(ENV_FILE, "FACEBOOK_APP_ID", app_id)
        print("set FACEBOOK_APP_ID")
    app_secret = env.get("FACEBOOK_APP_SECRET") or ""
    page_token = env.get("FACEBOOK_PAGE_ACCESS_TOKEN") or ""
    verify = env.get("FACEBOOK_VERIFY_TOKEN") or "solar-lead-verify"
    public = (env.get("FACEBOOK_PUBLIC_BASE_URL") or "").rstrip("/")
    callback = f"{public}/api/facebook/leadgen"
    app_token = f"{app_id}|{app_secret}" if app_secret else ""

    print("callback", callback)

    if app_token:
        status, info = request(
            "https://graph.facebook.com/v21.0/debug_token?"
            + urllib.parse.urlencode({"input_token": page_token, "access_token": app_token})
        )
        data = info.get("data") or {}
        print(
            "token_debug",
            status,
            "valid=",
            data.get("is_valid"),
            "type=",
            data.get("type"),
            "expires_at=",
            data.get("expires_at"),
            "scopes=",
            ",".join(data.get("scopes") or [])[:220],
            "error=",
            err_msg(info) if status != 200 else "",
        )

        status, sub = request(
            f"https://graph.facebook.com/v21.0/{app_id}/subscriptions",
            method="POST",
            data={
                "object": "page",
                "callback_url": callback,
                "fields": "leadgen",
                "verify_token": verify,
                "access_token": app_token,
            },
            form=True,
        )
        print("app_subscriptions", status, sub if status == 200 else err_msg(sub))

        status, listed = request(
            f"https://graph.facebook.com/v21.0/{app_id}/subscriptions?"
            + urllib.parse.urlencode({"access_token": app_token})
        )
        print("app_subscriptions_list", status, listed if status == 200 else err_msg(listed))

    status, me = request(
        "https://graph.facebook.com/v21.0/me?fields=id,name&access_token=" + urllib.parse.quote(page_token)
    )
    page_id = (me or {}).get("id")
    print("page", status, (me or {}).get("name"), page_id)
    if page_id:
        status, subp = request(
            f"https://graph.facebook.com/v21.0/{page_id}/subscribed_apps",
            method="POST",
            data={"subscribed_fields": "leadgen", "access_token": page_token},
            form=True,
        )
        print("page_subscribed_apps", status, subp if status == 200 else err_msg(subp))

    # Twilio number voice URL
    sid = env.get("TWILIO_ACCOUNT_SID") or ""
    twilio_token = env.get("TWILIO_AUTH_TOKEN") or ""
    from_number = env.get("TWILIO_PHONE_NUMBER") or ""
    if sid and twilio_token and from_number:
        import base64

        auth = base64.b64encode(f"{sid}:{twilio_token}".encode()).decode()
        headers = {"Authorization": f"Basic {auth}"}
        status, nums = request(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}/IncomingPhoneNumbers.json?PhoneNumber="
            + urllib.parse.quote(from_number),
            headers=headers,
        )
        numbers = (nums or {}).get("incoming_phone_numbers") or []
        if numbers:
            n = numbers[0]
            print(
                "twilio_number_urls",
                "voice=",
                n.get("voice_url"),
                "sms=",
                n.get("sms_url"),
                "status=",
                n.get("status_callback"),
            )
        else:
            print("twilio_number_urls FAIL number not found")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
