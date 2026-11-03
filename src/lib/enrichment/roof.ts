/**
 * Conservative commercial rooftop capacity estimate.
 * Assumes ~7 m² of roof per 1 kW (partial coverage, plant, shading).
 * Only used when roof size is known and system size is missing.
 * Always ESTIMATED — never treated as a survey result.
 */
const SQM_PER_KW = 7;

export function estimateKwFromRoof(roofSizeSqm: number | null | undefined): number | null {
  if (roofSizeSqm == null || roofSizeSqm <= 0) return null;
  const raw = roofSizeSqm / SQM_PER_KW;
  return Math.max(5, Math.round(raw / 5) * 5);
}
