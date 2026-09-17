import { SITES } from "@/data/catalog";
import { CONTROL_CITIES } from "@/lib/control";
import { huntsFromKlass, isForeignLinked, matchHunts, type HuntId } from "@/lib/hunt";
import { osmVerdictFor } from "@/lib/osm-ai";
import { SEED_REPORTS } from "@/lib/osint";
import { inBbox, nearest, padBbox } from "@/lib/geo";
import { TECHNIQUE_BY_ID } from "@/lib/techniques";
import type {
  Confidence,
  FlightEvent,
  GdeltEvent,
  IndicatorFamily,
  NewsPoint,
  OsmSite,
  ThermalEvent,
  VesselEvent,
  WatchBox,
} from "@/lib/types";
import { DEFAULT_WEIGHTS, featuresFromShape, modelToKlass, predictChip } from "@/lib/chip-model";
import { useAppStore } from "@/lib/store";
import { snapshotUrl } from "@/lib/utils";

export type DetectKlass =
  | "base_compound"
  | "irregular_pad"
  | "cargo_yard"
  | "airfield_activity"
  | "possible_damage"
  | "thermal_cluster"
  | "unresolved_objects"
  | "osm_gap"
  | "vehicle_park"
  | "earthwork"
  | "pol_storage"
  | "camp_grid"
  | "crossing_cue"
  | "maritime"
  | "corridor_track"
  | "reporting_cue"
  | "burn_scar"
  | "wreck_air"
  | "wreck_bldg"
  | "camp_buildup";

export const DETECT_KLASS: Record<
  DetectKlass,
  { label: string; short: string; color: string }
> = {
  base_compound: { label: "Compound / base morphology", short: "PAD", color: "#7b93a6" },
  irregular_pad: { label: "Non-army pad (ETH/TCD review)", short: "IRREG", color: "#c4a35a" },
  cargo_yard: { label: "Yard / cargo in motion", short: "CARGO", color: "#b38862" },
  airfield_activity: { label: "Airfields & strips", short: "AIR", color: "#d8d2c6" },
  possible_damage: { label: "Possible change / damage", short: "BDA", color: "#c4894a" },
  thermal_cluster: { label: "Thermal cluster", short: "THRM", color: "#c4894a" },
  unresolved_objects: { label: "Unresolved compact objects", short: "OBJ", color: "#d4a017" },
  osm_gap: { label: "OSM feature not in archive", short: "OSM", color: "#7ec8b3" },
  vehicle_park: { label: "Vehicle-park morphology", short: "VEH", color: "#c9a27a" },
  earthwork: { label: "Earthwork / berm geometry", short: "BERM", color: "#8a9a6a" },
  pol_storage: { label: "Fuel / storage morphology", short: "POL", color: "#b07a4a" },
  camp_grid: { label: "Camp / tent-grid morphology", short: "CAMP", color: "#7ec8b3" },
  crossing_cue: { label: "Crossing / bridge cue", short: "XING", color: "#8aa4b8" },
  maritime: { label: "Port / ship cue", short: "SEA", color: "#6a8ea8" },
  corridor_track: { label: "Desert track / well", short: "TRACK", color: "#a09070" },
  reporting_cue: { label: "Reporting cue", short: "WIRE", color: "#9a8a78" },
  burn_scar: { label: "Burn / scorch cue", short: "BURN", color: "#c46a3a" },
  wreck_air: { label: "Airframe / hangar damage cue", short: "WRECK", color: "#b07050" },
  wreck_bldg: { label: "Building scrape cue", short: "RUBBLE", color: "#a08060" },
  camp_buildup: { label: "Camp / makeshift-base buildup", short: "CAMP+", color: "#c4a35a" },
};

export type CloudClass = "clear" | "mixed" | "cloudy" | "unknown";

export interface DetectHit {
  id: string;
  klass: DetectKlass;
  title: string;
  body: string;
  lat: number;
  lon: number;
  west: number;
  south: number;
  east: number;
  north: number;
  confidence: Confidence;
  families: IndicatorFamily[];
  techniques: string[];
  explain: string;
  hunts: HuntId[];
  siteId?: string;
  boxId?: string;
  cloud: CloudClass;
  change?: number;
  date: string;
  compareDate: string;
  features?: {
    blobs: number;
    hv: number;
    edge: number;
    exg: number;
    red: number;
    delta: number;
    meanL: number;
  };
}

export interface DetectReport {
  hits: DetectHit[];
  ranAt: string;
  opticalTried: number;
  opticalOk: number;
  gridTried: number;
  gridHits: number;
  note: string;
}

interface ChipStats {
  n: number;
  meanL: number;
  exg: number;
  red: number;
  cloudFrac: number;
  nodataFrac: number;
  pixels: Uint8ClampedArray | null;
  w: number;
  h: number;
}

const HLS = "HLS_S30_Nadir_BRDF_Adjusted_Reflectance";
const VIIRS = "VIIRS_NOAA20_CorrectedReflectance_TrueColor";
const CHIP = 96;
const PRIORITY =
  /uae|dhafra|minhad|assab|fasher|nyala|khartoum|port sudan|kufra|amdjarass|jebel ali|fujairah|wadi seidna|geneina|asosa|adre|menge|goz beida|bahir dar|abéché|abeche|omdurman|dongola|kassala/i;

const ETH = { west: 34.5, south: 8.6, east: 42.2, north: 14.8 };
const TCD = { west: 13.4, south: 11.4, east: 22.25, north: 18.5 };
const TCD_NE = { west: 21.5, south: 15.2, east: 24.0, north: 18.8 };

function inEth(lat: number, lon: number) {
  return lon >= ETH.west && lon <= ETH.east && lat >= ETH.south && lat <= ETH.north;
}
function inTcd(lat: number, lon: number) {
  const main = lon >= TCD.west && lon <= TCD.east && lat >= TCD.south && lat <= TCD.north;
  const ennedi = lon >= TCD_NE.west && lon <= TCD_NE.east && lat >= TCD_NE.south && lat <= TCD_NE.north;
  return main || ennedi;
}
function ethChadLabel(lat: number, lon: number) {
  if (inEth(lat, lon)) return "Ethiopia";
  if (inTcd(lat, lon)) return "Chad";
  return null;
}
function isEthChadSite(s: { admin1: string; admin2: string; lat: number; lon: number }) {
  if (/ethiopia|chad|benishangul|ouaddaï|ouaddai|wadi fira|ennedi|asosa|amhara|sila|tigray/i.test(`${s.admin1} ${s.admin2}`))
    return true;
  return Boolean(ethChadLabel(s.lat, s.lon));
}
function isNonArmyCue(s: (typeof SITES)[number]) {
  if (!isEthChadSite(s)) return false;
  if (s.kind === "hospital" || s.kind === "farm" || s.kind === "market" || s.kind === "camp") return false;
  if (s.kind === "airfield") return false;
  return s.kind === "compound" || s.kind === "strip" || s.kind === "logistics";
}

