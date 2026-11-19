export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startFacebookWatchdog } = await import("@/lib/facebook/watchdog");
  startFacebookWatchdog();
}
