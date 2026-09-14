import { ALERTS, ARCHIVE_EVENTS, OBSERVATIONS, SITES } from "@/data/catalog";
import { REGIONAL_EVENTS } from "@/data/regional-sites";
import { reportsToLog, SEED_REPORTS } from "@/lib/osint";
import { GDELT_ARCHIVE, gdeltFamily } from "@/lib/warroom-data";
import type { ChangeEntry, LiveBundle } from "@/lib/types";

function siteName(id?: string): string | undefined {
  if (!id) return undefined;
  return SITES.find((s) => s.id === id)?.name;
}

export function seedChangeLog(): ChangeEntry[] {
  const rows: ChangeEntry[] = ALERTS.map((a) => ({
    id: `log-${a.id}`,
    firstSeen: a.datetime,
    lastSeen: a.datetime,
    title: a.title,
    body: a.negativeEvidence ? `${a.body} Negative evidence: ${a.negativeEvidence}` : a.body,
    siteId: a.siteIds[0],
    siteName: siteName(a.siteIds[0]),
    families: a.families,
    source: "archive" as const,
    confidence: a.confidence,
    lat: a.lat,
    lon: a.lon,
    negative: Boolean(a.negativeEvidence),
  }));

  const covered = new Set(ALERTS.flatMap((a) => a.observationIds));
  for (const o of OBSERVATIONS) {
    if (covered.has(o.id)) continue;
    const site = SITES.find((s) => s.id === o.siteId);
    rows.push({
      id: `log-${o.id}`,
      firstSeen: o.datetime,
      lastSeen: o.datetime,
      title: `${site?.name ?? o.siteId} · ${o.sensor}`,
      body: o.notes,
      siteId: o.siteId,
      siteName: site?.name,
      families: o.indicators,
      source: "archive",
      confidence: o.confidence,
      lat: site?.lat ?? 0,
      lon: site?.lon ?? 0,
      negative: o.indicators.includes("thermal") && site?.kind === "farm",
    });
  }

  const have = new Set(rows.map((r) => r.id));
  for (const e of ARCHIVE_EVENTS) {
    if (have.has(e.id)) continue;
    const name = e.siteName || siteName(e.siteId);
    rows.push({ ...e, siteName: name });
    have.add(e.id);
  }
  for (const e of reportsToLog(SEED_REPORTS)) {
    if (have.has(e.id)) continue;
    rows.push(e);
    have.add(e.id);
  }
  for (const e of REGIONAL_EVENTS) {
    if (have.has(e.id)) continue;
    rows.push(e);
    have.add(e.id);
  }
  for (const g of GDELT_ARCHIVE) {
    const id = `log-${g.id}`;
    if (have.has(id)) continue;
    rows.push({
      id,
      firstSeen: `${g.date}T00:00:00Z`,
      lastSeen: `${g.date}T00:00:00Z`,
      title: `${g.subtype} · ${g.name}`,
      body: g.notes,
      families: gdeltFamily(g.subtype),
      source: "gdelt",
      confidence: g.source === "archive" ? 2 : 1,
      lat: g.lat,
      lon: g.lon,
    });
    have.add(id);
  }

  return sortLog(rows);
}

export function sortLog(rows: ChangeEntry[]): ChangeEntry[] {
  return [...rows].sort((a, b) => {
    const c = a.firstSeen.localeCompare(b.firstSeen);
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });
}

function firmsIso(acqDate: string, acqTime: string): string {
  const hh = (acqTime || "0000").padStart(4, "0").slice(0, 2);
  const mm = (acqTime || "0000").padStart(4, "0").slice(2, 4);
  return `${acqDate}T${hh}:${mm}:00Z`;
}