function partyHunts(party: string, lat: number, lon: number): HuntId[] {
  const out: HuntId[] = [];
  if (party === "saf") out.push("saf");
  if (party === "rsf") out.push("rsf");
  const city = nearest(lat, lon, CONTROL_CITIES, 55);
  if (city?.item.faction === "saf" && !out.includes("saf")) out.push("saf");
  if (city?.item.faction === "rsf" && !out.includes("rsf")) out.push("rsf");
  return out;
}

function lonLatToTile(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { z, x, y };
}

function esriExportUrl(bbox: { west: number; south: number; east: number; north: number }, size = 256) {
  const { west, south, east, north } = bbox;
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${west},${south},${east},${north}&bboxSR=4326&imageSR=4326&size=${size},${size}&format=jpg&f=image`;
}

function esriTileUrl(lat: number, lon: number, z = 15) {
  const t = lonLatToTile(lon, lat, z);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${t.z}/${t.y}/${t.x}`;
}

function s2TileUrl(lat: number, lon: number, z = 13) {
  const t = lonLatToTile(lon, lat, z);
  return `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/${t.z}/${t.y}/${t.x}.jpg`;
}

async function loadMorphChip(
  lat: number,
  lon: number,
  bbox: { west: number; south: number; east: number; north: number },
): Promise<{ im: ImageData | null; layer: string }> {
  const tile = await loadChip(esriTileUrl(lat, lon, 15), 4500);
  if (tile) return { im: tile, layer: "Esri tile" };
  const s2 = await loadChip(s2TileUrl(lat, lon, 13), 4000);
  if (s2) return { im: s2, layer: "S2 mosaic" };
  const esri = await loadChip(esriExportUrl(bbox), 4000);
  return { im: esri, layer: esri ? "Esri" : "none" };
}

async function loadDatedChip(
  date: string,
  bbox: { west: number; south: number; east: number; north: number },
): Promise<{ im: ImageData | null; layer: string }> {
  const hls = await loadChip(snapshotUrl(date, bbox, HLS, 256));
  if (hls) return { im: hls, layer: "HLS" };
  const viirs = await loadChip(snapshotUrl(date, bbox, VIIRS, 256));
  return { im: viirs, layer: viirs ? "VIIRS" : "none" };
}

function boxOf(lat: number, lon: number, pad = 0.045) {
  return padBbox(lat, lon, pad);
}

function explain(ids: string[]): string {
  return ids
    .map((id) => TECHNIQUE_BY_ID[id]?.weRun)
    .filter(Boolean)
    .join(" ");
}

function loadChip(url: string, timeoutMs = 5000): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = window.setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      window.clearTimeout(t);
      try {
        const c = document.createElement("canvas");
        c.width = CHIP;
        c.height = CHIP;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, CHIP, CHIP);
        resolve(ctx.getImageData(0, 0, CHIP, CHIP));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      window.clearTimeout(t);
      resolve(null);
    };
    img.src = url;
  });
}

function stats(im: ImageData | null): ChipStats {
  if (!im) {
    return { n: 0, meanL: 0, exg: 0, red: 0, cloudFrac: 1, nodataFrac: 1, pixels: null, w: 0, h: 0 };
  }
  const px = im.data;
  let n = 0;
  let sumL = 0;
  let sumExg = 0;
  let sumRed = 0;
  let cloud = 0;
  let nodata = 0;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3] / 255;
    if (a < 0.12) {
      nodata += 1;
      continue;
    }
    const r = px[i] / 255;
    const g = px[i + 1] / 255;
    const b = px[i + 2] / 255;
    const L = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    sumL += L;
    sumExg += 2 * g - r - b;
    sumRed += r - (g + b) / 2;
    if (L > 0.86 && sat < 0.08) cloud += 1;
    n += 1;
  }
  const denom = Math.max(n, 1);
  const total = im.width * im.height;
  return {
    n,
    meanL: sumL / denom,
    exg: sumExg / denom,
    red: sumRed / denom,
    cloudFrac: (cloud + nodata) / Math.max(total, 1),
    nodataFrac: nodata / Math.max(total, 1),
    pixels: px,
    w: im.width,
    h: im.height,
  };
}

function cloudClass(s: ChipStats): CloudClass {
  if (s.n < 80) return "unknown";
  if (s.cloudFrac > 0.55 || s.nodataFrac > 0.55) return "cloudy";
  if (s.cloudFrac > 0.28) return "mixed";
  return "clear";
}

/** Compact bright objects + rectilinear edges — desert pad / compound / yard cue. Not an ID. */
function morphScore(im: ImageData | null): { edge: number; blobs: number; hv: number } {
  if (!im) return { edge: 0, blobs: 0, hv: 0 };
  const { width: w, height: h, data } = im;
  const L = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    L[p] = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
  }
  let mag = 0;
  let hv = 0;
  let all = 0;
  const strong: boolean[] = new Array(w * h).fill(false);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -L[(y - 1) * w + (x - 1)]! + L[(y - 1) * w + (x + 1)]! +
        -2 * L[y * w + (x - 1)]! + 2 * L[y * w + (x + 1)]! +
        -L[(y + 1) * w + (x - 1)]! + L[(y + 1) * w + (x + 1)]!;
      const gy =
        -L[(y - 1) * w + (x - 1)]! - 2 * L[(y - 1) * w + x]! - L[(y - 1) * w + (x + 1)]! +
        L[(y + 1) * w + (x - 1)]! + 2 * L[(y + 1) * w + x]! + L[(y + 1) * w + (x + 1)]!;
      const m = Math.abs(gx) + Math.abs(gy);
      mag += m;
      if (m > 0.35) {
        all += 1;
        if (Math.abs(gx) > Math.abs(gy) * 1.6 || Math.abs(gy) > Math.abs(gx) * 1.6) hv += 1;
      }
      if (L[y * w + x]! > 0.58) strong[y * w + x] = true;
    }
  }
  let blobs = 0;
  const seen = new Uint8Array(w * h);
  for (let i = 0; i < strong.length; i++) {
    if (!strong[i] || seen[i]) continue;
    let size = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const cur = stack.pop()!;
      size += 1;
      const cx = cur % w;
      const cy = (cur / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (seen[ni] || !strong[ni]) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
    }
    if (size >= 4 && size <= 90) blobs += 1;
  }
  const n = Math.max((w - 2) * (h - 2), 1);
  return { edge: mag / n, blobs, hv: all ? hv / all : 0 };
}

function mad(a: ChipStats, b: ChipStats): number {
  if (!a.pixels || !b.pixels || a.w !== b.w) return 0;
  const pa = a.pixels;
  const pb = b.pixels;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < pa.length; i += 4) {
    if (pa[i + 3] < 30 || pb[i + 3] < 30) continue;
    sum +=
      (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2])) /
      (3 * 255);
    n += 1;
  }
  return n ? sum / n : 0;
}

