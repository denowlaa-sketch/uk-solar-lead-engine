import { pullFacebookLeadsFromMeta } from "./pull";

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const RATE_LIMIT_BACKOFF_MS = 45 * 60 * 1000;

type WatchdogStatus = {
  running: boolean;
  intervalMs: number;
  lastPullAt: string | null;
  lastImported: number | null;
  lastDuplicates: number | null;
  lastError: string | null;
};

const status: WatchdogStatus = {
  running: false,
  intervalMs: DEFAULT_INTERVAL_MS,
  lastPullAt: null,
  lastImported: null,
  lastDuplicates: null,
  lastError: null,
};

let timer: ReturnType<typeof setInterval> | null = null;
let pulling = false;
let backoffUntil = 0;

function intervalMs() {
  const raw = Number(process.env.FACEBOOK_PULL_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  return Number.isFinite(raw) && raw >= 30_000 ? raw : DEFAULT_INTERVAL_MS;
}

async function tick() {
  if (pulling) return;
  if (Date.now() < backoffUntil) return;
  pulling = true;
  try {
    const result = await pullFacebookLeadsFromMeta();
    status.lastPullAt = new Date().toISOString();
    if ("error" in result) {
      status.lastError = result.error ?? "Facebook pull failed";
      status.lastImported = null;
      status.lastDuplicates = null;
      console.error("[uk-solar-watchdog] Facebook pull failed:", result.error);
      if ((result.error ?? "").includes("80005")) {
        backoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
        console.error("[uk-solar-watchdog] leadgen rate-limited; pausing pull for 45 minutes so webhook fetches can succeed");
      }
    } else {
      status.lastError = null;
      status.lastImported = result.imported;
      status.lastDuplicates = result.duplicates;
      backoffUntil = 0;
      if (result.imported > 0) {
        console.log(`[uk-solar-watchdog] imported ${result.imported} Facebook lead(s)`);
      }
    }
  } catch (error) {
    status.lastPullAt = new Date().toISOString();
    status.lastError = error instanceof Error ? error.message : "Facebook pull failed";
    console.error("[uk-solar-watchdog]", status.lastError);
  } finally {
    pulling = false;
  }
}

export function getWatchdogStatus(): WatchdogStatus {
  return { ...status };
}

export function startFacebookWatchdog() {
  if (process.env.UK_SOLAR_WATCHDOG === "false") {
    status.running = false;
    return;
  }
  if (timer) return;

  status.intervalMs = intervalMs();
  status.running = true;
  void tick();
  timer = setInterval(() => {
    void tick();
  }, status.intervalMs);
  timer.unref?.();
  console.log(`[uk-solar-watchdog] pulling Facebook leads every ${status.intervalMs / 1000}s`);
}
