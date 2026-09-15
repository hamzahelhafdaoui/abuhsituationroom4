import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 16).replace("T", " ") + "Z";
}

export function formatDay(iso: string): string {
  return iso.slice(0, 10);
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function downloadBlob(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

export function mapCommand(cmd: "in" | "out") {
  window.dispatchEvent(new CustomEvent("sahel-map", { detail: cmd }));
}

export function mapFit(bbox: { west: number; south: number; east: number; north: number }) {
  window.dispatchEvent(new CustomEvent("sahel-map-fit", { detail: bbox }));
}

export function mapMeasure() {
  window.dispatchEvent(new CustomEvent("sahel-map-measure"));
}

export function mapFlyTo(lat: number, lon: number, zoom = 14) {
  window.dispatchEvent(new CustomEvent("sahel-map-fly", { detail: { lat, lon, zoom } }));
}

export function mapShot() {
  window.dispatchEvent(new CustomEvent("sahel-map-shot"));
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function snapshotUrl(
  date: string,
  bbox: { west: number; south: number; east: number; north: number },
  layer = "VIIRS_NOAA20_CorrectedReflectance_TrueColor",
  size = 768,
): string {
  const { west, south, east, north } = bbox;
  const png = layer.includes("HLS");
  const params = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: layer,
    CRS: "EPSG:4326",
    BBOX: `${south},${west},${north},${east}`,
    WIDTH: String(size),
    HEIGHT: String(size),
    FORMAT: png ? "image/png" : "image/jpeg",
    TIME: date,
    STYLES: "",
    TRANSPARENT: png ? "TRUE" : "FALSE",
  });
  return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${params.toString()}`;
}

export const PARTY_TONE: Record<string, string> = {
  saf: "bg-saf/15 text-saf border-saf/30",
  rsf: "bg-rsf/15 text-rsf border-rsf/30",
  mixed: "bg-mixed/15 text-mixed border-mixed/30",
  other_armed: "bg-other/15 text-other border-other/30",
  civilian: "bg-civilian/15 text-civilian border-civilian/30",
  unknown: "bg-unknown/15 text-unknown border-unknown/30",
};
