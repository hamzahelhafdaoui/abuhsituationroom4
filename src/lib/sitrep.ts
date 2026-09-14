import { ACTORS, type ConfWord } from "@/lib/doctrine";
import { CONTROL_CITIES } from "@/lib/control";
import type { ChangeEntry, FlightEvent, GdeltEvent, LiveBundle, NewsItem, ThermalEvent } from "@/lib/types";

export type WarLevel = "TACTICAL" | "OPERATIONAL" | "STRATEGIC";

export interface SitrepDev {
  title: string;
  confidence: ConfWord;
  claim: "observed" | "reported" | "claimed" | "assessed";
  observed: string;
  assessment: string;
  significance: WarLevel;
  location?: string;
}

export interface Sitrep {
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  theater: string;
  overallConfidence: ConfWord;
  bottomLine: string;
  developments: SitrepDev[];
  picture: {
    initiative: string;
    ground: string;
    air: string;
    fires: string;
    logistics: string;
    c2: string;
  };
  imagery: string[];
  meaning: string;
  political: string;
  forecast: { mostLikely: string; alt: string; lowProb: string; watch: string[] };
  gaps: string[];
  high: string[];
  moderate: string[];
  low: string[];
  source: "local" | "ai";
  counts: {
    log6h: number;
    log72h: number;
    news: number;
    firms: number;
    flights: number;
    cargo: number;
  };
}

const H6 = 6 * 3600_000;
const H72 = 72 * 3600_000;

function iso(d: Date): string {
  return d.toISOString();
}

function inWindow(isoStr: string, start: number, end: number): boolean {
  const t = Date.parse(isoStr);
  return Number.isFinite(t) && t >= start && t <= end;
}

function topNews(news: NewsItem[], n = 4): NewsItem[] {
  return news.slice(0, n);
}