export function ingestLive(bundle: LiveBundle, existing: ChangeEntry[]): { next: ChangeEntry[]; added: number } {
  const byId = new Map(existing.map((e) => [e.id, e]));
  let added = 0;

  const upsert = (entry: ChangeEntry) => {
    const prev = byId.get(entry.id);
    if (!prev) {
      byId.set(entry.id, entry);
      added += 1;
      return;
    }
    const firstSeen = entry.firstSeen < prev.firstSeen ? entry.firstSeen : prev.firstSeen;
    const lastSeen = entry.lastSeen > prev.lastSeen ? entry.lastSeen : prev.lastSeen;
    byId.set(entry.id, { ...prev, firstSeen, lastSeen });
  };

  const agSeen = new Set<string>();
  for (const t of bundle.firms) {
    const when = firmsIso(t.acqDate, t.acqTime);
    const name = siteName(t.siteId) ?? "unanchored";
    if (t.klass === "agricultural") {
      const dayKey = `log-firms-ag-${t.siteId ?? "none"}-${t.acqDate}`;
      if (agSeen.has(dayKey)) continue;
      agSeen.add(dayKey);
      upsert({
        id: dayKey,
        firstSeen: when,
        lastSeen: when,
        title: `Seasonal / agricultural thermal · ${name}`,
        body: `FIRMS cluster classed agricultural (FRP ${t.frp.toFixed(1)}). Default is harvest or residue burning, not combat. Negative evidence unless a later optical scene shows otherwise.`,
        siteId: t.siteId,
        siteName: siteName(t.siteId),
        families: ["thermal"],
        source: "firms",
        confidence: 2,
        lat: t.lat,
        lon: t.lon,
        negative: true,
      });
      continue;
    }
    if (!t.siteId && t.klass === "unknown") continue;
    upsert({
      id: `log-firms-${t.id}`,
      firstSeen: when,
      lastSeen: when,
      title: `Thermal anomaly · ${name}`,
      body: `VIIRS ${t.satellite} FRP ${t.frp.toFixed(1)} · class ${t.klass.replace("_", " ")} · ${t.daynight === "N" ? "night" : "day"}. Thermal anomaly is not a strike. Optical follow-up required.`,
      siteId: t.siteId,
      siteName: siteName(t.siteId),
      families: ["thermal"],
      source: "firms",
      confidence: t.klass === "possible_explosive" ? 2 : 1,
      lat: t.lat,
      lon: t.lon,
    });
  }

  for (const v of bundle.vessels ?? []) {
    if (!v.live) continue;
    upsert({
      id: `log-ves-${v.id}`,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      title: `Maritime contact · ${v.name}`,
      body: `${v.kind} · dest ${v.destination}. ${v.notes} AIS is a public broadcast, not a cargo claim.`,
      families: ["corridor"],
      source: "vessel",
      confidence: 1,
      lat: v.lat,
      lon: v.lon,
    });
  }

  for (const f of bundle.flights) {
    if (!f.relevant) continue;
    upsert({
      id: `log-fl-${f.hex}-${f.firstSeen.slice(0, 13)}`,
      firstSeen: f.firstSeen,
      lastSeen: f.lastSeen,
      title: `${f.typeCode} ${f.hex} · ${f.category}`,
      body: `${f.notes} Nearest: ${f.nearestAirfield}. Category is airframe-typical, not a cargo claim.`,
      families: ["flight"],
      source: "flight",
      confidence: f.confidence,
      lat: f.lat,
      lon: f.lon,
    });
  }

  for (const r of bundle.reports) {
    if (!r.date) continue;
    upsert({
      id: `log-${r.id}`,
      firstSeen: `${r.date}T00:00:00Z`,
      lastSeen: `${r.date}T00:00:00Z`,
      title: r.title,
      body: `${r.publisher}. Humanitarian corroboration, not ground truth. ${r.note}`,
      families: ["reporting"],
      source: "report",
      confidence: 2,
      lat: 15.6,
      lon: 32.5,
    });
  }

  for (const n of bundle.news) {
    if (!n.date) continue;
    upsert({
      id: `log-${n.id}`,
      firstSeen: n.date,
      lastSeen: n.date,
      title: n.title,
      body: `${n.source}. Google News headline. Named-place geolocation is approximate — not an incident coordinate.`,
      families: ["reporting"],
      source: "report",
      confidence: 1,
      lat: 15.5,
      lon: 32.5,
    });
  }

  for (const g of bundle.gdelt ?? []) {
    const when = `${g.date}T00:00:00Z`;
    upsert({
      id: `log-${g.id}`,
      firstSeen: when,
      lastSeen: when,
      title: `${g.subtype} · ${g.name}`,
      body: g.notes,
      families: gdeltFamily(g.subtype),
      source: "gdelt",
      confidence: g.live ? 1 : 2,
      lat: g.lat,
      lon: g.lon,
    });
  }

  for (const f of bundle.feeds ?? []) {
    upsert({
      id: `log-${f.id}`,
      firstSeen: f.timestamp,
      lastSeen: f.timestamp,
      title: `${f.channel} · ${f.text.slice(0, 88)}`,
      body: `${f.text.slice(0, 400)} Public Telegram preview. Single-source until corroborated.`,
      families: ["reporting"],
      source: "feed",
      confidence: 1,
      lat: f.lat ?? 15.5,
      lon: f.lon ?? 32.5,
    });
  }

  return { next: sortLog([...byId.values()]), added };
}
