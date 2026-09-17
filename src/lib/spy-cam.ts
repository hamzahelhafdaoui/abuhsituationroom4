/** Cinematic camera — GEV-style slew / orbit / lock, MapLibre. */

export type SlewPhase = "idle" | "slewing" | "lock";

export interface SlewDetail {
  phase: SlewPhase;
  label?: string;
  duration?: number;
}

export function spyEase(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function pitchForZoom(z: number) {
  if (z < 6.4) return 0;
  return Math.min(34, (z - 6.4) * 3.8);
}

export function aglKm(lat: number, zoom: number) {
  const gsd = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  return (gsd * 720) / 1000;
}

export function flyMs(fromZ: number, toZ: number, distDeg: number) {
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return 180;
  return Math.min(3400, Math.max(1100, 720 + Math.abs(toZ - fromZ) * 280 + distDeg * 110));
}

export function emitSlew(detail: SlewDetail) {
  window.dispatchEvent(new CustomEvent<SlewDetail>("ahsr-slew", { detail }));
}

type FlyMap = {
  getCenter: () => { lat: number; lng: number };
  getZoom: () => number;
  getBearing: () => number;
  flyTo: (o: Record<string, unknown>) => void;
  once: (ev: string, fn: () => void) => void;
  off: (ev: string, fn: () => void) => void;
};

export function cinematicFly(
  map: FlyMap,
  opts: { lon: number; lat: number; zoom: number; label?: string },
) {
  const from = map.getCenter();
  const dist = Math.hypot(opts.lat - from.lat, opts.lon - from.lng);
  const duration = flyMs(map.getZoom(), opts.zoom, dist);
  const inward = opts.zoom > map.getZoom() + 0.35;
  const bearing = map.getBearing() + (inward ? 16 + Math.min(18, dist * 5) : -8);
  emitSlew({ phase: "slewing", label: opts.label, duration });
  const onEnd = () => {
    map.off("moveend", onEnd);
    emitSlew({ phase: "lock", label: opts.label });
    window.setTimeout(() => emitSlew({ phase: "idle" }), 1600);
  };
  map.once("moveend", onEnd);
  map.flyTo({
    center: [opts.lon, opts.lat],
    zoom: opts.zoom,
    pitch: pitchForZoom(opts.zoom),
    bearing,
    duration,
    curve: 1.62,
    speed: 0.48,
    easing: spyEase,
    essential: true,
  });
}
