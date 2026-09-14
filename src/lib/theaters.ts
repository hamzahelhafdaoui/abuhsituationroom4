export type TheaterId =
  | "sdn"
  | "egy"
  | "eth"
  | "som"
  | "tcd"
  | "lby"
  | "are"
  | "eri"
  | "red"
  | "all";

export interface Theater {
  id: TheaterId;
  iso: string;
  label: string;
  short: string;
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
  notes: string;
  jumps: { id: string; label: string }[];
}

export const THEATERS: Theater[] = [
  {
    id: "sdn",
    iso: "SD",
    label: "Sudan",
    short: "SDN",
    west: 21.8,
    south: 9.4,
    east: 38.6,
    north: 22.8,
    zoom: 5.2,
    notes: "Primary wing. Bases, yards, camps, crossings, 2022–2026 archive.",
    jumps: [
      { id: "hsss", label: "Khartoum" },
      { id: "wad-madani", label: "Wad Madani" },
      { id: "hsfs", label: "El Fasher" },
      { id: "hspn", label: "Port Sudan" },
      { id: "hsnn", label: "Nyala" },
      { id: "hsgn", label: "Geneina" },
    ],
  },
  {
    id: "egy",
    iso: "EG",
    label: "Egypt",
    short: "EGY",
    west: 29.6,
    south: 21.7,
    east: 36.2,
    north: 31.8,
    zoom: 5.4,
    notes: "Nile rear, Aswan, Berenice/Ras Banas, Suez approaches.",
    jumps: [
      { id: "heaw", label: "Aswan" },
      { id: "hebn", label: "Berenice" },
      { id: "hesz", label: "Suez" },
      { id: "heps", label: "Port Said" },
      { id: "argeen", label: "Argeen" },
    ],
  },
  {
    id: "eth",
    iso: "ET",
    label: "Ethiopia",
    short: "ETH",
    west: 33.0,
    south: 8.6,
    east: 42.2,
    north: 14.9,
    zoom: 5.6,
    notes: "Blue Nile / Benishangul approaches, Asosa, Metema, Humera.",
    jumps: [
      { id: "haso", label: "Asosa" },
      { id: "habd", label: "Bahir Dar" },
      { id: "hang", label: "Gondar" },
      { id: "metema", label: "Metema" },
      { id: "humera", label: "Humera" },
    ],
  },
  {
    id: "som",
    iso: "SO",
    label: "Somalia",
    short: "SOM",
    west: 41.0,
    south: -1.6,
    east: 51.4,
    north: 12.2,
    zoom: 5.1,
    notes: "Berbera, Bosaso, Mogadishu, Kismayo — public port and airfield context.",
    jumps: [
      { id: "hcmh", label: "Mogadishu" },
      { id: "hcmb", label: "Berbera" },
      { id: "hcms", label: "Bosaso" },
      { id: "hcmk", label: "Kismayo" },
    ],
  },
  {
    id: "tcd",
    iso: "TD",
    label: "Chad",
    short: "TCD",
    west: 13.4,
    south: 11.4,
    east: 24.0,
    north: 23.0,
    zoom: 5.3,
    notes: "Adré, Tine, Abéché, N'Djamena. Humanitarian traffic is the civilian baseline.",
    jumps: [
      { id: "fttj", label: "N'Djamena" },
      { id: "ftty", label: "Abéché" },
      { id: "adre", label: "Adré" },
      { id: "tine", label: "Tine" },
      { id: "faya", label: "Faya" },
    ],
  },
  {
    id: "lby",
    iso: "LY",
    label: "Libya",
    short: "LBY",
    west: 12.8,
    south: 19.6,
    east: 25.4,
    north: 33.0,
    zoom: 5.0,
    notes: "Kufra, Jufra, Benghazi, Tobruk. Desert tracks, not occupancy.",
    jumps: [
      { id: "kufra", label: "Kufra" },
      { id: "hlba", label: "Benghazi" },
      { id: "hltq", label: "Tobruk" },
      { id: "khadim", label: "Al Khadim" },
      { id: "brak", label: "Brak" },
    ],
  },
  {
    id: "are",
    iso: "AE",
    label: "UAE",
    short: "ARE",
    west: 51.4,
    south: 22.4,
    east: 56.6,
    north: 26.5,
    zoom: 7.1,
    notes: "Al Dhafra, Minhad, Jebel Ali, Fujairah. Public air/port nodes only.",
    jumps: [
      { id: "omam", label: "Al Dhafra" },
      { id: "omdw", label: "Minhad" },
      { id: "jebel-ali", label: "Jebel Ali" },
      { id: "fujairah", label: "Fujairah" },
      { id: "omad", label: "Al Bateen" },
    ],
  },
  {
    id: "eri",
    iso: "ER",
    label: "Eritrea",
    short: "ERI",
    west: 36.4,
    south: 12.3,
    east: 43.4,
    north: 18.1,
    zoom: 6.2,
    notes: "Assab / Massawa corridor. Included because it sits on the UAE–Red Sea chain.",
    jumps: [
      { id: "hhas", label: "Assab" },
      { id: "hham", label: "Massawa" },
    ],
  },
  {
    id: "red",
    iso: "RS",
    label: "Red Sea",
    short: "RED",
    west: 32.0,
    south: 10.0,
    east: 45.2,
    north: 32.0,
    zoom: 4.6,
    notes: "Suez–Port Sudan–Assab–Bab el-Mandeb maritime picture.",
    jumps: [
      { id: "hesz", label: "Suez" },
      { id: "hspn", label: "Port Sudan" },
      { id: "hhas", label: "Assab" },
      { id: "hddd", label: "Djibouti" },
    ],
  },
  {
    id: "all",
    iso: "TH",
    label: "Full theater",
    short: "ALL",
    west: 9.5,
    south: -1.2,
    east: 57.0,
    north: 32.8,
    zoom: 3.7,
    notes: "Sudan wing plus adjacent states named in open reporting on this conflict.",
    jumps: [],
  },
];

