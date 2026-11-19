import { getFacebookFormId, getFacebookLeadsAfter, getFacebookPageAccessToken } from "./env";
import { ingestFacebookLead } from "./ingest";
import { mapFieldData } from "./parse";

type GraphList<T> = { data?: T[]; error?: { message?: string } };

async function graphJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as T;
}

export async function pullFacebookLeadsFromMeta() {
  const token = getFacebookPageAccessToken();
  if (!token) {
    return { error: "FACEBOOK_PAGE_ACCESS_TOKEN is missing or empty." as const };
  }

  const me = await graphJson<{ id?: string; name?: string; error?: { message?: string } }>(
    `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`
  );
  if (me.error || !me.id) {
    return { error: me.error?.message ?? "Facebook token is invalid or expired. Generate a new Page token." };
  }

  const configuredFormId = getFacebookFormId();
  let forms: Array<{ id: string; name?: string; status?: string }> = [];

  if (configuredFormId) {
    forms = [{ id: configuredFormId, name: "configured Instant Form" }];
  } else {
    const listed = await graphJson<GraphList<{ id: string; name?: string; status?: string }>>(
      `https://graph.facebook.com/v21.0/${me.id}/leadgen_forms?fields=id,name,status&limit=50&access_token=${encodeURIComponent(token)}`
    );
    if (listed.error) {
      return { error: listed.error?.message ?? "Could not list Instant Forms." };
    }
    forms = listed.data ?? [];
  }

  const cutoff = getFacebookLeadsAfter();
  const results: Array<{ facebookLeadId?: string; leadId?: string; duplicate?: boolean; error?: string }> = [];
  let imported = 0;
  let duplicates = 0;

  for (const form of forms) {
    const leads = await graphJson<
      GraphList<{
        id?: string;
        created_time?: string;
        field_data?: Array<{ name?: string; values?: string[] }>;
      }>
    >(
      `https://graph.facebook.com/v21.0/${form.id}/leads?fields=id,created_time,field_data&limit=50&access_token=${encodeURIComponent(token)}`
    );
    if (leads.error) {
      const message = leads.error.message ?? "leads fetch failed";
      results.push({ error: `${form.name ?? form.id}: ${message}` });
      if (message.includes("80005")) {
        return { error: message };
      }
      continue;
    }

    for (const lead of leads.data ?? []) {
      try {
        if (cutoff && lead.created_time) {
          const created = new Date(lead.created_time);
          if (!Number.isNaN(created.getTime()) && created < cutoff) {
            duplicates += 1;
            results.push({ facebookLeadId: lead.id, duplicate: true });
            continue;
          }
        }
        const answers = mapFieldData(lead.field_data ?? [], {
          leadgenId: lead.id,
          formId: form.id,
          pageId: me.id,
        });
        const ingested = await ingestFacebookLead(answers);
        if (ingested.duplicate) duplicates += 1;
        else imported += 1;
        results.push({
          facebookLeadId: lead.id,
          leadId: ingested.leadId,
          duplicate: ingested.duplicate,
        });
      } catch (error) {
        results.push({
          facebookLeadId: lead.id,
          error: error instanceof Error ? error.message : "Ingest failed",
        });
      }
    }
  }

  return {
    page: me.name ?? me.id,
    forms: forms.length,
    imported,
    duplicates,
    results,
  };
}
