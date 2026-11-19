import { readFileSync } from "fs";

const text = readFileSync(new URL("../../.env", import.meta.url), "utf8");
function env(name) {
  const match = text.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const sid = env("TWILIO_ACCOUNT_SID");
const tok = env("TWILIO_AUTH_TOKEN");
const auth = Buffer.from(`${sid}:${tok}`).toString("base64");
const res = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/OutgoingCallerIds.json?PageSize=20`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const json = await res.json();
console.log("http", res.status);
for (const n of json.outgoing_caller_ids || []) {
  console.log("verified", n.phone_number);
}
if (!json.outgoing_caller_ids?.length) console.log("verified_none");
