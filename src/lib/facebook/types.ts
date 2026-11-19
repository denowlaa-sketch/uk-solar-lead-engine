export type FacebookFormAnswers = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  postcode: string;
  city?: string;
  streetAddress?: string;
  homeowner?: boolean;
  billBand?: string;
  roofType?: string;
  timeline?: string;
  consentToCall: boolean;
  facebookLeadId?: string;
  facebookFormId?: string;
  facebookPageId?: string;
  raw?: Record<string, string>;
};

export const BILL_BAND_LABELS: Record<string, string> = {
  under_50: "Under £50 / month",
  "50_100": "£50–£100 / month",
  "100_150": "£100–£150 / month",
  "150_plus": "£150+ / month",
};

export const TIMELINE_LABELS: Record<string, string> = {
  now: "Ready now",
  "3_months": "Within 3 months",
  "6_months": "Within 6 months",
  researching: "Just researching",
};

export const BILL_BAND_TO_MONTHLY: Record<string, number> = {
  under_50: 40,
  "50_100": 75,
  "100_150": 125,
  "150_plus": 200,
};