export const THEATER_BY_ID: Record<TheaterId, Theater> = Object.fromEntries(
  THEATERS.map((t) => [t.id, t]),
) as Record<TheaterId, Theater>;

export function theaterOf(lat: number, lon: number): TheaterId {
  const order: TheaterId[] = ["are", "som", "lby", "tcd", "egy", "eri", "eth", "sdn"];
  for (const id of order) {
    const t = THEATER_BY_ID[id];
    if (lon >= t.west && lon <= t.east && lat >= t.south && lat <= t.north) return id;
  }
  return "sdn";
}

export const CORRIDORS: {
  id: string;
  name: string;
  notes: string;
  coordinates: [number, number][];
}[] = [
  {
    id: "red-sea",
    name: "Red Sea maritime",
    notes: "Approximate Suez–Port Sudan–Assab–Bab el-Mandeb lane. Not live AIS.",
    coordinates: [
      [32.31, 31.26],
      [32.55, 29.96],
      [37.22, 19.62],
      [42.65, 13.07],
      [43.33, 12.58],
      [44.94, 10.39],
    ],
  },
  {
    id: "libya-darfur",
    name: "Kufra–Darfur desert",
    notes: "Publicly reported desert-track geometry. Absence of a pin is not absence of traffic.",
    coordinates: [
      [23.31, 24.18],
      [21.83, 21.7],
      [25.35, 16.5],
      [25.35, 13.63],
    ],
  },
  {
    id: "chad-darfur",
    name: "Chad–West Darfur",
    notes: "N'Djamena–Abéché–Adré–Geneina. Humanitarian baseline on the Chadian side.",
    coordinates: [
      [15.03, 12.13],
      [20.84, 13.85],
      [22.2, 13.47],
      [22.45, 13.45],
    ],
  },
  {
    id: "uae-horn",
    name: "UAE–Horn reporting",
    notes: "Jebel Ali / Dhafra to Assab / Port Sudan as reported in open sources. Not a cargo claim.",
    coordinates: [
      [54.65, 24.43],
      [55.06, 24.99],
      [42.65, 13.07],
      [37.22, 19.62],
    ],
  },
  {
    id: "ethiopia-blue-nile",
    name: "Blue Nile–Asosa",
    notes: "Kurmuk / Asosa / Menge approaches.",
    coordinates: [
      [34.36, 11.79],
      [34.28, 10.55],
      [34.59, 10.02],
    ],
  },
];
