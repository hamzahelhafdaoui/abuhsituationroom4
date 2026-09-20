import { createServerFn } from "@tanstack/react-start";
import { createRequestCache } from "@/lib/request-cache";
import { AIRFIELDS, FLIGHTS, SITES, THERMAL } from "@/data/catalog";
import { inAoi, nearest } from "@/lib/geo";
import { pullNews } from "@/lib/news";
import { allVessels } from "@/lib/traffic";
import { pullFeeds, pullGdelt, pullOsm, pullTicker } from "@/lib/warroom";
import type {
  AirCategory,
  Citation,
  FlightEvent,
  LiveBundle,
  LiveMeta,
  ThermalClass,
  ThermalEvent,
  VesselEvent,
} from "@/lib/types";
import { AOI } from "@/lib/types";

const UA =
  "AbuHureirahSitroom/1.0 (civilian public-data archive; documentation only)";

const cached = createRequestCache();
const TTL_MS = 90_000;
const retryAfter = new Map<string, number>();

async function fetchText(url: string, ms = 12000): Promise<string> {
  const origin = new URL(url).origin;
  if ((retryAfter.get(origin) ?? 0) > Date.now()) throw new Error("Provider rate-limit cooldown");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/plain, application/json, */*", "User-Agent": UA },
      signal: ctrl.signal,
    });
    if (res.status === 429) {
      const header = res.headers.get("retry-after") ?? "";
      const seconds = /^\d+$/.test(header) ? Number(header) : (Date.parse(header) - Date.now()) / 1000;
      retryAfter.set(origin, Date.now() + Math.min(3600, Math.max(60, Number.isFinite(seconds) ? seconds : 60)) * 1000);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function meta(
  source: string,
  count: number,
  note: string,
  status: LiveMeta["status"] = "ok",
): LiveMeta {
  return {
    fetchedAt: new Date().toISOString(),
    recordCount: count,
    status: count === 0 && status === "ok" ? "empty" : status,
    source,
    note,
  };
}

function classifyThermal(
  lat: number,
  lon: number,
  frp: number,
  daynight: "D" | "N",
): ThermalClass {
  const near = nearest(lat, lon, SITES, 8);
  if (!near) return "unknown";
  const kind = near.item.kind;
  if (kind === "farm") return "agricultural";
  if (near.item.id === "heglig") return "industrial";
  if (kind === "hospital" || kind === "camp" || kind === "market") {
    return frp >= 10 ? "possible_explosive" : "urban_structure";
  }
  if (kind === "port" || kind === "logistics") {
    return frp >= 40 ? "industrial" : "unknown";
  }
  if (daynight === "N" && kind === "airfield" && frp >= 8) return "unknown";
  return "unknown";
}

function parseFirmsCsv(csv: string, satellite: string): ThermalEvent[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iLat = idx("latitude");
  const iLon = idx("longitude");
  const iDate = idx("acq_date");
  const iTime = idx("acq_time");
  const iConf = idx("confidence");
  const iFrp = idx("frp");
  const iDn = idx("daynight");
  const iSat = idx("satellite");
  const out: ThermalEvent[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = (lines[i] ?? "").split(",");
    const lat = Number(cols[iLat]);
    const lon = Number(cols[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) continue;
    const frp = Number(cols[iFrp] ?? 0) || 0;
    const daynight = ((cols[iDn] ?? "D") === "N" ? "N" : "D") as "D" | "N";
    const site = nearest(lat, lon, SITES, 6);
    out.push({
      id: `live-th-${satellite}-${cols[iDate]}-${cols[iTime]}-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      lat,
      lon,
      acqDate: cols[iDate] ?? "",
      acqTime: String(cols[iTime] ?? "").padStart(4, "0"),
      satellite: cols[iSat] || satellite,
      confidence: String(cols[iConf] ?? ""),
      frp,
      daynight,
      klass: classifyThermal(lat, lon, frp, daynight),
      siteId: site?.item.id,
      live: true,
    });
  }
  return out;
}

async function pullFirms(): Promise<{ rows: ThermalEvent[]; meta: LiveMeta }> {
  const urls = [
    {
      sat: "NOAA-20",
      url: "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv",
    },
    {
      sat: "NOAA-21",
      url: "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_Global_24h.csv",
    },
  ];
  const collected: ThermalEvent[] = [];
  const notes: string[] = [];
  for (const u of urls) {
    try {
      const csv = await fetchText(u.url, 14000);
      const rows = parseFirmsCsv(csv, u.sat);
      collected.push(...rows);
      notes.push(`${u.sat} ${rows.length}`);
    } catch (err) {
      notes.push(`${u.sat} fail`);
      console.warn("[firms]", u.sat, err);
    }
  }
  const dedup = new Map<string, ThermalEvent>();
  for (const r of collected) {
    const k = `${r.acqDate}-${r.lat.toFixed(3)}-${r.lon.toFixed(3)}`;
    const prev = dedup.get(k);
    if (!prev || r.frp > prev.frp) dedup.set(k, r);
  }
  const rows = [...dedup.values()]
    .filter((r) => {
      if (nearest(r.lat, r.lon, SITES, 40)) return true;
      return r.frp >= 14 && r.daynight === "N";
    })
    .sort((a, b) => b.frp - a.frp)
    .slice(0, 420);
  if (rows.length === 0) {
    return {
      rows: THERMAL.map((t) => ({ ...t, live: false })),
      meta: meta(
        "NASA FIRMS VIIRS 24h CSV (archive fallback)",
        THERMAL.length,
        "Live FIRMS CSV unreachable. Showing curated archive points. FIRMS is a thermal-anomaly feed, not a strike feed.",
        "stale",
      ),
    };
  }
  return {
    rows,
    meta: meta(
      "NASA FIRMS VIIRS 24h public CSV",
      rows.length,
      `Deduped VIIRS NOAA-20/21 in AOI (${notes.join(", ")}). Thermal anomaly ≠ strike. Optical follow-up required before any combat-related label above possible.`,
    ),
  };
}

function classifyAirframe(type: string, category?: string): AirCategory {
  const t = (type || "").toUpperCase();
  if (/IL76|IL-76|A50|C17|C-17|C130|C-130|A400|AN12|AN-12|AN124|AN-124|Y20|Y-20|B763F|B77L|A33F|MD11/.test(t))
    return "cargo";
  if (/KC135|K35R|IL78|A330MRTT|K35/.test(t)) return "tanker";
  if (/GLF|GLEX|CL60|C56X|FA7X|FA50|E55P|GL5T|GA6C|C700/.test(t)) return "bizjet";
  if (/A31|A32|A33|B73|B77|B78|E19|E29|AT7|DH8|C208|B350/.test(t)) return "pax";
  if (category?.startsWith("A7") || category === "C3") return "cargo";
  return "unknown";
}

function nearestAirfieldName(lat: number, lon: number): string {
  const n = nearest(lat, lon, AIRFIELDS, 80);
  if (!n) return "none in 80 km (ADS-B gap possible)";
  return `${n.item.name} (~${n.km.toFixed(0)} km)`;
}

interface RawAc {
  hex?: string;
  flight?: string;
  r?: string;
  t?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | string;
  gs?: number;
  track?: number;
  category?: string;
}

function inferRoute(ac: RawAc, lat: number, lon: number, track?: number): { origin: string; dest: string } {
  const near = nearestAirfieldName(lat, lon);
  const call = (ac.flight || "").trim();
  const inUaeBox = lat >= 22.45 && lat <= 26.55 && lon >= 51.35 && lon <= 56.65;
  const inAfricaBox = !inUaeBox && lat >= -1.2 && lat <= 32.8 && lon >= 9.5 && lon <= 51.5;
  const origin = inUaeBox
    ? (near.startsWith("none") ? "UAE FIR" : near)
    : /^A6-/i.test(ac.r || "")
      ? "UAE registry (position not in UAE FIR)"
      : "unreconstructed";
  let dest = "unreconstructed";
  if (inAfricaBox && (inUaeBox || origin !== "unreconstructed")) dest = near.startsWith("none") ? "African airspace" : near;
  if (inUaeBox && track != null && track >= 170 && track <= 310) dest = "west/southwest of UAE (Africa heading)";
  if (/\b(ETD|UAE|FDB)\b/i.test(call) && inAfricaBox) dest = near;
  return { origin, dest };
}

function toFlight(ac: RawAc, source: string): FlightEvent | null {
  const lat = Number(ac.lat);
  const lon = Number(ac.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) return null;
  const typeCode = (ac.t || "UNK").toUpperCase();
  const category = classifyAirframe(typeCode, ac.category);
  const callsign = (ac.flight || "").trim();
  const alt = typeof ac.alt_baro === "number" ? ac.alt_baro : Number(ac.alt_baro);
  const now = new Date().toISOString();
  const route = inferRoute(ac, lat, lon, ac.track);
  return {
    id: `live-fl-${(ac.hex || `${lat}-${lon}`).toLowerCase()}`,
    hex: (ac.hex || "unknown").toLowerCase(),
    reg: ac.r || "unknown",
    typeCode,
    operator: callsign || "unknown",
    category,
    origin: route.origin,
    dest: route.dest,
    firstSeen: now,
    lastSeen: now,
    lat,
    lon,
    altFt: Number.isFinite(alt) ? alt : undefined,
    track: ac.track,
    gs: ac.gs,
    nearestAirfield: nearestAirfieldName(lat, lon),
    notes: `Live ${source}. Category is airframe-typical, not a payload claim. ADS-B in this region is sparse — absence of a track is not absence of a flight.`,
    confidence: 1,
    relevant: true,
    live: true,
    military: category === "cargo" || category === "tanker" || /IL76|C130|C17|A400|AN12|KC135/.test(typeCode),
  };
}

async function pullAdsbPoint(lat: number, lon: number, dist: number): Promise<RawAc[]> {
  const urls = [
    `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist}`,
    `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${dist}`,
  ];
  for (const url of urls) {
    try {
      const text = await fetchText(url, 10000);
      const json = JSON.parse(text) as { ac?: RawAc[] };
      if (Array.isArray(json.ac)) return json.ac;
    } catch (err) {
      console.warn("[adsb]", url, err);
    }
  }
  return [];
}

async function pullOpenSky(): Promise<RawAc[]> {
  const url = `https://opensky-network.org/api/states/all?lamin=${AOI.south}&lomin=${AOI.west}&lamax=${AOI.north}&lomax=${AOI.east}`;
  try {
    const text = await fetchText(url, 10000);
    const json = JSON.parse(text) as { states?: unknown[][] };
    const states = json.states ?? [];
    return states.map((s) => ({
      hex: String(s[0] ?? ""),
      flight: String(s[1] ?? ""),
      r: "",
      t: "",
      lon: Number(s[5]),
      lat: Number(s[6]),
      alt_baro: typeof s[7] === "number" ? Math.round(Number(s[7]) * 3.28084) : undefined,
      track: typeof s[10] === "number" ? Number(s[10]) : undefined,
      gs: typeof s[9] === "number" ? Math.round(Number(s[9]) * 1.94384) : undefined,
    }));
  } catch (err) {
    console.warn("[opensky]", err);
    return [];
  }
}

function pullFlights(): Promise<{ rows: FlightEvent[]; meta: LiveMeta }> {
  // Shared by both the bundle sweep and the traffic endpoint.
  return cached("flight-observations", 60_000, pullFlightsUncached);
}

async function pullFlightsUncached(): Promise<{ rows: FlightEvent[]; meta: LiveMeta }> {
  const points: [number, number, number][] = [
    [15.6, 32.5, 380],
    [13.6, 25.3, 380],
    [19.5, 37.2, 320],
    [14.0, 35.4, 280],
    [12.05, 24.88, 280],
    [15.47, 36.4, 240],
    [30.1, 31.4, 280],
    [24.2, 23.3, 300],
    [12.1, 15.0, 260],
    [24.45, 54.65, 280],
    [25.25, 55.36, 220],
    [25.11, 56.33, 180],
    [2.03, 45.32, 260],
    [10.4, 44.94, 220],
    [13.07, 42.65, 220],
    [21.5, 39.15, 260],
    [29.0, 32.55, 200],
  ];
  const raw: RawAc[] = [];
  let source = "adsb.lol / adsb.fi";
  // Bound fan-out to three calls; don't launch every region simultaneously.
  for (let i = 0; i < points.length; i += 3) {
    const results = await Promise.all(points.slice(i, i + 3).map(([la, lo, d]) => pullAdsbPoint(la, lo, d)));
    for (const batch of results) raw.push(...batch);
  }
  if (raw.length === 0) {
    const sky = await pullOpenSky();
    raw.push(...sky);
    source = "OpenSky Network (anonymous)";
  }
  const seen = new Set<string>();
  const rows: FlightEvent[] = [];
  for (const ac of raw) {
    const fl = toFlight(ac, source);
    if (!fl || seen.has(fl.hex)) continue;
    seen.add(fl.hex);
    rows.push(fl);
  }
  if (rows.length === 0) {
    return {
      rows: FLIGHTS.map((f) => ({ ...f, live: false })),
      meta: meta(
        "Archive sample (live ADS-B empty)",
        FLIGHTS.length,
        "No live state vectors in the AOI. ADS-B coverage in Sudan, Darfur, and the desert corridors is sparse. Showing the curated archive so the review workflow still runs. Absence of a track is not absence of a flight.",
        "gap",
      ),
    };
  }
  return {
    rows,
    meta: meta(
      source,
      rows.length,
      "Live positions are ADS-B only. Large parts of Darfur, Kordofan, and the Libya tracks are coverage gaps. Category is typical for the airframe, never a cargo claim.",
      rows.length < 3 ? "gap" : "ok",
    ),
  };
}

async function pullReports(): Promise<{ rows: Citation[]; meta: LiveMeta }> {
  const url =
    "https://api.reliefweb.int/v1/reports?appname=ahsr-sudan&profile=lite&limit=8&sort[]=date:desc&filter[field]=primary_country&filter[value]=sdn";
  try {
    const text = await fetchText(url, 10000);
    const json = JSON.parse(text) as {
      data?: {
        id: string;
        fields?: {
          title?: string;
          url?: string;
          date?: { created?: string };
          source?: { name?: string }[];
        };
      }[];
    };
    const rows: Citation[] = (json.data ?? []).map((d) => ({
      id: `rw-${d.id}`,
      title: d.fields?.title || "ReliefWeb report",
      publisher: d.fields?.source?.[0]?.name || "ReliefWeb",
      date: (d.fields?.date?.created || "").slice(0, 10),
      url: d.fields?.url || "https://reliefweb.int/",
      reliability: "high" as const,
      note: "Humanitarian reporting. Corroboration, not ground truth.",
    }));
    return {
      rows,
      meta: meta(
        "ReliefWeb public API",
        rows.length,
        "Sudan-tagged humanitarian reports. Corroboration layer only.",
      ),
    };
  } catch (err) {
    console.warn("[reliefweb]", err);
    return {
      rows: [],
      meta: meta("ReliefWeb public API", 0, "Unreachable this cycle.", "error"),
    };
  }
}

async function pullVessels(): Promise<{ rows: VesselEvent[]; meta: LiveMeta }> {
  const rows = allVessels();
  return {
    rows,
    meta: meta(
      "Port nodes + documented Red Sea / Aden lane animation",
      rows.length,
      "No keyless global AIS snapshot is wired. Port nodes are real harbours. Moving markers follow published shipping lanes so the maritime picture is not frozen — they are NOT live AIS contacts. Absence of a contact is not absence of a vessel.",
      "gap",
    ),
  };
}

export const getLiveBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveBundle> => {
    return cached("live-bundle", TTL_MS, async () => {
      const [firms, flights, reports, news, gdelt, osm, feeds, vessels] = await Promise.all([
        pullFirms(),
        pullFlights(),
        pullReports(),
        pullNews(),
        pullGdelt(),
        pullOsm(),
        pullFeeds(),
        pullVessels(),
      ]);
      const ticker = await pullTicker(
        news.items.map((n) => ({ source: n.source, title: n.title, url: n.url })),
      );
      return {
        firms: firms.rows,
        firmsMeta: firms.meta,
        flights: flights.rows,
        flightsMeta: flights.meta,
        reports: reports.rows,
        reportsMeta: reports.meta,
        news: news.items,
        newsPoints: news.points,
        newsMeta: news.meta,
        gdelt: gdelt.rows,
        gdeltMeta: gdelt.meta,
        osm: osm.rows,
        osmMeta: osm.meta,
        feeds: feeds.rows,
        feedsMeta: feeds.meta,
        ticker,
        vessels: vessels.rows,
        vesselsMeta: vessels.meta,
      };
    });
  },
);

export const getTraffic = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    flights: FlightEvent[];
    flightsMeta: LiveMeta;
    vessels: VesselEvent[];
    vesselsMeta: LiveMeta;
  }> => {
    return cached("traffic", 18_000, async () => {
      const [flights, vessels] = await Promise.all([pullFlights(), pullVessels()]);
      return {
        flights: flights.rows,
        flightsMeta: flights.meta,
        vessels: vessels.rows,
        vesselsMeta: vessels.meta,
      };
    });
  },
);
