import gdeltArchive from "@/data/gdelt-archive.json";
import osmSeed from "@/data/osm-seed.json";
import type { GdeltEvent, OsmSite } from "@/lib/types";

export const OSM_SEED = osmSeed as OsmSite[];
export const GDELT_ARCHIVE = (gdeltArchive as GdeltEvent[]).map((e) => ({
  ...e,
  live: false,
}));

export const FEED_CHANNELS: { id: string; label: string; tone: string }[] = [
  { id: "RadioDabanga", label: "Radio Dabanga", tone: "civilian" },
  { id: "sudantribune", label: "Sudan Tribune", tone: "saf" },
  { id: "aljazeeraglobal", label: "Al Jazeera", tone: "damage" },
  { id: "ConflictsTracker", label: "Conflicts Tracker", tone: "other" },
  { id: "OSINTWarfare", label: "OSINT Warfare", tone: "rsf" },
];

export const CHANNEL_TONE: Record<string, string> = Object.fromEntries(
  FEED_CHANNELS.map((c) => [c.id, c.tone]),
);

export function gdeltFamily(
  subtype: string,
): Array<"damage" | "flight" | "vehicles" | "corridor" | "reporting" | "thermal"> {
  const s = subtype.toLowerCase();
  if (s.includes("air") || s.includes("airlift")) return ["flight"];
  if (s.includes("vehicle") || s.includes("cargo")) return ["vehicles", "corridor"];
  if (s.includes("control")) return ["corridor"];
  if (s.includes("displac") || s.includes("report")) return ["reporting"];
  if (s.includes("fire") || s.includes("industrial")) return ["thermal"];
  if (s.includes("harm")) return ["damage", "reporting"];
  return ["damage"];
}

export const REGIONS: {
  id: string;
  label: string;
  west: number;
  south: number;
  east: number;
  north: number;
}[] = [
  { id: "sudan", label: "Sudan", west: 21.8, south: 9.4, east: 38.2, north: 22.8 },
  { id: "khartoum", label: "Khartoum", west: 32.25, south: 15.35, east: 32.75, north: 15.85 },
  { id: "darfur", label: "Darfur", west: 21.8, south: 10.6, east: 27.6, north: 16.4 },
  { id: "kordofan", label: "Kordofan", west: 27.2, south: 10.4, east: 31.4, north: 14.6 },
  { id: "gezira", label: "Gezira", west: 32.6, south: 13.0, east: 34.4, north: 15.0 },
  { id: "redsea", label: "Red Sea", west: 35.4, south: 17.6, east: 38.6, north: 22.2 },
  { id: "bluenile", label: "Blue Nile", west: 33.4, south: 9.6, east: 35.2, north: 12.2 },
  { id: "egypt", label: "Egypt", west: 29.6, south: 21.7, east: 36.2, north: 31.8 },
  { id: "ethiopia", label: "Ethiopia", west: 33.0, south: 8.6, east: 42.2, north: 14.9 },
  { id: "chad", label: "Chad", west: 13.4, south: 11.4, east: 24.0, north: 18.5 },
  { id: "libya", label: "Libya", west: 12.8, south: 19.6, east: 25.4, north: 33.0 },
  { id: "somalia", label: "Somalia", west: 41.0, south: -1.6, east: 51.4, north: 12.2 },
  { id: "uae", label: "UAE", west: 51.4, south: 22.4, east: 56.6, north: 26.5 },
];

export const FEED_SEED: import("@/lib/types").FeedItem[] = [
  {
    id: "tg-seed-dabanga-1",
    url: "https://www.dabangasudan.org/",
    source: "telegram",
    channel: "RadioDabanga",
    text: "Radio Dabanga continues daily public reporting on displacement from North Darfur and access constraints around El Fasher / Zamzam. Treat as humanitarian reporting, not a location fix.",
    timestamp: "2026-09-08T09:12:00Z",
    hasMedia: false,
    lat: 13.48,
    lon: 25.32,
    place: "Zamzam",
  },
  {
    id: "tg-seed-tribune-1",
    url: "https://sudantribune.com/",
    source: "telegram",
    channel: "sudantribune",
    text: "Sudan Tribune open reporting on Kordofan road conditions and El Obeid supply. Vehicle-column claims remain single-source until imagery or a second outlet agrees.",
    timestamp: "2026-09-06T14:40:00Z",
    hasMedia: false,
    lat: 13.183,
    lon: 30.217,
    place: "El Obeid",
  },
  {
    id: "tg-seed-aj-1",
    url: "https://www.aljazeera.com/",
    source: "telegram",
    channel: "aljazeeraglobal",
    text: "Al Jazeera coverage of Port Sudan as the civilian-government seat and Red Sea aviation. Scheduled traffic is the baseline; unusual cargo claims need airframe + routing, not a headline.",
    timestamp: "2026-09-04T11:05:00Z",
    hasMedia: false,
    lat: 19.616,
    lon: 37.216,
    place: "Port Sudan",
  },
  {
    id: "tg-seed-ct-1",
    url: "https://t.me/s/ConflictsTracker",
    source: "telegram",
    channel: "ConflictsTracker",
    text: "Conflicts Tracker public preview notes on Gezira / Wad Madani after the 2024–25 control swings. Named-place only — not a pin on a yard.",
    timestamp: "2026-08-28T18:22:00Z",
    hasMedia: false,
    lat: 14.401,
    lon: 33.52,
    place: "Wad Madani",
  },
  {
    id: "tg-seed-ow-1",
    url: "https://t.me/s/OSINTWarfare",
    source: "telegram",
    channel: "OSINTWarfare",
    text: "OSINT Warfare channel often posts unlocated clips. If a Sudan clip has no geolocation chain, it stays a feed note — it does not become a map pin.",
    timestamp: "2026-08-21T07:55:00Z",
    hasMedia: true,
  },
];
