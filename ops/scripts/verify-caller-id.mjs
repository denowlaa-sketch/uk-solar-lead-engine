import { readFileSync } from "fs";

const text = readFileSync(new URL("../../.env", import.meta.url), "utf8");
function env(name) {
  const match = text.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const sid = env("TWILIO_ACCOUNT_SID");
const tok = env("TWILIO_AUTH_TOKEN");
const phone = process.argv[2];
if (!phone) {
  console.error("usage: node verify-caller-id.mjs +44...");
  process.exit(1);
}

const auth = Buffer.from(`${sid}:${tok}`).toString("base64");
const body = new URLSearchParams({
  PhoneNumber: phone,
  FriendlyName: "Friend test mobile",
  CallDelay: "8",
});

const res = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/OutgoingCallerIds.json`,
  {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  }
);
const json = await res.json();
console.log("http", res.status);
console.log("phone", json.phone_number || phone);
console.log("validation_code", json.validation_code || "");
console.log("call_sid", json.call_sid || "");
console.log("message", json.message || json.friendly_name || "");
