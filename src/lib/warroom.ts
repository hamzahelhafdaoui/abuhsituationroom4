import { createServerFn } from "@tanstack/react-start";
import { GDELT_ARCHIVE, OSM_SEED, FEED_CHANNELS, FEED_SEED } from "@/lib/warroom-data";
import { isUsefulOsm } from "@/lib/control";
import { inAoi } from "@/lib/geo";
import { geocodePlace } from "@/lib/osint";
import type { FeedItem, GdeltEvent, LiveMeta, OsmSite, TickerItem } from "@/lib/types";

const UA = "AbuHureirahSitroom/1.0 (civilian public-data archive; documentation only)";

type CacheEntry<T> = { at: number; value: T };
const mem = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = mem.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value);
  const inflight = pending.get(key) as Promise<T> | undefined;
  if (inflight) return inflight;
  const p = fn()
    .then((value) => {
      mem.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}

async function fetchText(url: string, ms = 12000, extra: HeadersInit = {}): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { Accept: "*/*", "User-Agent": UA, ...extra },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function meta(source: string, count: number, note: string, status: LiveMeta["status"] = "ok"): LiveMeta {
  return {
    fetchedAt: new Date().toISOString(),
    recordCount: count,
    status: count === 0 && status === "ok" ? "empty" : status,
    source,
    note,
  };
}

export { OSM_SEED, GDELT_ARCHIVE, FEED_CHANNELS } from "@/lib/warroom-data";

function subtypeFamily(subtype: string): string {
  const s = subtype.toLowerCase();
  if (s.includes("air") || s.includes("drone") || s.includes("airlift")) return "Air activity";
  if (s.includes("vehicle") || s.includes("convoy")) return "Vehicle movement";
  if (s.includes("cargo") || s.includes("port")) return "Cargo movement";
  if (s.includes("displac")) return "Displacement";
  if (s.includes("control")) return "Control change";
  if (s.includes("harm") || s.includes("civilian")) return "Civilian harm";
  if (s.includes("report")) return "Reporting";
  if (s.includes("force")) return "Use of Force";
  return "Armed clash";
}

function mergeOsm(live: OsmSite[]): OsmSite[] {
  const seen = new Set<string>();
  const out: OsmSite[] = [];
  for (const row of [...live, ...OSM_SEED]) {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
    if (!inAoi(row.lat, row.lon)) continue;
    if (!isUsefulOsm(row)) continue;
    const k = `${row.id}|${row.lat.toFixed(3)}|${row.lon.toFixed(3)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

function mergeGdelt(live: GdeltEvent[]): GdeltEvent[] {
  const seen = new Set<string>();
  const out: GdeltEvent[] = [];
  for (const row of [...live, ...GDELT_ARCHIVE]) {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
    if (!inAoi(row.lat, row.lon)) continue;
    const k = row.id || `${row.date}|${row.lat.toFixed(3)}|${row.lon.toFixed(3)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

async function pullOsmLive(): Promise<OsmSite[]> {
  const boxes = [
    [8.4, 20.2, 24.8, 39.2],
    [20.0, 9.5, 32.8, 34.0],
    [-1.0, 41.0, 14.0, 51.6],
    [22.4, 51.5, 26.6, 56.8],
  ];
  const rows: OsmSite[] = [];
  const seen = new Set<string>();
  for (const [s, w, n, e] of boxes) {
    const query = `
[out:json][timeout:22];
(
  node["aeroway"~"aerodrome|airstrip|helipad"](${s},${w},${n},${e});
  way["aeroway"~"aerodrome|airstrip"](${s},${w},${n},${e});
  node["military"](${s},${w},${n},${e});
  way["landuse"="military"](${s},${w},${n},${e});
  node["harbour"](${s},${w},${n},${e});
  node["highway"="border_crossing"](${s},${w},${n},${e});
);
out center 180;
`.trim();
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(24000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        elements?: Array<{
          type: string;
          id: number;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: Record<string, string>;
        }>;
      };
      for (const el of json.elements ?? []) {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null || !inAoi(lat, lon)) continue;
        const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const tags = el.tags ?? {};
        const name = tags["name:en"] || tags.name || tags.operator || tags.military || tags.aeroway || "OSM site";
        const mil = tags.military || tags.landuse;
        const aero = tags.aeroway;
        let kind = "compound";
        if (aero === "aerodrome") kind = "airfield";
        else if (aero === "airstrip" || aero === "helipad") kind = "strip";
        else if (mil === "airfield") kind = "airfield";
        else if (mil === "barracks" || mil === "base") kind = "base";
        else if (mil === "checkpoint") kind = "checkpoint";
        else if (tags.highway === "border_crossing") kind = "crossing";
        else if (tags.harbour) kind = "port";
        else if (mil) kind = "base";
        rows.push({
          id: `osm-${el.type}-${el.id}`,
          name,
          kind,
          lat,
          lon,
          country: "TH",
          source: "osm",
        });
      }
    } catch (err) {
      console.warn("[overpass]", s, w, err);
    }
  }
  return rows;
}

export async function pullOsm(): Promise<{ rows: OsmSite[]; meta: LiveMeta }> {
  return cached("osm-bases", 6 * 60 * 60_000, async () => {
    try {
      const live = await pullOsmLive();
      const rows = mergeOsm(live);
      return {
        rows,
        meta: meta(
          "OpenStreetMap Overpass + OurAirports",
          rows.length,
          `Live OSM ${live.length} · seed ${OSM_SEED.length}. Public mapped infrastructure, not occupancy. Cached 6h.`,
          live.length ? "ok" : "stale",
        ),
      };
    } catch (err) {
      const rows = mergeOsm([]);
      return {
        rows,
        meta: meta(
          "OurAirports / compiled OSM (live Overpass unreachable)",
          rows.length,
          err instanceof Error ? err.message : "Overpass failed",
          "stale",
        ),
      };
    }
  });
}

interface GeoFeat {
  geometry?: { coordinates?: number[] };
  properties?: { name?: string; count?: number; url?: string; html?: string };
  lat?: number;
  lon?: number;
  name?: string;
  count?: number;
}

async function pullGdeltLive(): Promise<GdeltEvent[]> {
  const url =
    "https://api.gdeltproject.org/api/v2/geo/geo?query=" +
    encodeURIComponent("(Sudan OR Darfur OR Khartoum OR RSF OR SAF OR Kufra OR Adre OR Asosa OR Berbera OR Assab) (attack OR clash OR airstrike OR shelling OR displaced OR airlift)") +
    "&mode=PointData&format=GeoJSON&maxpoints=200&timespan=14d";
  const text = await fetchText(url, 14000);
  let feats: GeoFeat[] = [];
  try {
    const json = JSON.parse(text) as { features?: GeoFeat[] } | GeoFeat[];
    feats = Array.isArray(json) ? json : (json.features ?? []);
  } catch {
    return [];
  }
  const rows: GdeltEvent[] = [];
  const seen = new Set<string>();
  for (const f of feats) {
    const coords = f.geometry?.coordinates;
    const lat = Number(f.lat ?? coords?.[1]);
    const lon = Number(f.lon ?? coords?.[0]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) continue;
    const name = f.properties?.name || f.name || "Sudan";
    const key = `${lat.toFixed(2)}|${lon.toFixed(2)}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const today = new Date().toISOString().slice(0, 10);
    rows.push({
      id: `gdelt-live-${key.replace(/[^a-z0-9]+/gi, "-").slice(0, 48)}`,
      name,
      actor: "unattributed in GDELT",
      date: today,
      subtype: subtypeFamily(name + " " + (f.properties?.html ?? "")),
      country: "Sudan",
      notes: "GDELT GEO 2.0 named-place centroid for the last 14 days. Media geolocation, not an incident coordinate. Not a targeting feed.",
      lat,
      lon,
      source: "gdelt",
      live: true,
      url: f.properties?.url,
    });
  }
  return rows;
}

export async function pullGdelt(): Promise<{ rows: GdeltEvent[]; meta: LiveMeta }> {
  return cached("gdelt-conflicts", 15 * 60_000, async () => {
    try {
      const live = await pullGdeltLive();
      const rows = mergeGdelt(live);
      return {
        rows,
        meta: meta(
          "GDELT GEO 2.0 + 2022–2026 compiled archive",
          rows.length,
          `Live GDELT ${live.length} · archive ${GDELT_ARCHIVE.length}. Named-place centroids. Cached 15 min.`,
          live.length ? "ok" : "stale",
        ),
      };
    } catch (err) {
      const rows = mergeGdelt([]);
      return {
        rows,
        meta: meta(
          "2022–2026 compiled GDELT-style archive (live unreachable)",
          rows.length,
          err instanceof Error ? err.message : "GDELT failed",
          "stale",
        ),
      };
    }
  });
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapeChannel(channel: string): Promise<FeedItem[]> {
  const html = await fetchText(`https://t.me/s/${channel}`, 10000);
  const blocks = html.split('class="tgme_widget_message_wrap');
  const rows: FeedItem[] = [];
  for (const b of blocks.slice(1, 18)) {
    const textMatch = b.match(/class="tgme_widget_message_text"[^>]*>([\s\S]*?)<\/div>/i);
    const timeMatch = b.match(/datetime="([^"]+)"/);
    const hrefMatch = b.match(/class="tgme_widget_message_date"[^>]*href="([^"]+)"/);
    const text = textMatch ? decode(textMatch[1]) : "";
    if (text.length < 12) continue;
    const timestamp = timeMatch?.[1] ?? new Date().toISOString();
    const url = hrefMatch?.[1] ?? `https://t.me/${channel}`;
    const geo = geocodePlace(text);
    rows.push({
      id: `tg-${channel}-${url.split("/").pop() ?? rows.length}`,
      url,
      source: "telegram",
      channel,
      text: text.slice(0, 900),
      timestamp,
      hasMedia: /tgme_widget_message_photo|tgme_widget_message_video/.test(b),
      lat: geo?.lat,
      lon: geo?.lon,
      place: geo?.name,
    });
  }
  return rows;
}

export async function pullFeeds(): Promise<{ rows: FeedItem[]; meta: LiveMeta }> {
  return cached("tg-feeds", 2 * 60_000, async () => {
    const batches = await Promise.all(
      FEED_CHANNELS.map(async (ch) => {
        try {
          return await scrapeChannel(ch.id);
        } catch {
          return [] as FeedItem[];
        }
      }),
    );
    const rows = batches
      .flat()
      .concat(FEED_SEED)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    const seen = new Set<string>();
    const dedup = rows.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    }).slice(0, 120);
    return {
      rows: dedup,
      meta: meta(
        "Public Telegram web previews (t.me/s)",
        dedup.length,
        "Sudan-relevant public channels. Preview scrape, not a login. Rate-limited. Seed notes fill the gap when t.me blocks.",
        batches.some((b) => b.length) ? "ok" : "stale",
      ),
    };
  });
}

export async function pullTicker(news: TickerItem[]): Promise<TickerItem[]> {
  const extraUrls = [
    "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
  ];
  const extra: TickerItem[] = [...news];
  for (const url of extraUrls) {
    try {
      const xml = await fetchText(url, 8000);
      const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
      for (const b of blocks.slice(0, 12)) {
        const title = decode((b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""));
        const link = decode((b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? ""));
        if (!title) continue;
        if (!/sudan|darfur|khartoum|rsf|saf |kordofan|port sudan/i.test(title)) continue;
        extra.push({
          source: url.includes("bbc") ? "BBC Africa" : "Al Jazeera",
          title,
          url: link || url,
        });
      }
    } catch {
      /* optional */
    }
  }
  const seen = new Set<string>();
  const out: TickerItem[] = [];
  for (const t of extra) {
    if (seen.has(t.title)) continue;
    seen.add(t.title);
    out.push(t);
  }
  return out.slice(0, 40);
}

export const getWarRoomBundle = createServerFn({ method: "GET" }).handler(async () => {
  const [osm, gdelt, feeds] = await Promise.all([pullOsm(), pullGdelt(), pullFeeds()]);
  return { osm, gdelt, feeds };
});
