import type { Confidence, IndicatorFamily } from "./types";

export const MISSION = {
  name: "Abu Hureirah Situation Room: Sudan Wing",
  existsFor: [
    "Journalism and public-interest reporting",
    "Human-rights documentation and archival",
    "Academic research",
    "Humanitarian early warning and civilian-harm context",
    "Accountability and historical record",
  ],
  doesNotExistFor: [
    "Targeting, fire control, or strike planning",
    "Real-time tactical advice to any armed actor",
    "Kill-chain or aim-point language",
    "Recommending attacks, interdiction, or military operations",
  ],
};

export const LANGUAGE_RULES = {
  allowed: [
    "newly compacted yard",
    "increase of approximately 20–40 large vehicles since 12 Aug",
    "thermal anomaly cluster within 150 m of warehouse roof",
    "Il-76-type airframe overflew X at 02:14 UTC; landing not confirmed in ADS-B",
    "damage consistent with explosive impact, origin undetermined",
  ],
  disallowed: [
    "valid target",
    "high-value target",
    "recommended aimpoint",
    "destroy this depot",
    "this flight is smuggling weapons",
    "confirmed RSF drone base",
    "confirmed arms depot",
    "SAF airstrike confirmed from crater shape",
  ],
};

const BANNED =
  /\b(valid target|high-value target|hvt|aimpoint|aim point|kill chain|destroy this|smuggling weapons|confirmed (arms|drone|strike|perpetrator)|recommended (aim|strike|interdiction))\b/i;

export function isDisallowedCopy(text: string): boolean {
  return BANNED.test(text);
}

export function sanitizeObservation(text: string): string {
  if (!isDisallowedCopy(text)) return text;
  return "Observational note withheld: generated text used targeting or confirmation language. Rewrite as observed / possible / assessed / consistent with / unconfirmed.";
}

export function confidenceFromFamilies(
  families: IndicatorFamily[],
  hasReporting: boolean,
  multiDate: boolean,
): Confidence {
  const unique = new Set(families);
  if (unique.size >= 3 && hasReporting && multiDate) return 4;
  if (unique.size >= 2 && multiDate) return 3;
  if (unique.size >= 2) return 2;
  if (families.length >= 2) return 2;
  return 1;
}

export const DOCTRINE = [
  "No single image, hotspot, container, aircraft, or vehicle proves ownership, intent, cargo contents, or combat use.",
  "Confidence may rise only when multiple independent signs line up over time.",
  "Treat all armed parties symmetrically: RSF, SAF, allied militias, other armed groups, and foreign-linked logistics.",
  "Always maintain a civilian baseline: trucking, markets, farms, humanitarian convoys, mining, oil-service traffic, passenger aviation.",
  "Use probabilistic labels: observed / possible / assessed / consistent with / unconfirmed.",
  "Distinguish detection from attribution. Imagery alone does not name a perpetrator.",
  "Record negative evidence: military-looking sites that resolve civilian; unusual flights that are scheduled cargo or humanitarian; agricultural burning, flares, brick kilns.",
  "Every finding must be reproducible: scene IDs, times, bbox, parameters, notes, confidence.",
];
