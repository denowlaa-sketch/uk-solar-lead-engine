# Always-on CRM (same idea as the forex bot)

The CRM must stay running so Facebook/Instagram Instant Forms can land even when Cursor is closed.

## Mac (now)

From the project folder:

```bash
chmod +x ops/macos/install-launch-agent.sh
./ops/macos/install-launch-agent.sh
```

That installs a Login LaunchAgent (`com.uksolar.leadengine`). It:

- Starts on login
- Restarts if the process dies
- Pulls Facebook leads every 5 minutes
- Uses `caffeinate -i` so idle sleep is less likely while the CRM is up

Open http://localhost:3000/facebook  
Health: http://localhost:3000/api/health  
Logs: `ops/logs/`

Laptop shutdown still stops it. For true 24/7 use a VPS, same as the trading bot.

## VPS (Hetzner / Ubuntu)

1. Create a small Ubuntu box (CX22 is enough).
2. Clone this repo to `/opt/uk-solar-lead-engine`.
3. Copy `.env` onto the server (never commit it).
4. `sudo bash ops/scripts/install-vps.sh /opt/uk-solar-lead-engine`
5. Point a **named** Cloudflare tunnel at `http://127.0.0.1:3000` (`ops/cloudflared/config.yml.example`).
6. Put that stable HTTPS origin in `.env` as `FACEBOOK_PUBLIC_BASE_URL` and `TWILIO_PUBLIC_BASE_URL`.
7. Update the Meta webhook callback to `https://YOUR-HOST/api/facebook/leadgen`.

`Restart=always` keeps the Node process up. The in-app watchdog keeps pulling Instant Form leads if Meta’s webhook misses one.

Every morning at 06:00 UK time, `uk-solar-health.timer` emails a solar CRM adapter/connection check to `OWNER_NOTIFY_EMAIL`. It covers CRM, HTTPS, Facebook Instant Forms, ads, Twilio, and Resend. The trading bot is not included. Failures use subject `ALERT solar morning health`.
