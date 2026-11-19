import { createHmac, timingSafeEqual } from "crypto";
import { getFacebookAppSecret, getFacebookPageAccessToken } from "./env";
import { mapFieldData } from "./parse";
import type { FacebookFormAnswers } from "./types";

type LeadgenChange = {
  leadgen_id?: string;
  page_id?: string;
  form_id?: string;
  created_time?: number;
};

type GraphLead = {
  id?: string;
  created_time?: string;
  field_data?: Array<{ name?: string; values?: string[] }>;
};

export function verifyFacebookSignature(rawBody: string, header: string | null): boolean {
  const secret = getFacebookAppSecret();
  if (!secret) return false;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(given, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function extractLeadgenChanges(payload: unknown): LeadgenChange[] {
  const body = payload as {
    object?: string;
    entry?: Array<{ changes?: Array<{ field?: string; value?: LeadgenChange }> }>;
  };
  if (body.object !== "page" || !Array.isArray(body.entry)) return [];
  const out: LeadgenChange[] = [];
  for (const entry of body.entry) {
    for (const change of entry.changes ?? []) {
      if (change.field === "leadgen" && change.value?.leadgen_id) {
        out.push(change.value);
      }
    }
  }
  return out;
}

export async function fetchFacebookLead(leadgenId: string): Promise<FacebookFormAnswers> {
  const token = getFacebookPageAccessToken();
  if (!token) {
    throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not set. Cannot fetch Instant Form answers.");
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${leadgenId}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", "id,created_time,field_data,form_id,page_id");

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as GraphLead & {
    form_id?: string;
    page_id?: string;
    error?: { message?: string };
  };
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Facebook Graph API failed (${response.status}).`);
  }
  return mapFieldData(payload.field_data ?? [], {
    leadgenId: payload.id ?? leadgenId,
    formId: payload.form_id,
    pageId: payload.page_id,
  });
}
