export type IcpSegmentId =
  | "manufacturing"
  | "logistics"
  | "food"
  | "print"
  | "marine"
  | "data";

export type IcpSegment = {
  id: IcpSegmentId;
  label: string;
  industry: string;
  sicCodes: string[];
};

/**
 * Commercial solar ICP: high daytime electricity use, typically large roofs.
 * SIC codes are used only as Companies House search filters.
 */
export const ICP_SEGMENTS: IcpSegment[] = [
  {
    id: "manufacturing",
    label: "Manufacturing",
    industry: "Manufacturing",
    sicCodes: ["25110", "25990", "22220", "27120", "28290", "29201", "29320"],
  },
  {
    id: "logistics",
    label: "Logistics & warehousing",
    industry: "Logistics",
    sicCodes: ["49410", "52101", "52102", "52103", "52290"],
  },
  {
    id: "food",
    label: "Food & beverage",
    industry: "Food & Beverage",
    sicCodes: ["10110", "10130", "10390", "10520", "10890", "11050", "11070"],
  },
  {
    id: "print",
    label: "Printing",
    industry: "Printing",
    sicCodes: ["18110", "18121", "18129"],
  },
  {
    id: "marine",
    label: "Marine engineering",
    industry: "Marine Engineering",
    sicCodes: ["30110", "30120", "33150"],
  },
  {
    id: "data",
    label: "Data processing",
    industry: "Data Centres",
    sicCodes: ["63110", "63120"],
  },
];

const SIC_TO_INDUSTRY = new Map<string, string>();
for (const segment of ICP_SEGMENTS) {
  for (const code of segment.sicCodes) {
    SIC_TO_INDUSTRY.set(code, segment.industry);
  }
}

const SIC_PREFIX_INDUSTRY: Array<[string, string]> = [
  ["10", "Food & Beverage"],
  ["11", "Food & Beverage"],
  ["18", "Printing"],
  ["01", "Agriculture"],
  ["52", "Logistics"],
  ["49", "Logistics"],
  ["30", "Marine Engineering"],
  ["63", "Data Centres"],
];

export function getSegment(id: string | undefined): IcpSegment | undefined {
  return ICP_SEGMENTS.find((s) => s.id === id);
}

export function sicCodesForScan(segmentId?: string): string[] {
  const segment = getSegment(segmentId);
  if (segment) return segment.sicCodes;
  return ICP_SEGMENTS.flatMap((s) => s.sicCodes);
}

export function industryFromSicCodes(sicCodes: string[] | undefined): string {
  if (!sicCodes?.length) return "Unknown";

  for (const code of sicCodes) {
    const mapped = SIC_TO_INDUSTRY.get(code);
    if (mapped) return mapped;
  }

  for (const code of sicCodes) {
    const prefix = SIC_PREFIX_INDUSTRY.find(([p]) => code.startsWith(p));
    if (prefix) return prefix[1];
  }

  if (sicCodes[0] >= "10" && sicCodes[0] < "34") return "Manufacturing";
  return "Commercial";
}

export const DEFAULT_SCAN_LOCATION = "Manchester";
export const MIN_SCAN_SIZE = 5;
export const MAX_SCAN_SIZE = 25;
export const DEFAULT_SCAN_SIZE = 15;
