# UK Solar Lead Engine

An AI-powered UK solar lead generation and sales automation platform.

**Current:** Facebook Instant Form leads land in the CRM, are scored, can be qualified on a sandbox or live Twilio call, and can email you (not the customer) when QUALIFIED.

## Features

### Facebook inbound
- Instant Form webhook `GET/POST /api/facebook/leadgen`
- Local test form at `/facebook` (no Meta account required)
- Stores name, phone, email, postcode, homeowner, bill band, roof, timeline, **call consent**
- Residential qualifier (`residential-1.0`)
- Sandbox call queue (`/facebook`) for consented leads; script can mark QUALIFIED
- Auto Twilio call after ingest when `TWILIO_LIVE_DIALS=true` and consent is stored
- Owner email via Resend when `OWNER_NOTIFY_EMAIL` and `RESEND_API_KEY` are set (customer is never emailed)
- Live Twilio keypad bot (consent required)

### Lead Management
- **Companies** — website, location, industry, roof size, energy bills, annual kWh (with verified/estimated/unknown source)
- **Contacts** — full contact details linked to companies
- **Leads** — pipeline status, score, category, qualification, solar suitability, notes

### AI Scoring Engine
- Scores leads **0–100** based only on **known data**
- Explains each scoring factor with point impact
- Lists **unknown fields separately** — never guesses missing facts
- Applies a data-confidence penalty when key fields are missing
- Auto-assigns:
  - **Category**: A (80+), B (60–79), C (40–59), D (0–39)
  - **Qualification**: Excellent, Good Prospect, Moderate, Poor, Unqualified
  - **Solar Suitability**: High, Medium, Low, Unknown

### Research Pipeline
Modular pipeline (`src/lib/analysis/`), version **2.0**:

1. **Collect facts** — load company, contact, and lead data from the database
2. **Enrich** — UK postcode irradiance lookup; roof-based kW estimate only when roof size is known and kW is missing
3. **Score** — rule-based engine with reasons and unknown-field list (includes regional irradiance)
4. **Persist** — store a full `LeadAnalysis` record and update the lead

Run analysis per-lead or bulk-analyse all from the dashboard.

### AI Discovery
The **Discovery** page can:

1. **Scan Companies House** (official REST API) for active UK `ltd`/`plc` companies matching an ICP SIC segment and location
2. **Places lookup** for website and phone (postcode must match)
3. Write rows into `DiscoveryProspect` with company number, address, SIC, director name if present, and Places fields when found
4. Preview-score each row with the existing enrich + score pipeline
5. Import on click → company, contact, lead (`AI_DISCOVERY`) → Places fill-in if still missing → `runLeadAnalysis()`

Roof size, energy bills, and emails stay **unknown** unless a later licensed source provides them. Officer residential addresses are not stored. Duplicate company numbers are skipped.

### Places providers
| Provider | Cost | When used |
| --- | --- | --- |
| **OpenStreetMap Nominatim** | Free (ODbL, 1 req/s, identify User-Agent) | Default |
| **Google Places** | Paid (often $200/month Maps credit) | If `GOOGLE_PLACES_API_KEY` is set |

Nominatim coverage for UK industrial websites/phones is sparse. Google Places is the usual upgrade for match rate.

