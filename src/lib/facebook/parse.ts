import type { FacebookFormAnswers } from "./types";

function normKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function firstValue(values: string[] | undefined): string | undefined {
  const value = values?.[0]?.trim();
  return value || undefined;
}

export function parseYesNo(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (["yes", "y", "true", "1", "homeowner", "i_own", "own", "owner"].includes(v)) return true;
  if (["no", "n", "false", "0", "rent", "renter", "tenant"].includes(v)) return false;
  return undefined;
}

export function parseBillBand(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase().replace(/,/g, "").replace(/\s+/g, " ");
  if (v.includes("150") && (v.includes("+") || v.includes("over") || v.includes("more") || v.includes("plus"))) {
    return "150_plus";
  }
  if (v.includes("100") && v.includes("150")) return "100_150";
  if (v.includes("50") && v.includes("100")) return "50_100";
  if (v.includes("under") || v.includes("less") || v.includes("below") || v.startsWith("under_50")) return "under_50";
  if (["under_50", "50_100", "100_150", "150_plus"].includes(value)) return value;
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  if (Number.isNaN(n)) return undefined;
  if (n >= 150) return "150_plus";
  if (n >= 100) return "100_150";
  if (n >= 50) return "50_100";
  return "under_50";
}

export function parseTimeline(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (["now", "asap", "immediately", "ready now"].some((s) => v.includes(s))) return "now";
  if (v.includes("3")) return "3_months";
  if (v.includes("6")) return "6_months";
  if (v.includes("research") || v.includes("not sure") || v.includes("later")) return "researching";
  if (["now", "3_months", "6_months", "researching"].includes(value)) return value;
  return undefined;
}

export function extractUkPostcode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/);
  return match ? `${match[1]} ${match[2]}` : undefined;
}

export function splitName(fullName: string | undefined): { firstName: string; lastName: string } {
  const parts = (fullName ?? "Unknown").trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "Lead" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function mapFieldData(
  fieldData: Array<{ name?: string; values?: string[] }>,
  meta?: { leadgenId?: string; formId?: string; pageId?: string }
): FacebookFormAnswers {
  const raw: Record<string, string> = {};
  for (const field of fieldData) {
    if (!field.name) continue;
    const value = firstValue(field.values);
    if (value) raw[normKey(field.name)] = value;
  }

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (raw[key]) return raw[key];
    }
    return undefined;
  };

  const fullName = pick("full_name", "name", "full_name_en");
  const first = pick("first_name", "firstname");
  const last = pick("last_name", "lastname");
  const names = first && last ? { firstName: first, lastName: last } : splitName(fullName);

  const consentRaw = pick(
    "consent_to_call",
    "consent",
    "may_we_call_you",
    "i_agree_to_be_called_about_solar",
    "i_agree_to_an_automated_call_about_solar"
  );

  const roofRaw = pick(
    "roof_type",
    "type_of_roof",
    "is_the_roof_in_decent_condition_and_not_heavily_shaded",
    "is_the_roof_in_decent_condition_not_heavily_shaded"
  );
  const roofYesNo = parseYesNo(roofRaw);

  return {
    firstName: names.firstName,
    lastName: names.lastName,
    email: pick("email", "email_address"),
    phone: pick("phone_number", "phone", "mobile", "mobile_number"),
    streetAddress: pick("street_address", "address", "full_address"),
    postcode: (
      pick("postcode", "post_code", "zip_code", "zip") ||
      extractUkPostcode(pick("street_address", "address", "full_address", "city")) ||
      "UNKNOWN"
    ).toUpperCase(),
    city: pick("city", "town"),
    homeowner: parseYesNo(
      pick("homeowner", "are_you_the_homeowner", "do_you_own_your_home", "do_you_own_the_property")
    ),
    billBand: parseBillBand(
      pick(
        "electricity_bill",
        "monthly_electricity_bill",
        "energy_bill",
        "bill_band",
        "roughly_how_much_is_your_monthly_electricity_bill"
      )
    ),
    roofType:
      roofYesNo === true ? "Decent / not heavily shaded" : roofYesNo === false ? "Not suitable" : roofRaw,
    timeline: parseTimeline(
      pick(
        "timeline",
        "when_are_you_looking_to_install",
        "when_would_you_like_to_install",
        "timeframe"
      )
    ),
    consentToCall: parseYesNo(consentRaw) === true,
    facebookLeadId: meta?.leadgenId,
    facebookFormId: meta?.formId,
    facebookPageId: meta?.pageId,
    raw,
  };
}
