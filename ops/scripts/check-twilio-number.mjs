import { readFileSync } from "fs";

const text = readFileSync(new URL("../../.env", import.meta.url), "utf8");
function env(name) {
  const match = text.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const sid = env("TWILIO_ACCOUNT_SID");
const tok = env("TWILIO_AUTH_TOKEN");
const from = env("TWILIO_PHONE_NUMBER");
const auth = Buffer.from(`${sid}:${tok}`).toString("base64");

const res = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PageSize=50`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const json = await res.json();
const numbers = (json.incoming_phone_numbers || []).map((n) => n.phone_number);
console.log("http", res.status);
console.log("env_from", from);
console.log("count", numbers.length);
for (const n of numbers) console.log("owned", n);
console.log("match", numbers.includes(from));
