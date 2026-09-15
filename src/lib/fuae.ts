import { FLIGHTS } from "@/data/catalog";
import { VESSEL_SEED } from "@/data/regional-sites";
import type { FlightEvent, VesselEvent } from "@/lib/types";

/** UAE–Africa traffic log. Route observation from public ADS-B / documented lanes — not a cargo claim. */
export interface FuaeRecord {
  id: string;
  kind: "air" | "sea";
  title: string;
  body: string;
  lat: number;
  lon: number;
  firstSeen: string;
  lastSeen: string;
  origin: string;
  dest: string;
  tag: string;
  why: string;
  live: boolean;
  hex?: string;
}

const UAE = { west: 51.35, south: 22.45, east: 56.65, north: 26.55 };
const AFRICA = { west: -18, south: -35, east: 51.55, north: 37.6 };

const UAE_ICAO = /\b(OMDB|OMAA|OMSJ|OMDW|OMFJ|OMAL|OMRK|OMAD|OMAM|OMDM|OMF J)\b/i;
const UAE_PLACE =
  /dubai|abu dhabi|sharjah|fujairah|al dhafra|minhad|jebel ali|al ain|ras al khaimah|al bateen|uae fir/i;
const UAE_OP = /\b(ETD|UAE|FDB|DUBAI|AUH|ADNOC|EMIRATES|FLYDUBAI|ETIHAD|WIZZ)\b/i;
const AFRICA_PLACE =
  /\b(HS[A-Z]{2}|HECA|HLLT|HSSS|HAAB|HCMM|HKJK|HTDA|FTTJ|port sudan|khartoum|nyala|asosa|kufra|ndjamena|asmara|djibouti|berbera|mogadishu|addis|cairo|tripoli|benghazi|nairobi|sudan|chad|ethiopia|somalia|eritrea|libya|egypt|kenya|horn)\b/i;

export function inUae(lat: number, lon: number) {
  return lon >= UAE.west && lon <= UAE.east && lat >= UAE.south && lat <= UAE.north;
}

export function inAfrica(lat: number, lon: number) {
  if (inUae(lat, lon)) return false;
  return lon >= AFRICA.west && lon <= AFRICA.east && lat >= AFRICA.south && lat <= AFRICA.north;
}

function headingOffUae(track?: number) {
  if (track == null) return false;
  const t = ((track % 360) + 360) % 360;
  return t >= 170 && t <= 310;
}

function uaeLinkedFlight(f: FlightEvent): string | null {
  const blob = `${f.origin} ${f.dest} ${f.operator} ${f.reg} ${f.nearestAirfield} ${f.notes}`;
  if (/^A6-/i.test(f.reg)) return `UAE registry ${f.reg}`;
  if (UAE_ICAO.test(blob) || UAE_PLACE.test(blob) || UAE_OP.test(blob)) return "UAE ICAO / operator / airfield";
  if (inUae(f.lat, f.lon)) return "position in UAE FIR";
  return null;
}

function africaBoundFlight(f: FlightEvent, whyUae: string): string | null {
  const blob = `${f.origin} ${f.dest} ${f.nearestAirfield} ${f.notes}`;
  if (AFRICA_PLACE.test(blob) || AFRICA_PLACE.test(f.dest)) return `Africa-named dest ${f.dest}`;
  if (inAfrica(f.lat, f.lon)) return "position over African airspace";
  if (whyUae && headingOffUae(f.track)) return `UAE FIR, track ${Math.round(f.track ?? 0)}° toward the west/southwest`;
  if (inUae(f.lat, f.lon) && headingOffUae(f.track)) return "departing UAE on a west/southwest heading";
  return null;
}

function uaeLinkedVessel(v: VesselEvent): string | null {
  const blob = `${v.name} ${v.destination} ${v.notes} ${v.flag}`;
  if (/jebel ali|fujairah|uae|aejal|aefjr|dubai/i.test(blob)) return "UAE port / lane";
  if (v.flag.toLowerCase() === "are" || /united arab|uae/i.test(v.flag)) return `flag ${v.flag}`;
  if (inUae(v.lat, v.lon)) return "position in UAE waters";
  if (v.id.includes("uae-africa")) return "documented UAE–Horn / Red Sea corridor marker";
  return null;
}

function africaBoundVessel(v: VesselEvent): string | null {
  const blob = `${v.name} ${v.destination} ${v.notes}`;
  if (AFRICA_PLACE.test(blob) || /red sea|aden|port sudan|suakin|assab|berbera|suez/i.test(blob)) {
    return `dest ${v.destination}`;
  }
  if (inAfrica(v.lat, v.lon)) return "position on African / Red Sea approaches";
  if (v.id.includes("uae-africa") || v.id.includes("lane-red-sea") || v.id.includes("lane-aden")) {
    return "UAE–Africa documented lane";
  }
  return null;
}

export function scanFuae(flights: FlightEvent[], vessels: VesselEvent[], now = new Date().toISOString()): FuaeRecord[] {
  const out: FuaeRecord[] = [];

  for (const f of flights) {
    const whyUae = uaeLinkedFlight(f);
    if (!whyUae) continue;
    const whyAf = africaBoundFlight(f, whyUae);
    if (!whyAf) continue;
    const cat = f.category === "cargo" || f.category === "tanker" ? "cargo-typical airframe" : f.category;
    out.push({
      id: `fuae-air-${f.hex || f.id}`,
      kind: "air",
      title: `${f.operator !== "unknown" ? f.operator : f.hex} · ${f.typeCode}`,
      body: `${cat}. ${whyUae}. ${whyAf}. Public ADS-B state vector — not a cargo, payload, or transfer claim. Human review required.`,
      lat: f.lat,
      lon: f.lon,
      firstSeen: f.firstSeen,
      lastSeen: f.lastSeen || now,
      origin: f.origin,
      dest: f.dest,
      tag: cat,
      why: `${whyUae} · ${whyAf}`,
      live: !!f.live,
      hex: f.hex,
    });
  }

  let laneOnce = false;
  for (const v of vessels) {
    if (v.kind === "lane") {
      if (laneOnce || !/uae-africa|red-sea|aden/.test(v.id)) continue;
      laneOnce = true;
    }
    const whyUae = uaeLinkedVessel(v);
    if (!whyUae) continue;
    const whyAf = africaBoundVessel(v);
    if (!whyAf) continue;
    out.push({
      id: `fuae-sea-${v.id}`,
      kind: "sea",
      title: v.name,
      body: `${v.kind === "lane" ? "Documented corridor marker — not live AIS." : "Port / AIS node."} ${whyUae}. ${whyAf}. Not a cargo claim.`,
      lat: v.lat,
      lon: v.lon,
      firstSeen: now,
      lastSeen: now,
      origin: whyUae,
      dest: v.destination,
      tag: v.kind,
      why: `${whyUae} · ${whyAf}`,
      live: v.live,
    });
  }

  return out;
}

/** Archive contacts so the tab is not empty when live ADS-B is a coverage gap. */
export function seedFuae(): FuaeRecord[] {
  return scanFuae(FLIGHTS, VESSEL_SEED);
}