export function compileSitrep(opts: {
  log: ChangeEntry[];
  live: LiveBundle | null;
  lastSweepAt: string | null;
  now?: Date;
}): Sitrep {
  const now = opts.now ?? new Date();
  const end = now.getTime();
  const start6 = end - H6;
  const start72 = end - H72;
  const log = opts.log;
  const live = opts.live;
  const news = live?.news ?? [];
  const firms = live?.firms ?? [];
  const flights = live?.flights ?? [];
  const gdelt = live?.gdelt ?? [];

  const log6 = log.filter((e) => inWindow(e.lastSeen || e.firstSeen, start6, end));
  const log72 = log.filter((e) => inWindow(e.lastSeen || e.firstSeen, start72, end));
  const cargo = flights.filter((f) => f.category === "cargo" || f.military);
  const hotFirms = firms.filter((f) => (f.frp ?? 0) >= 15).length;

  const cities = CONTROL_CITIES;
  const safN = cities.filter((c) => c.faction === "saf").length;
  const rsfN = cities.filter((c) => c.faction === "rsf").length;
  const mixedN = cities.filter((c) => c.faction === "contested").length;

  const developments: SitrepDev[] = [];

  developments.push({
    title: "Compiled control picture unchanged this cycle",
    confidence: "MODERATE",
    claim: "assessed",
    observed: `${cities.length} named cities in the compiled open-source map: SAF ${safN}, RSF ${rsfN}, contested/mixed ${mixedN}. This is not a live frontline.`,
    assessment:
      "Territorial language in headlines should be checked against this coarse picture and the review queue. A single social-media capture claim does not move the map.",
    significance: "OPERATIONAL",
  });

  for (const n of topNews(news, 3)) {
    developments.push({
      title: n.title.slice(0, 140),
      confidence: "LOW",
      claim: "reported",
      observed: `${n.source} headline in the public wire. Original reporting not independently verified by this archive.`,
      assessment:
        "Treat as a lead. Ten recrawls of the same headline remain one origin. Open the article before raising confidence.",
      significance: "TACTICAL",
      location: undefined,
    });
  }

  if (hotFirms > 0) {
    developments.push({
      title: `FIRMS: ${hotFirms} higher-FRP thermal points in the AOI this cycle`,
      confidence: "MODERATE",
      claim: "observed",
      observed: `NASA FIRMS VIIRS returned ${firms.length} points; ${hotFirms} at FRP ≥ 15. Agricultural and industrial burning remain the baseline.`,
      assessment:
        "Thermal is an indicator, not a battle-damage assessment. Pair with dated optical and open reporting before calling explosive damage.",
      significance: "TACTICAL",
    });
  }

  if (cargo.length > 0) {
    developments.push({
      title: `Public ADS-B: ${cargo.length} cargo-typical or military-flagged airframes in coverage`,
      confidence: "LOW",
      claim: "observed",
      observed: cargo
        .slice(0, 4)
        .map((f) => `${f.typeCode || "type?"} ${f.reg || f.hex} near ${f.nearestAirfield}`)
        .join("; "),
      assessment:
        "Public tracking is incomplete. A cargo-typical airframe is not proof of cargo contents, operator intent, or a military flight. Absence of a track is not absence of a flight.",
      significance: "OPERATIONAL",
    });
  }

  const recentLog = [...log72]
    .filter((e) => e.source !== "flight" && e.source !== "firms" && e.source !== "vessel")
    .filter((e) => e.families.some((f) => f === "vehicles" || f === "morphology" || f === "damage" || f === "corridor" || f === "reporting"))
    .sort((a, b) => b.firstSeen.localeCompare(a.firstSeen))
    .slice(0, 2);
  for (const e of recentLog) {
    developments.push({
      title: e.title,
      confidence: e.confidence >= 3 ? "MODERATE" : "LOW",
      claim: e.confidence >= 3 ? "assessed" : "observed",
      observed: e.body.slice(0, 280),
      assessment: e.negative
        ? "Negative-evidence row: civilian or alternative explanation recorded. Do not recycle as a military finding."
        : "Archive row. Confidence stays with the original indicator families until a human reviews it.",
      significance: e.families.includes("corridor") ? "OPERATIONAL" : "TACTICAL",
      location: e.siteName,
    });
  }

  const clipped = developments.slice(0, 7);
  const newsN = news.length;
  const overall: ConfWord = newsN >= 4 && log72.length >= 3 ? "MODERATE" : "LOW";

  const bottomLine =
    newsN === 0 && log6.length === 0
      ? `No new corroborated military change in the last six hours. The campaign picture is the compiled control map (SAF ${safN} / RSF ${rsfN} named cities) plus the four-year archive — not this cycle's headlines. Overall confidence ${overall}.`
      : `This six-hour window added ${log6.length} log rows and ${newsN} public-wire headlines. ${hotFirms} higher-FRP thermal points and ${cargo.length} cargo-typical tracks are observations, not attributions. Who benefited: undetermined this cycle. Significance is whether independent sources corroborate the same places over the next 24–72 hours.`;

  const saf = ACTORS.find((a) => a.id === "saf")!;
  const rsf = ACTORS.find((a) => a.id === "rsf")!;

  return {
    windowStart: iso(new Date(start6)),
    windowEnd: iso(now),
    generatedAt: iso(now),
    theater: "Sudan Wing · adjacent theaters",
    overallConfidence: overall,
    bottomLine,
    developments: clipped,
    picture: {
      initiative: "Unclear this cycle — initiative is not inferred from headline volume.",
      ground: `Compiled city markers: SAF ${safN}, RSF ${rsfN}, contested/mixed ${mixedN}. Queue confirmations can nudge shading; they do not draw a FLOT.`,
      air: `${flights.length} public tracks (${cargo.length} cargo-typical/military-flagged). Coverage gaps in Darfur, Kordofan, and desert corridors remain.`,
      fires: hotFirms
        ? `${hotFirms} higher-FRP FIRMS points. Effect on capability: unknown without optical change detection.`
        : "No higher-FRP cluster highlighted this cycle.",
      logistics: `${rsf.short}: desert corridors alleged. ${saf.short}: Port Sudan / remaining airfields. Throughput not measured.`,
      c2: "No independently verified command-collapse indicator this cycle. Leadership claims stay in the claimed class.",
    },
    imagery: [
      "Dated optical is Sentinel-2 HLS / VIIRS browse — not a targeting sensor.",
      "Before/after swipe is change detection, not battle-damage confirmation.",
      firms.length
        ? `FIRMS cycle: ${firms.length} points. Agricultural baseline still applies.`
        : "FIRMS empty or stale this cycle.",
    ],
    meaning:
      "The campaign is still a multi-year contest over cities, corridors, and external sustainment. This six-hour slice is too short to show culmination, breakthrough, or collapse. Watch whether additional independent reporting, dated optical change, and logistics-airframe patterns line up on the same named places — not whether a single clip is spectacular.",
    political: `${saf.political} ${rsf.political} Neighboring states manage borders and patronage; UAE supply allegations remain reported/contested. Civilian harm and displacement remain the humanitarian baseline, not a side note.`,
    forecast: {
      mostLikely:
        "Continued positional fighting and corridor contestation without a demonstrated nationwide shift in the compiled control picture (50–70%).",
      alt: "A locally significant urban or corridor change that later gets multi-source corroboration (20–40%).",
      lowProb: "A publicly documented, independently corroborated shift in external airlift or a named-city control change that survives 72 hours of reporting (<20%).",
      watch: [
        "Two or more independent outlets naming the same place, not the same Telegram clip",
        "Dated optical change at a documented yard or airfield already in the archive",
        "Cargo-typical airframes repeating at the same public airfield across successive sweeps",
        "Humanitarian reporting of new displacement along a named corridor",
        "Analyst-confirmed queue items that actually move the control shading",
      ],
    },
    gaps: [
      "True unit strength unknown",
      "Airfield throughput unmeasured (ADS-B is a coverage sample)",
      "Weapon-system claims from explosions unverified",
      "City-control headlines often lack geolocated presence",
      GDELT_NOTE(gdelt.length),
    ],
    high: [
      "Compiled control map is a snapshot, not live",
      "FIRMS and ADS-B are public sensors with known gaps",
      "This product is documentation, not a targeting feed",
    ],
    moderate: [
      "SAF/RSF political objectives as publicly stated",
      "Thermal points exist where FIRMS returns them",
    ],
    low: [
      "Any single-cycle attribution of a strike, cargo contents, or city capture",
      "External-sponsor logistics details beyond named public sites",
    ],
    source: "local",
    counts: {
      log6h: log6.length,
      log72h: log72.length,
      news: newsN,
      firms: firms.length,
      flights: flights.length,
      cargo: cargo.length,
    },
  };
}

function GDELT_NOTE(n: number): string {
  return n > 0
    ? `GDELT points this cycle: ${n} — event codes, not confirmed incidents`
    : "GDELT empty or cached archive only";
}

export function sitrepToItems(s: Sitrep): { headline: string; summary: string; category: string; confidence: "reported" | "corroborated" | "single-source" }[] {
  return s.developments.map((d) => ({
    headline: d.title,
    summary: `${d.observed} Assessment: ${d.assessment}`,
    category: d.significance === "STRATEGIC" ? "diplomacy" : d.significance === "OPERATIONAL" ? "control" : "reported",
    confidence: d.claim === "observed" ? "corroborated" : d.claim === "reported" ? "reported" : "single-source",
  }));
}
