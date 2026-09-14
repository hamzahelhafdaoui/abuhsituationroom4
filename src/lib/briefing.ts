import { ACTORS } from "@/lib/doctrine";
import { CONTROL_CITIES } from "@/lib/control";
import { CONTROL_AS_OF, CONTROL_SOURCE, CONTROL_ZONES, FACTION_META, geocodePlace } from "@/lib/osint";
import { snapshotUrl } from "@/lib/utils";
import type { Sitrep, SitrepDev } from "@/lib/sitrep";
import type { ChangeEntry, LiveBundle } from "@/lib/types";

export interface BriefAnno {
  id: string;
  kind: "event" | "circle" | "zone";
  title: string;
  paragraph: string;
  confidence: string;
  claim: string;
  lat: number;
  lon: number;
  radiusKm: number;
  color: string;
  sources: string;
  at: string;
  imagery?: { before: string; after: string };
}

export interface BriefSection {
  id: string;
  kicker: string;
  title: string;
  body: string;
  bullets?: string[];
  annoIds?: string[];
}

export interface BriefingDoc {
  generatedAt: string;
  window: string;
  overall: string;
  sections: BriefSection[];
  annotations: BriefAnno[];
}

function bboxAround(lat: number, lon: number, km = 18) {
  const d = km / 111;
  return { west: lon - d, south: lat - d, east: lon + d, north: lat + d };
}

function imgPair(lat: number, lon: number, date: string) {
  const bbox = bboxAround(lat, lon, 22);
  const earlier = new Date(Date.parse(date) - 12 * 86400000).toISOString().slice(0, 10);
  const day = date.slice(0, 10);
  return {
    before: snapshotUrl(earlier, bbox, "HLS_S30_Nadir_BRDF_Adjusted_Reflectance"),
    after: snapshotUrl(day, bbox, "HLS_S30_Nadir_BRDF_Adjusted_Reflectance"),
  };
}

function pinPlace(
  annotations: BriefAnno[],
  id: string,
  title: string,
  paragraph: string,
  hay: string,
  opts: { confidence: string; claim: string; color: string; sources: string; at: string; radiusKm?: number },
) {
  const g = geocodePlace(hay, title);
  if (!g) return;
  if (annotations.some((a) => a.id === id)) return;
  annotations.push({
    id,
    kind: g.precise ? "event" : "circle",
    title,
    paragraph,
    confidence: opts.confidence,
    claim: opts.claim,
    lat: g.lat,
    lon: g.lon,
    radiusKm: opts.radiusKm ?? (g.precise ? 22 : 55),
    color: opts.color,
    sources: opts.sources,
    at: opts.at,
    imagery: imgPair(g.lat, g.lon, opts.at),
  });
}

