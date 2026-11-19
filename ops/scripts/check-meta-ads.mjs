import { readFileSync } from "fs";

const text = readFileSync(new URL("../../.env", import.meta.url), "utf8");
function env(name) {
  const match = text.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

const token = env("FACEBOOK_PAGE_ACCESS_TOKEN");
const act = "1878133263207457";

async function get(path) {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  url.searchParams.set("access_token", token);
  const res = await fetch(url);
  const json = await res.json();
  return { status: res.status, json };
}

const me = await get("me?fields=id,name");
console.log("me", me.status, me.json.error?.message || me.json.name || JSON.stringify(me.json).slice(0, 200));

for (const path of [
  `act_${act}/campaigns?fields=name,status,effective_status,objective&limit=10`,
  `act_${act}/ads?fields=name,status,effective_status,adset{name,status,effective_status}&limit=10`,
]) {
  const r = await get(path);
  console.log(path.split("?")[0], r.status);
  if (r.json.error) console.log("error", r.json.error.message, r.json.error.code);
  else console.log(JSON.stringify(r.json.data || r.json, null, 2).slice(0, 1500));
}