function firmsIn(
  firms: ThermalEvent[],
  b: { west: number; south: number; east: number; north: number },
): ThermalEvent[] {
  return firms.filter((f) => inBbox(f.lat, f.lon, b) && f.klass !== "agricultural");
}

export function fuseDetect(args: {
  boxes: WatchBox[];
  firms: ThermalEvent[];
  flights: FlightEvent[];
  osm: OsmSite[];
  news: NewsPoint[];
  date: string;
  compareDate: string;
  vessels?: VesselEvent[];
  gdelt?: GdeltEvent[];
}): DetectHit[] {
  const { boxes, firms, flights, osm, news, date, compareDate } = args;
  const vessels = args.vessels ?? [];
  const gdelt = args.gdelt ?? [];
  const hits: DetectHit[] = [];
  const seen = new Set<string>();
  let morphQueued = 0;

  const push = (h: Omit<DetectHit, "hunts"> & { hunts?: HuntId[]; party?: string }) => {
    if (seen.has(h.id)) return;
    seen.add(h.id);
    const { party, hunts: given, ...rest } = h;
    const hunts = [...new Set([...(given?.length ? given : huntsFromKlass(rest.klass)), ...partyHunts(party ?? "unknown", rest.lat, rest.lon)])];
    hits.push({ ...rest, hunts });
  };

  const HUNT_KINDS = new Set(["airfield", "strip", "compound", "logistics", "port", "camp", "crossing", "well"]);
  const CIVIL_BDA = new Set(["hospital", "market", "farm"]);

  for (const site of SITES) {
    const huntSite = HUNT_KINDS.has(site.kind) || isNonArmyCue(site);
    const bdaSite = CIVIL_BDA.has(site.kind) || site.status === "damaged";
    if (!huntSite && !bdaSite) continue;
    const near = nearest(site.lat, site.lon, firms, site.kind === "airfield" ? 8 : 5);
    const combatFirms = firms.filter(
      (f) =>
        Math.abs(f.lat - site.lat) < 0.08 &&
        Math.abs(f.lon - site.lon) < 0.08 &&
        (f.klass === "urban_structure" || f.klass === "possible_explosive" || f.klass === "industrial"),
    );
    const cargoFlights = flights.filter(
      (f) =>
        f.category === "cargo" &&
        f.nearestAirfield &&
        (f.nearestAirfield.toLowerCase().includes(site.name.split(" ")[0]!.toLowerCase()) ||
          Math.abs((f.lat ?? 0) - site.lat) < 0.35),
    );
    const newsHit = news.find((n) => Math.abs(n.lat - site.lat) < 0.25 && Math.abs(n.lon - site.lon) < 0.25);

    if (site.status === "damaged") {
      const bbox = boxOf(site.lat, site.lon, 0.05);
      push({
        id: `det-dmg-${site.id}`,
        klass: "possible_damage",
        title: `${site.name} · archive damage flag`,
        body: "Catalog status is damaged. Treat as a lead for the dated HLS pair — not battle-damage confirmation.",
        lat: site.lat,
        lon: site.lon,
        ...bbox,
        confidence: 2,
        families: ["damage", "morphology"],
        techniques: ["damage", "buildings", "xai"],
        explain: explain(["damage", "buildings"]),
        hunts: site.kind === "hospital" || site.kind === "market" ? ["bda", "wire"] : ["bda"],
        party: site.party,
        siteId: site.id,
        cloud: "unknown",
        date,
        compareDate,
      });
    }

    if (combatFirms.length >= 2 || (near && (near.item.frp ?? 0) >= 12 && near.item.klass !== "agricultural")) {
      const bbox = boxOf(site.lat, site.lon, 0.06);
      const families: IndicatorFamily[] = ["thermal"];
      if (newsHit) families.push("reporting");
      push({
        id: `det-th-${site.id}`,
        klass: combatFirms.length >= 2 && site.kind !== "farm" ? "possible_damage" : "thermal_cluster",
        title: `${site.name} · ${combatFirms.length || 1} FIRMS point${(combatFirms.length || 1) > 1 ? "s" : ""}`,
        body: `Thermal cluster within ${Math.round((near?.km ?? 4) * 10) / 10} km of a ${site.kind}. FIRMS is not a strike feed. Klass ${near?.item.klass ?? "unknown"}.`,
        lat: site.lat,
        lon: site.lon,
        ...bbox,
        confidence: families.length > 1 ? 2 : 1,
        families,
        techniques: ["fusion", "spectral", "damage", "xai"],
        explain: explain(["fusion", "spectral"]),
        siteId: site.id,
        cloud: "unknown",
        date,
        compareDate,
      });
    }

    if (cargoFlights.length > 0 && (site.kind === "airfield" || site.kind === "port" || site.kind === "logistics" || site.kind === "strip")) {
      const bbox = boxOf(site.lat, site.lon, 0.07);
      push({
        id: `det-air-${site.id}`,
        klass: site.kind === "port" ? "maritime" : site.kind === "logistics" ? "cargo_yard" : "airfield_activity",
        title: `${site.name} · cargo-typical ADS-B`,
        body: `${cargoFlights.length} cargo-typical airframe${cargoFlights.length > 1 ? "s" : ""} near this ${site.kind}. Category is typical for the type code — not a cargo claim.`,
        lat: site.lat,
        lon: site.lon,
        ...bbox,
        confidence: 2,
        families: ["flight", site.kind === "logistics" || site.kind === "port" ? "vehicles" : "flight"],
        techniques: ["fusion", "obb", "xai"],
        explain: explain(["fusion", "obb"]),
        hunts: site.kind === "port" ? ["cargo", "air", "sea"] : ["cargo", "air"],
        siteId: site.id,
        cloud: "unknown",
        date,
        compareDate,
      });
    }

    const alwaysMorph =
      isNonArmyCue(site) ||
      site.kind === "crossing" ||
      site.kind === "well" ||
      site.kind === "camp" ||
      isForeignLinked(site);
    if (
      alwaysMorph ||
      (morphQueued < 40 &&
        (["compound", "strip", "logistics", "port"].includes(site.kind) ||
          (site.kind === "airfield" &&
            (site.status === "damaged" ||
              PRIORITY.test(`${site.name} ${site.admin1} ${site.admin2} ${site.notes}`)))))
    ) {
      if (!alwaysMorph) morphQueued += 1;
      const region = ethChadLabel(site.lat, site.lon);
      const irregular = isNonArmyCue(site);
      const fx = isForeignLinked(site);
      const klass: DetectKlass = irregular
        ? "irregular_pad"
        : site.kind === "port"
          ? "maritime"
          : site.kind === "logistics"
            ? "cargo_yard"
            : site.kind === "airfield" || site.kind === "strip"
              ? "airfield_activity"
              : site.kind === "camp"
                ? "camp_grid"
                : site.kind === "crossing"
                  ? "crossing_cue"
                  : site.kind === "well"
                    ? "corridor_track"
                    : "base_compound";
      const hunts: HuntId[] = huntsFromKlass(klass);
      if (fx) hunts.push("fx");
      if (irregular) hunts.push("irreg");
      if (site.kind === "well" || /kufra|libya|darfur/i.test(`${site.name} ${site.notes}`)) hunts.push("chain");
      const bbox = boxOf(site.lat, site.lon, site.kind === "airfield" ? 0.08 : 0.045);
      const verdict = osmVerdictFor(site.lat, site.lon, SITES, osm, false);
      push({
        id: `det-morph-${site.id}`,
        klass,
        title: irregular
          ? `${region ?? site.admin2} · non-army pad cue · ${site.name}`
          : fx
            ? `FX · ${site.name}`
            : `${site.name} · ${DETECT_KLASS[klass].short} chip`,
        body: irregular
          ? `Not a national-army identification (${region ?? "ETH/TCD"}). Chip looks for pads, tents, yards, compact objects on the public pin. Humanitarian and commercial use remain the baseline until a movement chain is shown.`
          : fx
            ? "Public foreign-linked node. Pin is the published facility — not a cargo or occupancy claim. Chip looks for yards, aprons, pads."
            : `GEOINT chip (${DETECT_KLASS[klass].label}). OSM-AI ${verdict}: ${verdict === "missed" ? "no OSM military/aerodrome nearby." : verdict === "existing" ? "OSM already maps a feature here." : "not in archive."} Pads, yards, berms, compact objects — not a base or weapons identification.`,
        lat: site.lat,
        lon: site.lon,
        ...bbox,
        confidence: irregular || fx ? 2 : 1,
        families: irregular || fx ? ["morphology", "corridor"] : ["morphology"],
        techniques: ["chip", "buildings", "obb", "xai", "weak"],
        explain: explain(["chip", "buildings"]),
        hunts,
        party: site.party,
        siteId: site.id,
        cloud: "unknown",
        date,
        compareDate,
      });
    }
  }

  const gapKinds = new Set([
    "airfield",
    "base",
    "compound",
    "yard",
    "port",
    "airstrip",
    "strip",
    "helipad",
    "heliport",
    "military",
    "barrack",
    "depot",
    "fuel",
    "tank",
    "bunker",
    "checkpoint",
  ]);
  let gaps = 0;
  for (const o of osm) {
    const blob = `${o.kind} ${o.name}`;
    if (
      !gapKinds.has(o.kind) &&
      !/airfield|airstrip|helipad|heliport|military|barrack|depot|yard|fuel|bunker|checkpoint|tank farm/i.test(blob)
    )
      continue;
    if (nearest(o.lat, o.lon, SITES, 5)) continue;
    if (gaps >= 28) break;
    gaps += 1;
    const klass: DetectKlass = /port|yard/i.test(blob)
      ? "maritime"
      : /fuel|tank|depot|pol/i.test(blob)
        ? "pol_storage"
        : /heliport|helipad|airfield|airstrip|strip/i.test(blob)
          ? "airfield_activity"
          : /checkpoint|border/i.test(blob)
            ? "crossing_cue"
            : "osm_gap";
    const bbox = boxOf(o.lat, o.lon, 0.04);
    push({
      id: `det-osm-${o.id}`,
      klass,
      title: `${o.name} · OSM ${o.kind} not in archive`,
      body: "Volunteered OSM / OurAirports feature more than 5 km from a catalog pin. Weak label — not a newly found base. Confirm morphology on high-res, then add a report.",
      lat: o.lat,
      lon: o.lon,
      ...bbox,
      confidence: 1,
      families: ["morphology"],
      techniques: ["weak", "buildings", "xai"],
      explain: explain(["weak", "buildings"]),
      hunts: [...huntsFromKlass(klass), "osm"],
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  for (const box of boxes.filter((b) => b.priority === "primary").slice(0, 8)) {
    const hot = firmsIn(firms, box);
    if (hot.length < 3) continue;
    push({
      id: `det-box-${box.id}`,
      klass: "thermal_cluster",
      title: `${box.name} · ${hot.length} non-ag FIRMS`,
      body: "Watch-box thermal density. Agricultural fires are excluded. Still not a strike map — optical follow-up required.",
      lat: (box.south + box.north) / 2,
      lon: (box.west + box.east) / 2,
      west: box.west,
      south: box.south,
      east: box.east,
      north: box.north,
      confidence: 1,
      families: ["thermal"],
      techniques: ["chip", "fusion", "sits", "xai"],
      explain: explain(["chip", "fusion"]),
      boxId: box.id,
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  const listedAir = SITES.filter((s) => s.kind === "airfield" || s.kind === "strip" || s.kind === "port");
  let remote = 0;
  for (const f of flights) {
    if (f.category !== "cargo" && f.category !== "tanker") continue;
    if (nearest(f.lat, f.lon, listedAir, 28)) continue;
    if (remote >= 8) break;
    remote += 1;
    const bbox = boxOf(f.lat, f.lon, 0.08);
    push({
      id: `det-remote-${f.hex || f.id}`,
      klass: "airfield_activity",
      title: `${f.operator !== "unknown" ? f.operator : f.hex} · cargo-typical over unlisted terrain`,
      body: `${f.typeCode} ${f.category}-typical, ${Math.round(f.altFt ?? 0)} ft. No catalog airfield/strip within 28 km. Possible unlisted strip, overflight, or ADS-B bounce — not a makeshift-base identification, not a weapons claim.`,
      lat: f.lat,
      lon: f.lon,
      ...bbox,
      confidence: 1,
      families: ["flight", "morphology"],
      techniques: ["fusion", "obb", "chip", "xai"],
      explain: explain(["fusion", "obb"]),
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  for (const r of SEED_REPORTS) {
    const klass: DetectKlass =
      r.category === "strike-damage"
        ? "possible_damage"
        : r.category === "vehicle-buildup"
          ? "vehicle_park"
          : r.category === "air-activity"
            ? "airfield_activity"
            : r.category === "displacement"
              ? "camp_grid"
              : r.category === "control-change"
                ? "reporting_cue"
                : isEthChadSite({ admin1: r.country, admin2: r.place, lat: r.lat, lon: r.lon })
                  ? "irregular_pad"
                  : "reporting_cue";
    const region = ethChadLabel(r.lat, r.lon);
    const hunts: HuntId[] = ["wire", ...huntsFromKlass(klass)];
    if (region) hunts.push("irreg");
    const bbox = boxOf(r.lat, r.lon, 0.05);
    push({
      id: `det-rep-${r.id}`,
      klass,
      title: region
        ? `${region} · ${r.category} · ${r.place}`
        : `${r.place} · published ${r.category}`,
      body: `${r.summary} Open report (${r.sourceLabel}, ${r.date}). Observation for review — not a national-army or weapons identification.`,
      lat: r.lat,
      lon: r.lon,
      ...bbox,
      confidence: Math.min(r.confidence, 3) as 1 | 2 | 3,
      families: r.category === "strike-damage" ? ["damage", "reporting"] : r.category === "vehicle-buildup" ? ["vehicles", "reporting"] : ["reporting"],
      techniques: ["fusion", "xai", r.category === "strike-damage" ? "damage" : "obb"],
      explain: explain(["fusion", "xai"]),
      hunts,
      party: r.party,
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  let corridorCargo = 0;
  for (const f of flights) {
    if (f.category !== "cargo" && f.category !== "tanker") continue;
    const region = ethChadLabel(f.lat, f.lon);
    if (!region) continue;
    if (corridorCargo >= 10) break;
    corridorCargo += 1;
    const nearSite = nearest(f.lat, f.lon, SITES, 40);
    const bbox = boxOf(f.lat, f.lon, 0.07);
    push({
      id: `det-ethchad-air-${f.hex || f.id}`,
      klass: "cargo_yard",
      title: `${region} · cargo-typical in motion · ${f.typeCode}`,
      body: `${f.operator !== "unknown" ? f.operator : f.hex} ${f.category}-typical near ${nearSite ? nearSite.item.name : "no catalog pin"}. ${f.origin} → ${f.dest}. Airframe category is not payload. Not a national-army flight ID.`,
      lat: f.lat,
      lon: f.lon,
      ...bbox,
      confidence: 2,
      families: ["flight", "corridor"],
      techniques: ["fusion", "obb", "xai"],
      explain: explain(["fusion", "obb"]),
      siteId: nearSite?.item.id,
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  for (const box of boxes.filter((b) => /ethiopia|chad/i.test(`${b.region} ${b.name} ${b.notes}`))) {
    const hot = firmsIn(firms, box);
    if (hot.length < 2) continue;
    push({
      id: `det-ethchad-th-${box.id}`,
      klass: "thermal_cluster",
      title: `${box.region} · ${hot.length} non-ag FIRMS · ${box.name}`,
      body: "Thermal density on the Ethiopia / Chad approach. Agricultural fires excluded. Not a strike map and not a national-army ID — optical follow-up required.",
      lat: (box.south + box.north) / 2,
      lon: (box.west + box.east) / 2,
      west: box.west,
      south: box.south,
      east: box.east,
      north: box.north,
      confidence: 1,
      families: ["thermal", "corridor"],
      techniques: ["chip", "fusion", "sits", "xai"],
      explain: explain(["chip", "fusion"]),
      boxId: box.id,
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  const ports = SITES.filter((s) => s.kind === "port");
  let sea = 0;
  for (const v of vessels) {
    if (v.kind === "lane") continue;
    if (sea >= 14) break;
    const near = nearest(v.lat, v.lon, ports, 80);
    sea += 1;
    const bbox = boxOf(v.lat, v.lon, 0.12);
    push({
      id: `det-sea-${v.id}`,
      klass: "maritime",
      title: `${v.name} · ${v.kind === "ais" ? "AIS-typical" : "port node"} · ${v.flag}`,
      body: `SOG ${v.sog} · ${v.destination || "dest unknown"}. ${near ? `Near ${near.item.name} (${Math.round(near.km)} km).` : "No catalog port within 80 km."} Public track, not a cargo claim.`,
      lat: v.lat,
      lon: v.lon,
      ...bbox,
      confidence: 2,
      families: ["corridor"],
      techniques: ["fusion", "xai"],
      explain: explain(["fusion"]),
      hunts: ["sea", "cargo"],
      siteId: near?.item.id,
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  let wireN = 0;
  for (const n of news) {
    const text = `${n.name} ${n.articles.map((a) => a.title).join(" ")}`;
    const hunts = matchHunts(text);
    if (!hunts.length) continue;
    if (wireN >= 14) break;
    wireN += 1;
    const bbox = boxOf(n.lat, n.lon, 0.08);
    push({
      id: `det-wire-${n.id}`,
      klass: "reporting_cue",
      title: `${n.name} · ${hunts.map((h) => h.toUpperCase()).join("/")} wire`,
      body: `${n.count} geocoded headline${n.count > 1 ? "s" : ""} at this named place. Keyword cue only — headline pins are centroids, not incident coordinates.`,
      lat: n.lat,
      lon: n.lon,
      ...bbox,
      confidence: 1,
      families: ["reporting"],
      techniques: ["fusion", "xai"],
      explain: explain(["fusion"]),
      hunts: ["wire", ...hunts],
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  let gd = 0;
  for (const g of gdelt) {
    const hunts = matchHunts(`${g.name} ${g.subtype} ${g.notes} ${g.actor}`);
    if (!hunts.length) continue;
    if (gd >= 10) break;
    gd += 1;
    const bbox = boxOf(g.lat, g.lon, 0.07);
    push({
      id: `det-gdelt-${g.id}`,
      klass: hunts.includes("bda") ? "possible_damage" : "reporting_cue",
      title: `GDELT · ${g.name}`,
      body: `${g.subtype} · ${g.actor}. ${g.notes} Machine-coded event, not a verified incident.`,
      lat: g.lat,
      lon: g.lon,
      ...bbox,
      confidence: 1,
      families: ["reporting"],
      techniques: ["fusion", "xai"],
      explain: explain(["fusion"]),
      hunts: ["wire", ...hunts],
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  let night = 0;
  const nightFirms = firms.filter((f) => f.daynight === "N" && f.klass !== "agricultural");
  for (const f of nightFirms) {
    if (night >= 8) break;
    if (f.frp < 8) continue;
    night += 1;
    const bbox = boxOf(f.lat, f.lon, 0.06);
    push({
      id: `det-night-${f.id}`,
      klass: "thermal_cluster",
      title: `Night FIRMS · FRP ${f.frp.toFixed(0)}`,
      body: "Night-time thermal anomaly. Could be industry, gas flare, burn, or sensor noise. Not a strike. Optical follow-up required.",
      lat: f.lat,
      lon: f.lon,
      ...bbox,
      confidence: 1,
      families: ["thermal"],
      techniques: ["fusion", "spectral", "xai"],
      explain: explain(["fusion", "spectral"]),
      hunts: ["thrm"],
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  let mil = 0;
  for (const f of flights) {
    if (!f.military && f.category !== "tanker") continue;
    if (mil >= 8) break;
    mil += 1;
    const near = nearest(f.lat, f.lon, SITES, 40);
    const bbox = boxOf(f.lat, f.lon, 0.07);
    push({
      id: `det-mil-${f.hex || f.id}`,
      klass: f.category === "tanker" ? "pol_storage" : "airfield_activity",
      title: `${f.military ? "State/military-typical" : "Tanker-typical"} · ${f.typeCode}`,
      body: `${f.operator !== "unknown" ? f.operator : f.hex} ${f.origin} → ${f.dest}. ${near ? `Near ${near.item.name}.` : "No catalog pin within 40 km."} Type code is not a mission or payload.`,
      lat: f.lat,
      lon: f.lon,
      ...bbox,
      confidence: 2,
      families: ["flight"],
      techniques: ["fusion", "obb", "xai"],
      explain: explain(["fusion", "obb"]),
      hunts: f.category === "tanker" ? ["pol", "air"] : ["air", "fx"],
      siteId: near?.item.id,
      cloud: "unknown",
      date,
      compareDate,
    });
  }

  return hits;
}

async function scoreChip(
  hit: DetectHit,
  date: string,
  compareDate: string,
): Promise<DetectHit> {
  const bbox = { west: hit.west, south: hit.south, east: hit.east, north: hit.north };
  const morph = await loadMorphChip(hit.lat, hit.lon, bbox);
  const after = await loadDatedChip(date, bbox);
  const before = await loadDatedChip(compareDate, bbox);
  const sm = stats(morph.im);
  const sa = stats(after.im);
  const sb = stats(before.im);
  const shape = morphScore(morph.im ?? after.im);
  const cloud = after.im ? cloudClass(sa) : morph.im ? "clear" : "unknown";
  const delta = mad(sb, sa);
  const techniques = [...hit.techniques];
  for (const id of ["chip", "qa", "cloud", "coreg", "cd", "spectral", "buildings", "obb"] as const) {
    if (!techniques.includes(id)) techniques.push(id);
  }
  let klass = hit.klass;
  let confidence = hit.confidence;
  let families = [...hit.families];
  let hunts = [...hit.hunts];
  const bits: string[] = [];
  if (morph.layer !== "none") bits.push(`Morphology chip ${morph.layer}.`);
  if (after.layer !== "none") bits.push(`Dated ${after.layer}.`);
  if (shape.hv >= 0.55 && shape.edge >= 0.09 && sm.exg < 0.07) {
    bits.push(`Linear HV ${shape.hv.toFixed(2)} · edge ${shape.edge.toFixed(2)} — possible berm/earthwork geometry, not a fighting-position ID.`);
    if (klass !== "possible_damage" && klass !== "irregular_pad") klass = "earthwork";
    if (!hunts.includes("berm")) hunts.push("berm");
    if (confidence < 2) confidence = 2;
  }
  if (shape.blobs >= 8 && sm.exg < 0.08) {
    bits.push(`${shape.blobs} compact bright objects — vehicle-park / apron morphology. Type unresolvable at this grain.`);
    if (klass === "base_compound" || klass === "osm_gap" || klass === "unresolved_objects") klass = "vehicle_park";
    if (!hunts.includes("veh")) hunts.push("veh");
    if (!families.includes("vehicles")) families.push("vehicles");
  }
  if (shape.blobs >= 3 && shape.edge >= 0.07 && sm.exg < 0.08) {
    bits.push(`${shape.blobs} compact bright objects · edge ${shape.edge.toFixed(2)} · HV ${shape.hv.toFixed(2)}. Possible pad/yard/compound morphology.`);
    if (!families.includes("morphology")) families.push("morphology");
    if (shape.blobs >= 6 && shape.hv >= 0.5) {
      if (klass === "airfield_activity" || klass === "osm_gap") klass = hit.klass === "irregular_pad" ? "irregular_pad" : "base_compound";
      if (klass === "unresolved_objects") klass = ethChadLabel(hit.lat, hit.lon) ? "irregular_pad" : "base_compound";
      if (confidence < 2) confidence = 2;
    } else if (shape.blobs >= 4 && sm.exg < 0.06 && shape.edge >= 0.08) {
      bits.push("Bright compact objects on low-vegetation ground — possible pad / staging morphology. Not a weapons or smuggling claim.");
      if (klass === "osm_gap" || klass === "unresolved_objects") {
        klass = ethChadLabel(hit.lat, hit.lon) ? "irregular_pad" : "base_compound";
      }
      if (!families.includes("vehicles")) families.push("vehicles");
    }
  } else if (morph.im) {
    bits.push(`Low compact-object count (${shape.blobs}). No pad/yard cue this chip.`);
  }
  if (cloud === "cloudy") {
    bits.push(`Dated chip cloudy/no-data (${Math.round(sa.cloudFrac * 100)}%). Change not scored.`);
  } else if (after.layer === "none") {
    bits.push("Dated HLS/VIIRS unreadable this cycle. Morphology from mosaic only.");
  } else {
    bits.push(`Cloud ${cloud}. Δ ${delta.toFixed(3)} (RGB MAD).`);
    if (delta >= 0.11 && !families.includes("morphology")) families.push("morphology");
    if (delta >= 0.14 && sa.red - sb.red > 0.04 && sa.exg < sb.exg) {
      klass = "possible_damage";
      if (confidence < 2) confidence = 2;
      if (!families.includes("damage")) families.push("damage");
      bits.push("Redness up, Excess-Green down — possible scrape/scorch. Not a damage class from xView2.");
    } else if (delta >= 0.12) {
      bits.push("Bitemporal difference above noise. Phenology and roofs also trigger this.");
    }
  }
  bits.push("Observation only — not a base ID, not a weapons or smuggling claim.");
  hunts = [...new Set([...hunts, ...huntsFromKlass(klass)])];
  return {
    ...hit,
    klass,
    confidence,
    families,
    hunts,
    techniques,
    cloud,
    change: cloud === "cloudy" || cloud === "unknown" || after.layer === "none" ? undefined : Math.round(delta * 1000) / 1000,
    explain: `${hit.explain} ${bits.join(" ")}`.trim(),
    body: `${hit.body} ${bits.join(" ")}`.trim(),
  };
}

function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const cur = items[i++];
      if (cur === undefined) break;
      out.push(await fn(cur));
    }
  });
  return Promise.all(workers).then(() => out);
}

type SweepMode = "urban" | "desert";

interface SweepSector {
  id: string;
  name: string;
  west: number;
  south: number;
  east: number;
  north: number;
  step: number;
  mode: SweepMode;
}

/** Blank-tile hunt — not Twitter. Rotates so each cycle looks at a new slice of desert/city. */
const SWEEP_SECTORS: SweepSector[] = [
  { id: "fasher", name: "El Fasher ring", west: 24.9, south: 13.2, east: 25.7, north: 13.95, step: 0.11, mode: "urban" },
  { id: "nyala", name: "Nyala ring", west: 24.65, south: 11.8, east: 25.25, north: 12.35, step: 0.1, mode: "urban" },
  { id: "geneina", name: "Geneina–Adré", west: 21.7, south: 13.2, east: 22.7, north: 13.85, step: 0.12, mode: "urban" },
  { id: "khartoum-out", name: "Khartoum outskirts", west: 32.15, south: 15.25, east: 32.9, north: 16.05, step: 0.1, mode: "urban" },
  { id: "port-sudan", name: "Port Sudan yards", west: 36.75, south: 19.05, east: 37.45, north: 19.85, step: 0.12, mode: "urban" },
  { id: "el-obeid", name: "El Obeid / Kordofan", west: 29.85, south: 12.85, east: 30.55, north: 13.45, step: 0.1, mode: "urban" },
  { id: "kufra-south", name: "Kufra south tracks", west: 22.7, south: 21.4, east: 24.3, north: 24.35, step: 0.28, mode: "desert" },
  { id: "se-libya-camp", name: "SE Libya camp box", west: 22.0, south: 21.7, east: 23.5, north: 22.9, step: 0.12, mode: "desert" },
  { id: "blue-nile", name: "Blue Nile / Kurmuk", west: 33.85, south: 10.15, east: 34.55, north: 11.05, step: 0.1, mode: "desert" },
  { id: "n-darfur-out", name: "N Darfur wadis", west: 24.3, south: 13.0, east: 26.5, north: 14.7, step: 0.22, mode: "desert" },
  { id: "s-darfur-out", name: "S Darfur ring", west: 24.1, south: 11.35, east: 25.7, north: 12.7, step: 0.18, mode: "desert" },
  { id: "w-kordofan", name: "W Kordofan tracks", west: 27.1, south: 11.1, east: 29.9, north: 13.3, step: 0.28, mode: "desert" },
  { id: "asosa-menge", name: "Asosa / Menge", west: 34.15, south: 9.85, east: 34.95, north: 11.25, step: 0.12, mode: "desert" },
  { id: "adre-amd", name: "Adré–Amdjarass", west: 21.35, south: 13.15, east: 22.7, north: 16.3, step: 0.22, mode: "desert" },
  { id: "dongola", name: "Dongola north", west: 30.15, south: 18.7, east: 31.25, north: 19.7, step: 0.16, mode: "desert" },
  { id: "white-nile", name: "Kosti / Rabak yards", west: 32.25, south: 12.85, east: 32.95, north: 13.55, step: 0.12, mode: "urban" },
];

function cellKey(lat: number, lon: number) {
  return `${lat.toFixed(3)}:${lon.toFixed(3)}`;
}

function sweepCells(known: { lat: number; lon: number }[]): { lat: number; lon: number; sector: SweepSector }[] {
  const out: { lat: number; lon: number; sector: SweepSector }[] = [];
  const seen = new Set<string>();
  for (const sector of SWEEP_SECTORS) {
    for (let lat = sector.south + sector.step / 2; lat < sector.north; lat += sector.step) {
      for (let lon = sector.west + sector.step / 2; lon < sector.east; lon += sector.step) {
        const k = cellKey(lat, lon);
        if (seen.has(k)) continue;
        const close = nearest(lat, lon, known, 7);
        if (close) continue;
        seen.add(k);
        out.push({ lat, lon, sector });
      }
    }
  }
  const slot = Math.floor(Date.now() / 90_000);
  return out
    .map((c, i) => ({ c, k: (i * 17 + slot * 13) % 997 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);
}

function classifyScan(
  shape: { edge: number; blobs: number; hv: number },
  sm: ChipStats,
  delta: number,
  cloud: CloudClass,
  mode: SweepMode,
): { klass: DetectKlass; confidence: Confidence; why: string } | null {
  if (cloud === "cloudy") return null;
  if (sm.n < 80) return null;
  if (sm.exg > 0.11) return null;
  const weights = useAppStore.getState().modelWeights ?? DEFAULT_WEIGHTS;
  const pred = predictChip(featuresFromShape(shape, sm, delta), weights);
  if (pred.klass !== "none" && pred.score > 0.15) {
    const mapped = modelToKlass(pred.klass) as DetectKlass;
    if (mapped === "burn_scar" || pred.klass === "burn") {
      return {
        klass: "burn_scar",
        confidence: 2,
        why: `Chip model (AfriMEOSINT priors + your reviews): burn/scorch cue. Δ ${delta.toFixed(3)} red ${sm.red.toFixed(3)}. Not a strike call.`,
      };
    }
    if (pred.klass === "wreck_air") {
      return {
        klass: "wreck_air",
        confidence: 2,
        why: `Chip model: airframe/hangar damage cue. Confirm on Google/Esri. Not a destroyed-aircraft ID.`,
      };
    }
    if (pred.klass === "wreck_bldg") {
      return {
        klass: "wreck_bldg",
        confidence: 2,
        why: `Chip model: building scrape/rubble cue. Roofs and phenology also trigger this.`,
      };
    }
    if (pred.klass === "camp" && mode === "desert" && shape.blobs >= 4) {
      return {
        klass: "camp_buildup",
        confidence: 2,
        why: `Chip model: camp/staging morphology (${shape.blobs} compact objects, low veg). Makeshift-base candidate for human review — not an RSF/SAF ID.`,
      };
    }
  }
  if (mode === "urban") {
    if (delta >= 0.14 && sm.red > 0.02) {
      return {
        klass: "burn_scar",
        confidence: 2,
        why: `Urban chip Δ ${delta.toFixed(3)} with redness up — burn/scrape cue, also phenology/roofs.`,
      };
    }
    if (delta >= 0.16 && shape.hv >= 0.5) {
      return {
        klass: "wreck_bldg",
        confidence: 2,
        why: `Urban scrape geometry with dated change. Building-damage candidate for review.`,
      };
    }
    if (shape.blobs >= 8 && shape.hv >= 0.48 && sm.exg < 0.08) {
      return {
        klass: "cargo_yard",
        confidence: 2,
        why: `${shape.blobs} compact bright objects + HV ${shape.hv.toFixed(2)} — yard/apron morphology in a city ring.`,
      };
    }
    if (shape.hv >= 0.6 && shape.edge >= 0.11 && delta >= 0.1) {
      return {
        klass: "earthwork",
        confidence: 2,
        why: `Rectilinear edges with dated change. Berm/compound cue, not a fighting-position ID.`,
      };
    }
    return null;
  }
  if (shape.blobs >= 8 && sm.exg < 0.07) {
    return {
      klass: "camp_buildup",
      confidence: 2,
      why: `${shape.blobs} compact objects on desert — camp/makeshift-base morphology (AfriMEOSINT SE Libya pattern). Human verify.`,
    };
  }
  if (delta >= 0.13 && sm.exg < 0.08) {
    return {
      klass: delta >= 0.16 && sm.red > 0.02 ? "burn_scar" : "cargo_yard",
      confidence: 2,
      why: `Desert chip Δ ${delta.toFixed(3)}. New bright/scrape relative to compare date — phenology still possible.`,
    };
  }
  if (shape.blobs >= 4 && sm.exg < 0.08 && shape.edge >= 0.06) {
    return {
      klass: "vehicle_park",
      confidence: 2,
      why: `${shape.blobs} compact bright objects on low-vegetation ground — vehicle-park / staging morphology. Type unresolvable at this grain.`,
    };
  }
  if (shape.hv >= 0.55 && shape.edge >= 0.09 && sm.exg < 0.07) {
    return {
      klass: "earthwork",
      confidence: 2,
      why: `Linear HV ${shape.hv.toFixed(2)} · edge ${shape.edge.toFixed(2)} — possible bermed pad/compound.`,
    };
  }
  if (shape.blobs >= 4 && shape.edge >= 0.08 && sm.exg < 0.07) {
    return {
      klass: "base_compound",
      confidence: 1,
      why: `${shape.blobs} compact objects · edge ${shape.edge.toFixed(2)} — unlisted pad/yard cue.`,
    };
  }
  return null;
}

async function scoreScanCell(
  cell: { lat: number; lon: number; sector: SweepSector },
  date: string,
  compareDate: string,
): Promise<DetectHit | null> {
  const bbox = boxOf(cell.lat, cell.lon, Math.min(cell.sector.step * 0.45, 0.05));
  const morph = await loadMorphChip(cell.lat, cell.lon, bbox);
  if (!morph.im) return null;
  const sm = stats(morph.im);
  const shape = morphScore(morph.im);
  const interesting =
    cell.sector.mode === "desert"
      ? shape.blobs >= 3 || shape.hv >= 0.5 || shape.edge >= 0.1
      : shape.blobs >= 6 || shape.hv >= 0.55 || shape.edge >= 0.12;
  if (!interesting || sm.exg > 0.12) return null;
  let delta = 0;
  let cloud: CloudClass = "clear";
  let datedLayer = "none";
  if (cell.sector.mode === "desert") {
    const after = await loadDatedChip(date, bbox);
    const before = await loadDatedChip(compareDate, bbox);
    const sa = stats(after.im);
    const sb = stats(before.im);
    cloud = after.im ? cloudClass(sa) : "clear";
    delta = mad(sb, sa);
    datedLayer = after.layer;
  }
  const labelLat = cell.lat;
  const labelLon = cell.lon;
  const found = (() => {
    const raw = classifyScan(shape, sm, delta, cloud, cell.sector.mode);
    if (!raw) return null;
    if (ethChadLabel(labelLat, labelLon) && (raw.klass === "base_compound" || raw.klass === "vehicle_park")) {
      return { ...raw, klass: "irregular_pad" as DetectKlass };
    }
    return raw;
  })();
  if (!found) return null;
  const hunts = huntsFromKlass(found.klass);
  if (ethChadLabel(cell.lat, cell.lon) && !hunts.includes("irreg")) hunts.push("irreg");
  const meta = DETECT_KLASS[found.klass];
  return {
    id: `det-scan-${cell.sector.id}-${cellKey(cell.lat, cell.lon).replace(":", "-")}`,
    klass: found.klass,
    title: `Tile find · ${meta.short} · ${cell.sector.name}`,
    body: `Blank-tile sweep of ${cell.sector.name} (not a Twitter pin). ${found.why} Observation only — not a base, weapons, or occupancy ID.`,
    lat: cell.lat,
    lon: cell.lon,
    ...bbox,
    confidence: found.confidence,
    families: found.klass === "possible_damage" ? ["morphology", "damage"] : ["morphology"],
    techniques: ["chip", "obb", "cd", "spectral", "xai"],
    explain: `${found.why} Chip ${morph.layer}${datedLayer !== "none" ? ` · dated ${datedLayer}` : ""}.`,
    hunts,
    cloud,
    change: datedLayer === "none" || cloud === "cloudy" || cloud === "unknown" ? undefined : Math.round(delta * 1000) / 1000,
    date,
    compareDate,
    features: featuresFromShape(shape, sm, delta),
  };
}

async function sweepTiles(args: {
  known: { lat: number; lon: number }[];
  date: string;
  compareDate: string;
}): Promise<{ tried: number; hits: DetectHit[] }> {
  const cells = sweepCells(args.known).slice(0, 20);
  const scored = await pool(cells, 6, (c) => scoreScanCell(c, args.date, args.compareDate));
  const hits = scored.filter((h): h is DetectHit => h != null);
  return { tried: cells.length, hits };
}

export async function runDetect(args: {
  boxes: WatchBox[];
  firms: ThermalEvent[];
  flights: FlightEvent[];
  osm: OsmSite[];
  news: NewsPoint[];
  date: string;
  compareDate: string;
  optical?: boolean;
  vessels?: VesselEvent[];
  gdelt?: GdeltEvent[];
}): Promise<DetectReport> {
  const fused = fuseDetect(args);
  const empty = {
    ranAt: new Date().toISOString(),
    opticalTried: 0,
    opticalOk: 0,
    gridTried: 0,
    gridHits: 0,
  };
  if (!args.optical) {
    return {
      hits: fused,
      ...empty,
      note: "Fusion-only this pass. Tile sweep runs when DET stays on.",
    };
  }
  const rank = (h: DetectHit) =>
    (h.id.startsWith("det-scan-") ? 20 : 0) +
    (h.id.startsWith("det-rep-") ? 8 : 0) +
    (h.hunts.includes("wire") ? 4 : 0) +
    (h.hunts.includes("rsf") || h.hunts.includes("chain") ? 6 : 0) +
    (h.families.length * 3) +
    (h.hunts.length * 2) +
    (h.klass === "possible_damage" ? 6 : 0) +
    (h.klass === "irregular_pad" ? 6 : 0) +
    (h.klass === "cargo_yard" || h.klass === "maritime" || h.klass === "vehicle_park" ? 5 : 0) +
    (h.klass === "earthwork" || h.klass === "pol_storage" ? 4 : 0) +
    (h.klass === "airfield_activity" ? 2 : 0) +
    (h.confidence);
  const known = [
    ...SITES.map((s) => ({ lat: s.lat, lon: s.lon })),
    ...SEED_REPORTS.map((r) => ({ lat: r.lat, lon: r.lon })),
    ...fused.map((h) => ({ lat: h.lat, lon: h.lon })),
  ];
  const pinTop = [...fused].sort((a, b) => rank(b) - rank(a)).slice(0, 18);
  const [scoredPins, grid] = await Promise.all([
    pool(pinTop, 4, (h) => scoreChip(h, args.date, args.compareDate)),
    sweepTiles({ known, date: args.date, compareDate: args.compareDate }),
  ]);
  const pinOk = scoredPins.filter((h) => h.cloud !== "unknown").length;
  const byId = new Map(scoredPins.map((h) => [h.id, h]));
  const pinHits = fused.map((h) => byId.get(h.id) ?? h);
  const hits = [...grid.hits, ...pinHits];
  return {
    hits,
    ranAt: new Date().toISOString(),
    opticalTried: pinTop.length + grid.tried,
    opticalOk: pinOk + grid.hits.filter((h) => h.cloud !== "unknown").length,
    gridTried: grid.tried,
    gridHits: grid.hits.length,
    note: `Imagery sweep (not Twitter): ${grid.tried} blank tiles this cycle, ${grid.hits.length} unknown morphology flags. ${pinOk}/${pinTop.length} known pins also chipped. 10–30 m public tiles — pads/yards/change cues, not IDs.`,
  };
}