export function composeBriefing(opts: {
  sitrep: Sitrep;
  live: LiveBundle | null;
  log: ChangeEntry[];
}): BriefingDoc {
  const s = opts.sitrep;
  const live = opts.live;
  const news = live?.news ?? [];
  const firms = live?.firms ?? [];
  const flights = live?.flights ?? [];
  const annotations: BriefAnno[] = [];
  const sections: BriefSection[] = [];

  for (const z of CONTROL_ZONES) {
    let lat = 0;
    let lon = 0;
    for (const [la, lo] of z.polygon) {
      lat += la;
      lon += lo;
    }
    const n = Math.max(z.polygon.length, 1);
    annotations.push({
      id: `zone-${z.id}`,
      kind: "zone",
      title: z.label,
      paragraph: `${z.note} Compiled regional control as of ${CONTROL_AS_OF}. Not a live frontline. Confidence ${z.confidence}.`,
      confidence: z.confidence.toUpperCase(),
      claim: "assessed",
      lat: lat / n,
      lon: lon / n,
      radiusKm: z.faction === "contested" ? 90 : 120,
      color: FACTION_META[z.faction]?.color ?? "#d4a017",
      sources: CONTROL_SOURCE,
      at: s.generatedAt,
    });
  }

  sections.push({
    id: "exec",
    kicker: "1. Executive assessment",
    title: "What changed in this window",
    body: [
      s.bottomLine,
      s.meaning,
      s.political,
      `Overall confidence ${s.overallConfidence}. Window ${s.windowStart.slice(0, 16).replace("T", " ")}–${s.windowEnd.slice(11, 16)}Z.`,
      "This product is a documentation briefing written for a civilian situation room. Observation is not identification. Identification is not assessment. Assessment is not judgment. Ten recrawls of one clip remain one origin. Nothing here is a targeting overlay, a fire-control product, or a live FLOT.",
      "Read the map with the text: every circle, shaded belt, and corridor mark on the analyst overlay corresponds to a paragraph below. If a location cannot be independently verified, it is generalized to a named-place centroid or omitted.",
    ].join(" "),
    annoIds: CONTROL_ZONES.map((z) => `zone-${z.id}`),
  });

  const keyBullets = s.developments.map((d, i) => ({ d, id: `dev-${i}` }));

  for (const { d, id } of keyBullets) {
    const city = CONTROL_CITIES.find(
      (c) =>
        (d.location && c.name.toLowerCase().includes(d.location.toLowerCase())) ||
        d.title.toLowerCase().includes(c.name.toLowerCase()),
    );
    if (city) {
      annotations.push({
        id,
        kind: "event",
        title: d.title,
        paragraph: `${d.observed} Assessment: ${d.assessment}`,
        confidence: d.confidence,
        claim: d.claim,
        lat: city.lat,
        lon: city.lon,
        radiusKm: 28,
        color: FACTION_META[city.faction]?.color ?? "#d4a017",
        sources: "Compiled control city + this cycle's ingest",
        at: s.generatedAt,
        imagery: imgPair(city.lat, city.lon, s.generatedAt),
      });
    } else {
      pinPlace(annotations, id, d.title, `${d.observed} Assessment: ${d.assessment}`, `${d.location ?? ""} ${d.title}`, {
        confidence: d.confidence,
        claim: d.claim,
        color: "#d4a017",
        sources: "Named-place geocode from this cycle's development",
        at: s.generatedAt,
      });
    }
  }

  sections.push({
    id: "key",
    kicker: "2. Key developments",
    title: "Observed vs assessed",
    body: "Each item below separates what a source shows or says from what we assess. A headline is a claim. FIRMS is heat. ADS-B is a state vector. Dated optical is a granule. Imagery cards, where a named city is involved, are HLS browse — not confirmation of the claim. Click a row to fly the map to the linked annotation.",
    bullets: s.developments.map(
      (d) =>
        `${d.title} — ${d.claim.toUpperCase()} / ${d.confidence} / ${d.significance}${d.location ? ` / ${d.location}` : ""}. Observed: ${d.observed} Assessment: ${d.assessment}`,
    ),
    annoIds: keyBullets.map((k) => k.id),
  });

  const newsSlice = news.slice(0, 18);
  const points = live?.newsPoints ?? [];
  for (const p of points.slice(0, 12)) {
    annotations.push({
      id: `news-${p.id}`,
      kind: "circle",
      title: `${p.name} · ${p.count} headline${p.count === 1 ? "" : "s"}`,
      paragraph:
        p.articles.map((a) => a.title).join(" · ") ||
        `Public wire cluster at ${p.name}. Named-place centroid, not an incident coordinate.`,
      confidence: "LOW",
      claim: "reported",
      lat: p.lat,
      lon: p.lon,
      radiusKm: 22,
      color: "#8ec8ff",
      sources: "Google News RSS · named-place geocoding",
      at: s.generatedAt,
      imagery: imgPair(p.lat, p.lon, s.generatedAt),
    });
  }
  for (const n of newsSlice) {
    pinPlace(annotations, `wire-${n.id}`, n.title, `${n.source}: ${n.title}`, n.title, {
      confidence: "LOW",
      claim: "reported",
      color: "#8ec8ff",
      sources: n.source,
      at: n.date ?? s.generatedAt,
      radiusKm: 18,
    });
  }

  sections.push({
    id: "imagery",
    kicker: "3. Imagery intelligence",
    title: "What dated optical can and cannot show",
    body:
      s.imagery.join(" ") +
      " For every named-place cluster in this briefing, a before/after HLS browse card is attached to the map annotation and repeated in this section. Cloud, 30 m grain, and latency mean a report can be true while the granule is empty. Empty optical is not negative evidence. Do not read a pickup as a technical, a scar as a strike, or a roof as occupancy. High-res Esri is undated — use it to inspect yards, not to time a change. VIIRS is coarse (~375 m) and useful for smoke and burn scars, not vehicles.",
    bullets: points
      .slice(0, 8)
      .map((p) => `${p.name}: ${p.count} public headlines. Centroid only. Open the annotation for HLS before/after.`),
    annoIds: points.slice(0, 8).map((p) => `news-${p.id}`),
  });

  const cargo = flights.filter((f) => f.category === "cargo" || f.military);
  sections.push({
    id: "air",
    kicker: "4. Air / aviation activity",
    title: "Public ADS-B sample, not the air picture",
    body:
      s.picture.air +
      " Positions update on a ~20 second poll and dead-reckon between polls so a moving symbol is an ADS-B state vector, not a mission. Passenger airframes are shown because the workbench displays traffic, not because they are assessed as combat. Category is typical for the airframe. Cargo contents are unknown. ADS-B silence over Darfur, Kordofan, and the desert corridors is a coverage gap — absence of a track is not absence of a flight. Archive sample tracks remain on the map when live coverage is outside the Sudan frame so the air layer is never an empty lie.",
    bullets: [
      `${flights.length} public tracks this cycle (${cargo.length} cargo-typical or military-flagged).`,
      ...flights.slice(0, 10).map(
        (f) =>
          `${f.typeCode} ${f.reg !== "unknown" ? f.reg : f.hex} · ${f.category} · ${f.nearestAirfield}${f.live ? " · live" : " · archive"}`,
      ),
    ],
  });

  sections.push({
    id: "ground",
    kicker: "5. Ground situation",
    title: "Compiled control, not a FLOT",
    body:
      s.picture.ground +
      ` Control polygons are regional and time-bounded (as of ${CONTROL_AS_OF}). ${CONTROL_SOURCE} SAF cyan covers the north, Nile, Khartoum, and the east including Port Sudan. RSF rust covers the Darfur states after the fall of El Fasher in open reporting. Gold dashed marks the Kordofan belt as contested. SPLM-N green is a low-confidence Nuba overlay. A single social-media capture claim does not recode a polygon. Analyst-confirmed queue items can nudge city markers only.`,
    bullets: CONTROL_CITIES.map((c) => `${c.name}: ${c.faction.toUpperCase()} (${c.confidence}) as of ${c.asOf}. ${c.note}`),
    annoIds: CONTROL_ZONES.map((z) => `zone-${z.id}`),
  });

  const hot = firms.filter((f) => f.frp >= 15).length;
  sections.push({
    id: "fires",
    kicker: "6. Fires / thermal",
    title: "FIRMS is a heat feed",
    body:
      s.picture.fires +
      ` ${firms.length} VIIRS points in the AOI; ${hot} at FRP ≥ 15. Agricultural burning, gas flares, and brick kilns are the baseline in Sudan. A night-time urban cluster near a hospital, camp, or market is tagged possible-explosive only as a review cue. Thermal without dated optical is not battle-damage assessment. Do not promote a FIRMS point to a strike.`,
  });

  sections.push({
    id: "logistics",
    kicker: "7. Logistics and sustainment",
    title: "Corridors, airframes, ports",
    body:
      s.picture.logistics +
      " Red Sea lane markers are documented-corridor animation, not live AIS — they crawl so the maritime picture is not frozen. Port Sudan, Suakin, Assab, Jebel Ali, Suez, Fujairah are nodes. Chad–West Darfur and Kufra–Darfur lines are reported desert-track geometry. External-sponsor airlift remains a reported/contested class unless independently documented at a named public airfield across successive sweeps. Throughput is unmeasured.",
  });

  sections.push({
    id: "posture",
    kicker: "8. Force posture",
    title: "What this window does not show",
    body:
      "No independently verified reserve commitment, culmination, or command collapse this cycle. " +
      s.picture.c2 +
      " " +
      s.picture.initiative +
      " Unit designations, precise battery locations, and active-force coordinates that could facilitate real-world targeting are generalized to named cities or omitted. Presence at a public airfield or port node is not occupancy of a unit.",
  });

  const saf = ACTORS.find((a) => a.id === "saf")!;
  const rsf = ACTORS.find((a) => a.id === "rsf")!;
  sections.push({
    id: "info",
    kicker: "9. Information war / narratives",
    title: "Claims vs evidence",
    body: `SAF information line: ${saf.info} RSF information line: ${rsf.info} Headlines in this cycle are ingested as reporting — the full Sudan wire, not a conflict-only filter. They are not upgraded to corroborated because they are numerous. Official military claims, local-source claims, and wire copy sit in different claim classes. Competing explanations stay on the page until independent families agree.`,
    bullets: newsSlice.slice(0, 12).map((n) => `${n.source}: ${n.title}`),
  });

  sections.push({
    id: "op",
    kicker: "10. Operational assessment",
    title: "Campaign, not incidents",
    body:
      s.meaning +
      " FM 3-90 language in this product is descriptive only: we may label a reported sequence as resembling an envelopment or a defense of a named urban area. That is an analytical metaphor, not an order of battle and not a recommendation. The campaign remains a multi-year contest over cities, corridors, and external sustainment.",
  });

  sections.push({
    id: "strat",
    kicker: "11. Strategic / political",
    title: "Purpose, sponsors, civilians",
    body:
      s.political +
      " Neighboring capitals (Cairo, N'Djamena, Addis, Abu Dhabi, Tripoli) appear in this workbench as public sites and reported corridors, not as confirmed belligerents in this cycle. Civilian harm, displacement, and hospital/market pins are the humanitarian baseline. They are not a side note to the military picture.",
  });

  sections.push({
    id: "forecast",
    kicker: "12. Forecast — next 24–72 hours",
    title: "Scenarios, not predictions",
    body: `MOST LIKELY (50–70%): ${s.forecast.mostLikely} SIGNIFICANT ALTERNATIVE (20–40%): ${s.forecast.alt} LOW-PROBABILITY / HIGH-IMPACT (<20%): ${s.forecast.lowProb} These bands are qualitative. They are not targeting probabilities.`,
    bullets: s.forecast.watch.map((w) => `Watch: ${w}`),
  });

  sections.push({
    id: "gaps",
    kicker: "13. Intelligence gaps",
    title: "What we do not know",
    body:
      "The following are first-order unknowns. Filling them would change the assessment; guessing them would corrupt it. " +
      s.gaps.join(" "),
    bullets: s.gaps,
  });

  sections.push({
    id: "conf",
    kicker: "14. Confidence summary",
    title: "Quality of judgment, not probability",
    body: `Overall ${s.overallConfidence}. HIGH: ${s.high.join("; ")}. MODERATE: ${s.moderate.join("; ")}. LOW: ${s.low.join("; ")}. Confidence here describes the quality of the evidence, not the chance a future event occurs. A high-confidence statement can still be wrong; a low-confidence statement can still be important.`,
  });

  return {
    generatedAt: s.generatedAt,
    window: `${s.windowStart} – ${s.windowEnd}`,
    overall: s.overallConfidence,
    sections,
    annotations,
  };
}

export function circlePoly(lat: number, lon: number, km: number, steps = 36): number[][] {
  const ring: number[][] = [];
  const dLat = km / 111;
  const dLon = km / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lon + Math.cos(a) * dLon, lat + Math.sin(a) * dLat]);
  }
  return ring;
}

export type { SitrepDev };
