/** RSF-associated watchlist from public reporting + archive pins. Occupancy not claimed. */
import { SITES } from "@/data/catalog";

export type WatchWhy =
  | "control-reporting"
  | "rear-logistics"
  | "published-camp"
  | "sam-reporting"
  | "airfield"
  | "border-node";

export interface RsfWatchSite {
  id: string;
  siteId?: string;
  name: string;
  lat: number;
  lon: number;
  place: string;
  why: WatchWhy;
  note: string;
  sourceLabel: string;
  sourceUrl?: string;
  lastSeen: string;
  watch: "primary" | "approach";
}

export const RSF_WATCH: RsfWatchSite[] = [
  {
    id: "rw-hsnn",
    siteId: "hsnn",
    name: "Nyala Airport",
    lat: 12.0535,
    lon: 24.9562,
    place: "South Darfur",
    why: "airfield",
    note: "Open reporting treats Nyala as an RSF-associated air hub. Apron change and nearby published SAM reporting are the watch, not occupancy from this desk.",
    sourceLabel: "archive + @AfriMEOSINT",
    lastSeen: "2026-09-08",
    watch: "primary",
  },
  {
    id: "rw-nyala-sam",
    siteId: "nyala-sam",
    name: "Nyala Airport — published SAM site",
    lat: 12.061,
    lon: 24.962,
    place: "South Darfur",
    why: "sam-reporting",
    note: "@AfriMEOSINT (Apr 2025) described TELs and C2-typical vehicles near Nyala Airport, later named as FK-2000-typical SHORAD. Pin is the published location. Not a weapons identification from this desk.",
    sourceLabel: "@AfriMEOSINT (X)",
    sourceUrl: "https://x.com/AfriMEOSINT/status/1912460578028745036",
    lastSeen: "2025-04-16",
    watch: "primary",
  },
  {
    id: "rw-hsfs",
    siteId: "hsfs",
    name: "El Fasher Airport",
    lat: 13.6148,
    lon: 25.3246,
    place: "North Darfur",
    why: "control-reporting",
    note: "Late-2025 open reporting described a change of control in El Fasher. Watch the airfield, Saudi Hospital, and Zamzam as civilian-harm / logistics nodes.",
    sourceLabel: "archive",
    lastSeen: "2026-09-06",
    watch: "primary",
  },
  {
    id: "rw-hsgn",
    siteId: "hsgn",
    name: "El Geneina Airport",
    lat: 13.4817,
    lon: 22.4657,
    place: "West Darfur",
    why: "airfield",
    note: "West Darfur strip on the Adré corridor. Vehicle parks here are logged, not typed.",
    sourceLabel: "archive",
    lastSeen: "2026-09-03",
    watch: "primary",
  },
  {
    id: "rw-se-libya",
    siteId: "se-libya-camp",
    name: "SE Libya desert camp (approx.)",
    lat: 22.35,
    lon: 23.05,
    place: "Kufra approaches, Libya",
    why: "published-camp",
    note: "@AfriMEOSINT (Jun 2026 stills, posted 13 Sep): ~300 technicals, fuel/water trailers, container trucks described as staged before a Kordofan push. Coordinates approximate. RSF-linked in that reporting — movement into Sudan not shown here.",
    sourceLabel: "@AfriMEOSINT (X)",
    sourceUrl: "https://x.com/AfriMEOSINT/status/2098986948584980880",
    lastSeen: "2026-06-01",
    watch: "primary",
  },
  {
    id: "rw-subul",
    siteId: "subul-salam",
    name: "Subul al-Salam compound (Kufra)",
    lat: 24.22,
    lon: 23.28,
    place: "Kufra, Libya",
    why: "rear-logistics",
    note: "LNA-mapped battalion compound. @AfriMEOSINT logged technicals/trailers massing Aug–8 Sep plus two new structures. Not an RSF identification. Change is the observation on the Libya–Darfur approach.",
    sourceLabel: "@AfriMEOSINT (X)",
    sourceUrl: "https://x.com/AfriMEOSINT/status/2098588375158497766",
    lastSeen: "2026-09-08",
    watch: "approach",
  },
  {
    id: "rw-kufra",
    siteId: "kufra-afld",
    name: "Kufra / Al Jawf Airport",
    lat: 24.1787,
    lon: 23.314,
    place: "Libya",
    why: "rear-logistics",
    note: "8 Sep stills: ~3 IL-76TD-typical + ATR-72-typical on the apron. Cargo traffic is a watch, type ≠ payload.",
    sourceLabel: "@AfriMEOSINT (X)",
    sourceUrl: "https://x.com/AfriMEOSINT/status/2098546872570851768",
    lastSeen: "2026-09-08",
    watch: "approach",
  },
  {
    id: "rw-amdjarass",
    siteId: "amdjarass",
    name: "Amdjarass airstrip (Chad)",
    lat: 15.97096,
    lon: 22.77059,
    place: "Ennedi-Est, Chad",
    why: "rear-logistics",
    note: "Open reporting names Amdjarass in RSF-rear / UAE-linked logistics stories. Pin is the public strip.",
    sourceLabel: "archive",
    lastSeen: "2026-09-01",
    watch: "approach",
  },
  {
    id: "rw-adre",
    siteId: "adre",
    name: "Adré humanitarian hub (Chad)",
    lat: 13.526,
    lon: 22.198,
    place: "Ouaddaï, Chad",
    why: "border-node",
    note: "Humanitarian baseline first. Staging on the Geneina approach is logged separately from the camp.",
    sourceLabel: "archive",
    lastSeen: "2026-09-01",
    watch: "approach",
  },
  {
    id: "rw-haso",
    siteId: "haso",
    name: "Asosa Airport (HASO)",
    lat: 10.0186,
    lon: 34.586,
    place: "Benishangul-Gumuz, Ethiopia",
    why: "rear-logistics",
    note: "Blue Nile approach. Sentinel-2 sequence 20 Aug–7 Sep: ~4 IL-76TD-typical on the apron. Open reporting links some rotations to Al Ain. Airbridge is a hypothesis until a chain into Sudan is shown.",
    sourceLabel: "@AfriMEOSINT (X)",
    sourceUrl: "https://x.com/AfriMEOSINT/status/2098462642910220459",
    lastSeen: "2026-09-07",
    watch: "primary",
  },
  {
    id: "rw-asosa-endf",
    siteId: "asosa-endf",
    name: "Asosa outskirts compound",
    lat: 10.05,
    lon: 34.55,
    place: "Ethiopia / Blue Nile approach",
    why: "published-camp",
    note: "Planet/Airbus posts: technicals, car-carriers, tents, fuel tanks. Default actor undetermined Ethiopian or other local until a movement chain is shown.",
    sourceLabel: "archive OSINT",
    lastSeen: "2026-05-21",
    watch: "primary",
  },
  {
    id: "rw-menge",
    siteId: "menge",
    name: "Menge approaches",
    lat: 10.65,
    lon: 34.77,
    place: "Ethiopia / Blue Nile",
    why: "border-node",
    note: "Rural strip east of Asosa on the Kurmuk corridor. Berms/tents logged as change — not an army ID.",
    sourceLabel: "archive",
    lastSeen: "2026-08-20",
    watch: "approach",
  },
  {
    id: "rw-kurmuk",
    name: "Kurmuk approaches",
    lat: 10.55,
    lon: 34.28,
    place: "Blue Nile State",
    why: "border-node",
    note: "Eastern front town. Telegram control-map updates in 2026 described RSF/SPLM-N pressure. Watch pads on both sides of the line.",
    sourceLabel: "archive reporting",
    lastSeen: "2026-03-23",
    watch: "primary",
  },
];

export const WHY_LABEL: Record<WatchWhy, string> = {
  "control-reporting": "Control reporting",
  "rear-logistics": "Rear / logistics",
  "published-camp": "Published camp",
  "sam-reporting": "Published SAM cue",
  airfield: "Airfield",
  "border-node": "Border node",
};

export function rsfWatchResolved() {
  return RSF_WATCH.map((w) => {
    const site = w.siteId ? SITES.find((s) => s.id === w.siteId) : undefined;
    return { ...w, lat: site?.lat ?? w.lat, lon: site?.lon ?? w.lon };
  });
}
