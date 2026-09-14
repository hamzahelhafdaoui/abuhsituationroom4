import { GAZETTEER } from "@/lib/osint";
import type { Confidence } from "@/lib/types";

export type LiveFamily = "thermal" | "flight" | "report" | "news" | "ai";

export interface Indicator {
  family: LiveFamily;
  lat: number;
  lon: number;
  date?: string | null;
  label: string;
}

export interface CorrelatedAlert {
  key: string;
  title: string;
  place: string;
  lat: number;
  lon: number;
  families: LiveFamily[];
  score: Confidence;
  multiDate: boolean;
  firstSeen: string | null;
  lastSeen: string | null;
  indicatorCount: number;
  components: { family: LiveFamily; count: number; detail: string }[];
}

const ANCHOR_KM = 30;
const GRID_DEG = 0.25;

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const PRECISE = GAZETTEER.filter((g) => g.precise);

function anchorFor(lat: number, lon: number) {
  let best: { d: number; name: string; lat: number; lon: number } | null = null;
  for (const g of PRECISE) {
    const d = haversineKm(lat, lon, g.lat, g.lon);
    if (!best || d < best.d) best = { d, name: g.name, lat: g.lat, lon: g.lon };
  }
  if (best && best.d <= ANCHOR_KM) {
    return { key: `site:${best.name.toLowerCase().replace(/\s+/g, "-")}`, place: best.name, lat: best.lat, lon: best.lon };
  }
  const gLat = Math.round(lat / GRID_DEG) * GRID_DEG;
  const gLon = Math.round(lon / GRID_DEG) * GRID_DEG;
  return {
    key: `grid:${gLat.toFixed(2)},${gLon.toFixed(2)}`,
    place: `${gLat.toFixed(2)}°, ${gLon.toFixed(2)}°`,
    lat: gLat,
    lon: gLon,
  };
}

function dayOf(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function correlateAlerts(indicators: Indicator[]): CorrelatedAlert[] {
  const clusters = new Map<
    string,
    { place: string; lat: number; lon: number; byFamily: Map<LiveFamily, Indicator[]> }
  >();

  for (const ind of indicators) {
    if (!Number.isFinite(ind.lat) || !Number.isFinite(ind.lon)) continue;
    const a = anchorFor(ind.lat, ind.lon);
    let cluster = clusters.get(a.key);
    if (!cluster) {
      cluster = { place: a.place, lat: a.lat, lon: a.lon, byFamily: new Map() };
      clusters.set(a.key, cluster);
    }
    const arr = cluster.byFamily.get(ind.family) ?? [];
    arr.push(ind);
    cluster.byFamily.set(ind.family, arr);
  }

  const alerts: CorrelatedAlert[] = [];
  for (const [key, cluster] of clusters) {
    const families = [...cluster.byFamily.keys()];
    if (families.length < 2) continue;
    const components = [...cluster.byFamily.entries()].map(([family, list]) => ({
      family,
      count: list.length,
      detail: list[0]?.label ?? family,
    }));
    components.sort((a, b) => b.count - a.count);
    const dates = [
      ...new Set(
        [...cluster.byFamily.values()]
          .flat()
          .map((i) => dayOf(i.date))
          .filter((d): d is string => Boolean(d)),
      ),
    ].sort();
    alerts.push({
      key,
      title: `${cluster.place} — ${families.length} indicator families co-occurring`,
      place: cluster.place,
      lat: cluster.lat,
      lon: cluster.lon,
      families: components.map((c) => c.family),
      score: families.length >= 3 ? 4 : 3,
      multiDate: dates.length >= 2,
      firstSeen: dates[0] ?? null,
      lastSeen: dates[dates.length - 1] ?? null,
      indicatorCount: [...cluster.byFamily.values()].reduce((n, l) => n + l.length, 0),
      components,
    });
  }

  alerts.sort(
    (a, b) =>
      b.families.length - a.families.length ||
      b.indicatorCount - a.indicatorCount ||
      Number(b.multiDate) - Number(a.multiDate),
  );
  return alerts;
}
