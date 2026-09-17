/** GEOINT hunt list a military OSINT desk actually runs — observation language only. */

export type HuntId =
  | "bda"
  | "cargo"
  | "air"
  | "sea"
  | "veh"
  | "pad"
  | "irreg"
  | "berm"
  | "pol"
  | "camp"
  | "xing"
  | "thrm"
  | "track"
  | "fx"
  | "osm"
  | "wire"
  | "saf"
  | "rsf"
  | "chain";

export interface Hunt {
  id: HuntId;
  short: string;
  label: string;
  look: string;
}

export const HUNTS: Hunt[] = [
  { id: "bda", short: "BDA", label: "Damage / BDA", look: "Roof scrape, scorch, FIRMS on structure, catalog damaged. Not a strike call." },
  { id: "cargo", short: "CARGO", label: "Cargo / logistics", look: "Yards, cargo-typical airframes, car-carriers, apron objects. Type ≠ payload." },
  { id: "air", short: "AIR", label: "Airfields & strips", look: "Aprons, unlisted strips, hangars, cargo-typical overflight." },
  { id: "sea", short: "SEA", label: "Ports & ships", look: "AIS-typical near public ports, new yard geometry. Not a cargo claim." },
  { id: "veh", short: "VEH", label: "Vehicle parks", look: "Compact-object clusters, parking grids, technicals-typical. 30 m cannot ID type." },
  { id: "pad", short: "PAD", label: "Compounds / pads", look: "Bermed compounds, tents, staging pads. Morphology, not occupancy." },
  { id: "irreg", short: "IRREG", label: "Non-army pads", look: "ETH/TCD compounds and strips not labeled national army." },
  { id: "berm", short: "BERM", label: "Earthworks", look: "Linear HV, new berms, revetments, fighting-position geometry." },
  { id: "pol", short: "POL", label: "Fuel / storage", look: "Tank farms, bladders, tanker-typical airframes, refinery heat." },
  { id: "camp", short: "CAMP", label: "Camps", look: "Tent grids vs IDP baseline. Do not relabel humanitarian as military." },
  { id: "xing", short: "XING", label: "Crossings / bridges", look: "Border posts, river crossings, new tracks to the line." },
  { id: "thrm", short: "THRM", label: "Thermal", look: "Non-ag FIRMS, night clusters, industrial heat. Not a strike feed." },
  { id: "track", short: "TRACK", label: "Desert tracks / wells", look: "Well stops, dust corridors, remote pads on Libya–Chad–Darfur lines." },
  { id: "fx", short: "FX", label: "Foreign-linked nodes", look: "Public UAE / Assab / Berbera / Kufra / Dhafra pins. Pin ≠ cargo." },
  { id: "osm", short: "OSM", label: "Uncatalogued features", look: "OSM-AI-helper: existing / new / missed vs volunteered OSM. Not a secret-base finder." },
  { id: "wire", short: "WIRE", label: "Reporting cues", look: "News / GDELT / @AfriMEOSINT geocoded as leads, not facts." },
  { id: "saf", short: "SAF", label: "SAF-typical picture", look: "Formal garrisons, airbases, Nile rear. Compiled control, not occupancy." },
  { id: "rsf", short: "RSF", label: "RSF-typical picture", look: "Non-SAF compounds, technicals parks, converted yards. Indicators-and-patterns — not ownership." },
  { id: "chain", short: "CHAIN", label: "Movement chain", look: "Arrival → staging → hub → operational area. Libya–Darfur and Ethiopia–Kurmuk. Chain incomplete until observed." },
];

export const HUNT_BY_ID = Object.fromEntries(HUNTS.map((h) => [h.id, h])) as Record<HuntId, Hunt>;

const WIRE: [HuntId, RegExp][] = [
  ["bda", /\b(strike|airstrike|shelling|bombard|artillery|destroyed|rubble|burned|scorch|bda|damage)\b/i],
  ["cargo", /\b(airlift|il-?76|c-?17|c-?130|cargo|convoy|shipment|logistics|supply|ammunition|arms)\b/i],
  ["air", /\b(drone|uav|runway|apron|hangar|aircraft|airfield|airstrip)\b/i],
  ["sea", /\b(port|vessel|ship|dhow|freighter|ais|harbour|harbor)\b/i],
  ["veh", /\b(technical|pickup|armour|armor|tank|vehicle|ifv|apc)\b/i],
  ["pad", /\b(base|compound|barrack|garrison|outpost|staging)\b/i],
  ["berm", /\b(berm|trench|earthwork|fortif|revetment|fighting position)\b/i],
  ["pol", /\b(fuel|diesel|petrol|pol|refinery|bladder|depot)\b/i],
  ["camp", /\b(camp|idp|displac|tent|shelter)\b/i],
  ["xing", /\b(crossing|border|bridge|checkpoint|frontier)\b/i],
  ["fx", /\b(uae|emirati|abu dhabi|assab|berbera|kufra|dhafra|wagner|africa corps|pecotox)\b/i],
  ["irreg", /\b(makeshift|unofficial|non-army|militia|rsf rear)\b/i],
  ["saf", /\b(saf|sudanese armed|sudan army|army garrison)\b/i],
  ["rsf", /\b(rsf|rapid support|hemedti|paramilitary)\b/i],
  ["chain", /\b(convoy|airbridge|resupply|staging|kufra|asosa|libya.?sudan|movement chain)\b/i],
];

export function matchHunts(text: string): HuntId[] {
  const out: HuntId[] = [];
  for (const [id, re] of WIRE) {
    if (re.test(text)) out.push(id);
  }
  return out;
}

export function huntsFromKlass(klass: string): HuntId[] {
  switch (klass) {
    case "possible_damage":
      return ["bda"];
    case "cargo_yard":
      return ["cargo"];
    case "airfield_activity":
      return ["air"];
    case "maritime":
      return ["sea"];
    case "vehicle_park":
      return ["veh"];
    case "base_compound":
      return ["pad"];
    case "irregular_pad":
      return ["irreg", "pad"];
    case "earthwork":
      return ["berm"];
    case "pol_storage":
      return ["pol"];
    case "camp_grid":
      return ["camp"];
    case "crossing_cue":
      return ["xing"];
    case "thermal_cluster":
      return ["thrm"];
    case "corridor_track":
      return ["track"];
    case "osm_gap":
      return ["osm"];
    case "reporting_cue":
      return ["wire"];
    case "burn_scar":
      return ["bda"];
    case "wreck_air":
      return ["bda", "air"];
    case "wreck_bldg":
      return ["bda"];
    case "camp_buildup":
      return ["camp", "pad", "veh"];
    default:
      return ["pad"];
  }
}

const FX_RE =
  /uae|emirati|dhafra|minhad|jebel ali|fujairah|assab|berbera|bosaso|kufra|al khadim|dp world/i;

export function isForeignLinked(s: { name: string; notes: string; admin2: string }): boolean {
  return FX_RE.test(`${s.name} ${s.notes} ${s.admin2}`);
}
