/** Analytical curriculum for the six-hour brief. Academic vocabulary only. Not targeting doctrine. */

export const ANALYTICAL_CHAIN = [
  "OBSERVATION — what is visible or measurable in a source",
  "IDENTIFICATION — probable family / type, with alternatives",
  "ASSESSMENT — what the pattern may mean",
  "JUDGMENT — if corroborated, what it might imply. Never upgrade judgment to fact.",
] as const;

export const EVIDENCE_CLASS = {
  observed: "Directly observed in the source",
  corroborated: "Independently corroborated (separate origin, not the same chain)",
  probable: "Strongly supported, confirmation incomplete",
  plausible: "Consistent, competing explanations remain",
  unconfirmed: "Insufficient, contested, or likely information warfare",
} as const;

export type ClaimClass =
  | "observed"
  | "verified"
  | "reported"
  | "claimed"
  | "assessed"
  | "possible"
  | "unknown";

export const CLAIM_CLASS: Record<ClaimClass, string> = {
  observed: "Visible or measurable in the source itself",
  verified: "Multiple independent credible origins",
  reported: "A credible outlet reports it; independent confirmation absent",
  claimed: "An interested party states it",
  assessed: "Analytical inference from available evidence",
  possible: "Plausible, insufficiently supported",
  unknown: "Evidence does not permit a conclusion",
};

export const CONF_WORD = {
  HIGH: "Strong evidence, multiple independent indicators, little contradiction",
  MODERATE: "Evidence supports the assessment; important gaps remain",
  LOW: "Plausible but incomplete, ambiguous, or weak",
} as const;

export type ConfWord = keyof typeof CONF_WORD;

export const LEVELS = {
  TACTICAL: "What physically occurred locally. Do not extrapolate to the war.",
  OPERATIONAL: "How separated events combine into a campaign: tempo, logistics, reserves, corridors.",
  STRATEGIC: "Relation to political objectives, sustainment of the war, external sponsors, legitimacy.",
} as const;

export const WARFIGHTING = ["C2", "Intelligence", "Movement", "Fires", "Sustainment", "Protection"] as const;

/** Unclassified academic notes from public doctrine (FM 3-90, Jordan et al.). Not employment guidance. */
export const ACADEMIC_NOTES = [
  "US joint teaching (Jordan et al., Understanding Modern Warfare) separates tactical, operational, and strategic levels. A local success is not automatically a campaign success.",
  "FM 3-90 (May 2023, unlimited distribution) describes four types of offensive operations in sequence language: movement to contact, attack, exploitation, pursuit. Purpose discriminates one from another. This archive uses those words only as labels for publicly reported activity — never as a recommendation.",
  "The same manual notes offensive operations typically demand more fuel, medical, and replacement capacity than the defense. Withdrawal from exposed ground may be force preservation, not collapse.",
  "Mass is concentration of effects, not necessarily crowding soldiers. Dispersion reduces vulnerability and raises coordination and logistics cost.",
] as const;

export interface ActorProfile {
  id: string;
  name: string;
  short: string;
  political: string;
  military: string;
  logistics: string;
  external: string;
  info: string;
  confidence: ConfWord;
  updated: string;
}

export const ACTORS: ActorProfile[] = [
  {
    id: "saf",
    name: "Sudanese Armed Forces (SAF)",
    short: "State military under the Sovereignty Council / Burhan line",
    political: "Public objective: restore a unified state authority and reverse RSF territorial gains.",
    military: "Conventional force with remaining airframes and artillery. Stretched across multiple sectors.",
    logistics: "Depends on remaining airfields, Nile-axis roads, and Port Sudan as a political-logistics hub.",
    external: "Egypt and other state relationships are reported, not independently proven in this archive.",
    info: "Official statements are claims. Treat as evidence that SAF said X, not that X occurred as described.",
    confidence: "MODERATE",
    updated: "2026-09",
  },
  {
    id: "rsf",
    name: "Rapid Support Forces (RSF)",
    short: "Hemedti-led paramilitary, Darfur origin, urban and desert mobility",
    political: "Public objective: hold captured ground, extract resources, contest the capital and west.",
    military: "Motorized / technical-heavy, urban fighting, reported drone use. Not a symmetric air force.",
    logistics: "Cross-border desert tracks (Chad, Libya, CAR) and gold-linked finance are repeatedly alleged.",
    external: "UAE supply allegations are widely reported and contested. This archive labels them reported / claimed.",
    info: "RSF media is interested-party output. Apply the same source rules as SAF.",
    confidence: "MODERATE",
    updated: "2026-09",
  },
  {
    id: "ext",
    name: "External sponsors & neighbors",
    short: "UAE, Egypt, Chad, Libya, Ethiopia, Eritrea, Somalia — adjacent, not a single bloc",
    political: "Neighbors manage borders, refugees, Red Sea access, and rival patronage. Interests diverge.",
    military: "Foreign-linked airlift and ports are a collection problem: public ADS-B is incomplete.",
    logistics: "Corridors of interest: Adré, Kufra, Port Sudan, Berenice, Assab, Al Dhafra as named public sites.",
    external: "Arms-transfer claims require original documents or multi-source imagery. Reposts are one chain.",
    info: "Western, Gulf, African, and resistance media all frame. Separate event facts from editorial verbs.",
    confidence: "LOW",
    updated: "2026-09",
  },
];

export const DOCTRINE_SYSTEM = `You are the analytical engine of Abu Hureirah Situation Room: Sudan Wing — a civilian public-data archive for journalism, academia, humanitarian early warning, and accountability.

You are NOT a command-and-control system. Never produce targeting packages, firing solutions, strike coordinates, target-selection lists, attack timing, weapon-to-target matching, routes for attacking units, or instructions to defeat defenses.

Always distinguish OBSERVATION (visible in a source) from IDENTIFICATION (probable type) from ASSESSMENT (what it may mean) from JUDGMENT (if corroborated). Prefer "I do not know" over unsupported confidence.

Evidence classes: observed / independently corroborated / probable / plausible / unconfirmed.
Confidence (quality of judgment) is not probability (how likely an event is).
Ten reposts of one Telegram claim are one origin, not ten confirmations.
Official statements are evidence that an actor claimed X.
Absence from ADS-B is not absence of a flight. Absence of video is not absence of an event.
Do not declare a city captured on a single account. Control: controlled / likely / contested / unclear.
Do not infer morale from one video. Do not identify weapons from an explosion alone.
Tactical action → operational effect → campaign effect → strategic effect → political consequence. A local success is not automatically a war-winning one.

Academic vocabulary (unclassified): levels of war (tactical / operational / strategic); warfighting functions C2, intelligence, movement, fires, sustainment, protection; FM 3-90 offense types as descriptive labels only (movement to contact, attack, exploitation, pursuit). Never convert terrain analysis into attack instructions.

Language: "Imagery shows…" "Reporting indicates…" "X claims…" "We assess…" "One plausible explanation is…" "Evidence remains insufficient…"
Avoid: obviously, definitely, clearly, valid target, HVT, aimpoint, kill chain.

Theater: Sudan and adjacent (Egypt, Ethiopia, Somalia, Chad, Libya, UAE, Eritrea, Red Sea).
Use only the facts supplied in the user packet. Do not invent units, coordinates, serials, or quotations.`;
