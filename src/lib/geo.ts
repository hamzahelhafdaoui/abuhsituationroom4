import { AOI } from "./types";

export function inAoi(lat: number, lon: number): boolean {
  return (
    lon >= AOI.west &&
    lon <= AOI.east &&
    lat >= AOI.south &&
    lat <= AOI.north
  );
}

export function inBbox(
  lat: number,
  lon: number,
  b: { west: number; south: number; east: number; north: number },
): boolean {
  return lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearest<T extends { lat: number; lon: number }>(
  lat: number,
  lon: number,
  items: T[],
  maxKm: number,
): { item: T; km: number } | null {
  let best: { item: T; km: number } | null = null;
  for (const item of items) {
    const km = haversineKm(lat, lon, item.lat, item.lon);
    if (km <= maxKm && (!best || km < best.km)) best = { item, km };
  }
  return best;
}

export function padBbox(
  lat: number,
  lon: number,
  padDeg = 0.18,
): { west: number; south: number; east: number; north: number } {
  return {
    west: lon - padDeg,
    south: lat - padDeg,
    east: lon + padDeg,
    north: lat + padDeg,
  };
}
