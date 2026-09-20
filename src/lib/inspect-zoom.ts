import type { DetectHit, DetectKlass } from "@/lib/imagery-detect";
import type { Flag } from "@/lib/flags";

/** Yard-scale inspect zoom by morphology. z11 is theater — too wide to verify a chip. */
export const INSPECT_ZOOM: Record<DetectKlass, number> = {
  wreck_air: 17.0,
  wreck_bldg: 16.7,
  camp_buildup: 15.7,
  camp_grid: 15.5,
  irregular_pad: 16.0,
  vehicle_park: 16.4,
  cargo_yard: 16.1,
  earthwork: 15.6,
  pol_storage: 15.4,
  possible_damage: 16.0,
  burn_scar: 14.6,
  airfield_activity: 14.8,
  base_compound: 15.2,
  thermal_cluster: 12.8,
  unresolved_objects: 15.6,
  osm_gap: 14.2,
  crossing_cue: 15.0,
  maritime: 12.2,
  corridor_track: 11.2,
  reporting_cue: 13.6,
};

export function inspectZoomForKlass(klass?: DetectKlass, type?: Flag["type"]) {
  if (klass && INSPECT_ZOOM[klass] != null) return INSPECT_ZOOM[klass];
  if (type === "damage") return 16.0;
  if (type === "convoy") return 16.2;
  if (type === "flight") return 13.8;
  return 15.4;
}

export function padBbox(
  west: number,
  south: number,
  east: number,
  north: number,
  minDeg = 0.018,
) {
  const dlat = Math.max(minDeg, north - south);
  const dlon = Math.max(minDeg, east - west);
  const cy = (south + north) / 2;
  const cx = (west + east) / 2;
  return {
    west: cx - dlon / 2,
    south: cy - dlat / 2,
    east: cx + dlon / 2,
    north: cy + dlat / 2,
  };
}

export function inspectFromHit(hit: DetectHit) {
  const zoom = inspectZoomForKlass(hit.klass);
  const dlat = Math.abs(hit.north - hit.south);
  const dlon = Math.abs(hit.east - hit.west);
  const chip = dlat > 0 && dlon > 0 && dlat < 0.035 && dlon < 0.035;
  if (!chip) {
    return { lat: hit.lat, lon: hit.lon, zoom, label: hit.title, inspect: true as const };
  }
  const box = padBbox(hit.west, hit.south, hit.east, hit.north);
  return {
    lat: hit.lat,
    lon: hit.lon,
    zoom,
    label: hit.title,
    ...box,
    inspect: true as const,
  };
}

export function inspectFromFlag(f: Flag) {
  const zoom = inspectZoomForKlass(f.klass, f.type);
  const dlat = f.north != null && f.south != null ? Math.abs(f.north - f.south) : 99;
  const dlon = f.east != null && f.west != null ? Math.abs(f.east - f.west) : 99;
  const chip = dlat < 0.035 && dlon < 0.035;
  if (!chip) {
    return { lat: f.lat, lon: f.lon, zoom, label: f.title, inspect: true as const };
  }
  const box = padBbox(f.west!, f.south!, f.east!, f.north!);
  return {
    lat: f.lat,
    lon: f.lon,
    zoom,
    label: f.title,
    ...box,
    inspect: true as const,
  };
}
