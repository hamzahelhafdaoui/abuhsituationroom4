import { ALERTS } from "@/data/catalog";
import type { DetectHit } from "@/lib/imagery-detect";
import type { OsintReport } from "@/lib/osint";
import type { ChipFeatures, ModelKlass } from "@/lib/chip-model";
import type { Alert, AlertType, Confidence, IndicatorFamily, ReviewState } from "@/lib/types";

export type FlagKind = "published" | "auto" | "archive";
export type ListOrder = "newest" | "oldest";

export interface Flag {
  id: string;
  title: string;
  body: string;
  lat: number;
  lon: number;
  date: string;
  type: AlertType | "report";
  kind: FlagKind;
  sourceLabel: string;
  url?: string;
  confidence: Confidence;
  families: IndicatorFamily[];
  siteId?: string;
  review: ReviewState;
  features?: ChipFeatures;
  modelKlass?: ModelKlass;
}

export function sortByOrder<T>(rows: T[], order: ListOrder, key: (t: T) => string): T[] {
  const dir = order === "newest" ? -1 : 1;
  return [...rows].sort((a, b) => dir * key(a).localeCompare(key(b)));
}

function catType(cat: OsintReport["category"]): AlertType | "report" {
  if (cat === "strike-damage") return "damage";
  if (cat === "vehicle-buildup") return "convoy";
  if (cat === "air-activity") return "flight";
  if (cat === "control-change") return "change";
  return "report";
}

export function reportsToFlags(reports: OsintReport[]): Flag[] {
  return reports.map((r) => ({
    id: `flag-rep-${r.id}`,
    title: r.title,
    body: `${r.summary} ${r.sourceLabel}. Observation for review — not an identification.`,
    lat: r.lat,
    lon: r.lon,
    date: `${r.date}T12:00:00Z`,
    type: catType(r.category),
    kind: "published" as const,
    sourceLabel: r.sourceLabel,
    url: r.sourceUrl,
    confidence: r.confidence,
    families: r.category === "strike-damage"
      ? ["damage", "reporting"]
      : r.category === "vehicle-buildup"
        ? ["vehicles", "reporting"]
        : r.category === "air-activity"
          ? ["flight", "reporting"]
          : ["reporting"],
    review: "unreviewed",
  }));
}

export function alertsToFlags(alerts: Alert[]): Flag[] {
  return alerts.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    lat: a.lat,
    lon: a.lon,
    date: a.datetime,
    type: a.type,
    kind: "archive" as const,
    sourceLabel: "archive",
    confidence: a.confidence,
    families: a.families,
    siteId: a.siteIds[0],
    review: a.review,
  }));
}

export function detectToFlags(hits: DetectHit[]): Flag[] {
  const out: Flag[] = [];
  for (const h of hits) {
    if (h.id.startsWith("det-rep-")) continue;
    const scan = h.id.startsWith("det-scan-");
    const keep =
      scan ||
      h.hunts.includes("irreg") ||
      h.hunts.includes("rsf") ||
      h.hunts.includes("chain") ||
      h.hunts.includes("fx") ||
      h.hunts.includes("veh") ||
      (h.confidence >= 2 &&
        (h.klass === "cargo_yard" ||
          h.klass === "vehicle_park" ||
          h.klass === "maritime" ||
          h.klass === "irregular_pad" ||
          h.klass === "possible_damage" ||
          h.klass === "airfield_activity" ||
          h.klass === "camp_buildup" ||
          h.klass === "burn_scar" ||
          h.klass === "wreck_air" ||
          h.klass === "wreck_bldg"));
    if (!keep) continue;
    out.push({
      id: `flag-${h.id}`,
      title: h.title,
      body: h.body,
      lat: h.lat,
      lon: h.lon,
      date: h.date,
      type:
        h.klass === "possible_damage" || h.klass === "burn_scar" || h.klass === "wreck_air" || h.klass === "wreck_bldg"
          ? "damage"
          : h.klass === "airfield_activity" || h.klass === "maritime"
            ? "flight"
            : h.klass === "vehicle_park" || h.klass === "cargo_yard" || h.klass === "camp_buildup"
              ? "convoy"
              : "change",
      kind: "auto",
      sourceLabel: scan ? "imagery tile sweep" : "auto-find chip",
      confidence: h.confidence,
      families: h.families,
      siteId: h.siteId,
      review: "unreviewed",
      features: h.features,
      modelKlass:
        h.klass === "camp_buildup"
          ? "camp"
          : h.klass === "burn_scar"
            ? "burn"
            : h.klass === "wreck_air"
              ? "wreck_air"
              : h.klass === "wreck_bldg"
                ? "wreck_bldg"
                : h.klass === "vehicle_park"
                  ? "veh"
                  : h.klass === "earthwork"
                    ? "berm"
                    : h.klass === "cargo_yard"
                      ? "cargo"
                      : undefined,
    });
  }
  return out.slice(0, 40);
}

export function mergeFlags(parts: Flag[][], order: ListOrder = "newest"): Flag[] {
  const map = new Map<string, Flag>();
  for (const part of parts) {
    for (const f of part) {
      const prev = map.get(f.id);
      if (!prev || f.date > prev.date) map.set(f.id, f);
    }
  }
  const weight = (f: Flag) => (f.kind === "published" ? 2 : f.kind === "auto" ? 1 : 0);
  return [...map.values()].sort((a, b) => {
    if (order === "newest") {
      const w = weight(b) - weight(a);
      if (w !== 0) return w;
      return b.date.localeCompare(a.date);
    }
    return a.date.localeCompare(b.date);
  });
}

export function seedArchiveFlags(): Flag[] {
  return alertsToFlags(ALERTS);
}