**Other licensed options (not wired yet):**
- **Free:** [UK EPC Open Data](https://epc.opendatacommunities.org/) — floor area / energy rating by address (not roof kW)
- **Paid:** Foursquare Places, Geoapify, Loqate / Ideal Postcodes, Google Solar API (roof), Creditsafe / Creditsafe-style financials

Set `GOOGLE_PLACES_API_KEY` in `.env` to switch providers. No scraping.

Get a free API key: [Companies House Developer Hub](https://developer.company-information.service.gov.uk/). Put it in `.env` as `COMPANIES_HOUSE_API_KEY` and restart the dev server.

### Dashboard
- Filter by status, category, qualification, min score, and search
- Charts: pipeline status, A–D categories, score distribution
- Rich leads table with website, contact details, energy data, solar fit
- Detailed lead page with scoring breakdown and unknown fields

## Tech Stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Framework  | Next.js 15 (App Router) |
| Language   | TypeScript              |
| Database   | SQLite via Prisma       |
| Styling    | Tailwind CSS v4         |
| Icons      | Lucide React            |

## Getting Started

```bash
npm install
npm run db:setup    # Create DB + seed 12 leads + 8 discovery prospects + run analysis
npm run dev         # http://localhost:3000
npm run always-on:mac   # LaunchAgent: stays up after Cursor closes (see docs/always-on.md)
```

### Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to SQLite
npm run db:seed       # Re-seed + re-analyse all leads
npm run db:setup      # Push + seed
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma       # Models incl. LeadAnalysis
│   └── seed.ts             # Sample data + initial analysis
├── src/
│   ├── lib/
│   │   ├── analysis/           # Collect → enrich → score → persist
│   │   ├── enrichment/         # Irradiance, roof kW, Places (OSM / Google)
│   │   ├── discovery/          # ICP, Companies House client, scan, import
│   │   ├── leads.ts
│   │   └── types.ts
│   ├── app/
│   │   ├── page.tsx
│   │   ├── discovery/page.tsx
│   │   ├── leads/[id]/page.tsx
│   │   └── api/
│   │       ├── discovery/          # GET pool, POST import, POST scan
│   │       ├── leads/[id]/analyze
│   │       └── analysis/run-all
│   └── components/
└── README.md
```

## Data Model

### LeadAnalysis
Stores each analysis run with full audit trail:
- `score`, `category`, `qualificationLabel`, `solarSuitability`
- `reasons` — JSON array of `{ factor, impact, detail, known }`
- `unknowns` — JSON array of field names not available
- `pipelineVersion` — track scoring logic version

### Unknown Data Policy
Fields without values display as **Unknown** in the UI. The scorer and seed:
- Do **not** invent revenue, energy bills, kWh usage, website, email, or phone
- Companies House supplies register facts only (name, number, address, SIC, officer name)
- Do **not** derive annual kWh from energy bills
- May estimate **system kW from known roof area** and **irradiance from postcode area**, always labelled `estimated`
- Mark stored kWh and irradiance with source (`verified` / `estimated` / `unknown`)
- List all missing fields in the analysis output
- Reduce score via a data-confidence penalty when gaps exist

## API

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/leads?status&category&qualification&search&minScore` | List leads |
| PATCH | `/api/leads/:id` | Update lead status |
| POST | `/api/leads/:id/analyze` | Run analysis on one lead |
| POST | `/api/analysis/run-all` | Analyse all leads |
| GET | `/api/discovery` | List discovery prospects + preview scores |
| POST | `/api/discovery/import` | Import a prospect into the pipeline |
| GET | `/api/discovery/scan` | Whether a Companies House API key is configured |
| POST | `/api/discovery/scan` | Run a Companies House scan into the discovery inbox |
| GET | `/api/facebook/leadgen` | Meta webhook verification |
| POST | `/api/facebook/leadgen` | Meta leadgen webhook |
| POST | `/api/facebook/leads/simulate` | Local Instant Form test ingest |
| POST | `/api/facebook/leads/sync` | Pull Instant Form leads from Meta into the CRM |
| POST | `/api/calls/:id/start` | Open sandbox call (consent required) |
| POST | `/api/calls/:id/complete` | Finish sandbox script; may QUALIFY and email owner |
| POST | `/api/calls/:id/dial` | Place a live Twilio call (consent + TWILIO_LIVE_DIALS) |
| GET | `/api/calls/:id` | Latest call attempt status |
| POST | `/api/twilio/voice/:attemptId/:step` | TwiML keypad bot + call status |
| GET | `/api/twilio/status` | Whether Twilio live dials are configured |
| GET | `/api/health` | Always-on heartbeat + last Facebook pull |
| GET | `/api/email/status` | Whether owner email is configured |
| POST | `/api/email/test` | Send a test email to OWNER_NOTIFY_EMAIL |
| POST | `/api/leads/:id/notify-owner` | Email owner about a QUALIFIED lead |

## Roadmap

| Stage | Focus |
| ----- | ----- |
| 1 | Lead management + AI scoring |
| 2 | UK enrichment + sample discovery |
| 3 | Companies House scan |
| 3b | Places website/phone lookup |
| 4a | Facebook Instant Form → CRM |
| 4b | Sandbox call bot + QUALIFIED |
| 4c | Owner email on QUALIFIED |
| **4d** | Live Twilio dials (consent only) |
| **4e** | Always-on process (LaunchAgent / systemd) *(current)* |

## License

Private — all rights reserved.
