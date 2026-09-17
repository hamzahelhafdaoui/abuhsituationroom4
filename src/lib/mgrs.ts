/** Compact WGS84 → MGRS for HUD telemetry (not a survey product). */
const BANDS = "CDEFGHJKLMNPQRSTUVWX";
const COLS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROWS = "ABCDEFGHJKLMNPQRSTUV";

function latLonToUtm(lat: number, lon: number) {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  let zone = Math.floor((lon + 180) / 6) + 1;
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  const lonOrigin = (zone - 1) * 6 - 180 + 3;
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;
  const lon0 = (lonOrigin * Math.PI) / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2);
  const T = Math.tan(latR) ** 2;
  const C = ep2 * Math.cos(latR) ** 2;
  const A = Math.cos(latR) * (lonR - lon0);
  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * latR -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * latR) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * latR) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * latR));
  const east =
    k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) +
    500000;
  let north =
    k0 *
    (M +
      N *
        Math.tan(latR) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
  if (lat < 0) north += 10000000;
  return { zone, east, north, northHemi: lat >= 0 };
}

export function toMgrs(lat: number, lon: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -80 || lat > 84) return "—";
  const { zone, east, north, northHemi } = latLonToUtm(lat, lon);
  const band = BANDS[Math.min(BANDS.length - 1, Math.max(0, Math.floor((lat + 80) / 8)))]!;
  const colSet = zone % 3 === 1 ? 0 : zone % 3 === 2 ? 8 : 16;
  const col = COLS[(colSet + Math.floor(east / 100000) - 1 + 24) % 24]!;
  const rowOff = zone % 2 === 0 ? 5 : 0;
  const row = ROWS[(Math.floor(north / 100000) + rowOff) % 20]!;
  const e = Math.floor(east % 100000)
    .toString()
    .padStart(5, "0")
    .slice(0, 4);
  const n = Math.floor(north % 100000)
    .toString()
    .padStart(5, "0")
    .slice(0, 4);
  return `${zone}${band} ${col}${row} ${e} ${n}${northHemi ? "" : ""}`;
}
