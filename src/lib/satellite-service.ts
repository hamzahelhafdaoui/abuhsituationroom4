import { createServerFn } from "@tanstack/react-start";
import {
  scanInput,
  rankScenePairs,
  detectLandChanges,
  type AutoScanInput,
  type SatelliteScene,
} from "./satellite-analysis";
import { createRequestCache } from "./request-cache";
const cache = createRequestCache(12);
const ROOT = "https://earth-search.aws.element84.com/v1";
const assetAllowed = (url: string) => {
  const u = new URL(url);
  return u.protocol === "https:" && u.hostname === "sentinel-cogs.s3.us-west-2.amazonaws.com";
};
async function catalogue(
  input: AutoScanInput,
  target: string,
  signal: AbortSignal,
): Promise<SatelliteScene[]> {
  const deltaLat = input.sizeKm / 2 / 111.32,
    deltaLon = deltaLat / Math.cos((input.lat * Math.PI) / 180);
  const day = Date.parse(target),
    delta = input.windowDays * 86400000;
  const params = new URLSearchParams({
    collections: "sentinel-2-l2a",
    bbox: [
      input.lon - deltaLon,
      input.lat - deltaLat,
      input.lon + deltaLon,
      input.lat + deltaLat,
    ].join(","),
    datetime: `${new Date(day - delta).toISOString()}/${new Date(day + delta + 86399999).toISOString()}`,
    limit: "100",
    query: JSON.stringify({ "eo:cloud_cover": { lte: input.maxCloud } }),
  });
  const response = await fetch(`${ROOT}/search?${params}`, { signal });
  if (!response.ok) throw new Error(`Scene catalogue returned HTTP ${response.status}.`);
  const body = await response.json();
  if (!Array.isArray(body.features))
    throw new Error("Scene catalogue returned an invalid response.");
  return body.features
    .filter(
      (f: any) =>
        f.assets?.visual?.href &&
        f.assets?.scl?.href &&
        assetAllowed(f.assets.visual.href) &&
        assetAllowed(f.assets.scl.href),
    )
    .map((f: any) => ({
      id: f.id,
      date: f.properties.datetime,
      cloud: f.properties["eo:cloud_cover"] ?? 100,
      epsg: f.properties["proj:epsg"],
      tile:
        f.properties["grid:code"] ??
        `${f.properties["mgrs:utm_zone"]}${f.properties["mgrs:latitude_band"]}${f.properties["mgrs:grid_square"]}`,
      visual: f.assets.visual.href,
      scl: f.assets.scl.href,
      metadata: `${ROOT}/collections/sentinel-2-l2a/items/${encodeURIComponent(f.id)}`,
    }))
    .filter(
      (f: SatelliteScene) =>
        Number.isInteger(f.epsg) && Number.isFinite(f.cloud) && f.cloud <= input.maxCloud,
    );
}
async function run(input: AutoScanInput) {
  const { fromUrl } = await import("geotiff");
  const { default: proj4 } = await import("proj4");
  const { createHash } = await import("node:crypto");
  const signal = AbortSignal.timeout(150000);
  const [before, after] = await Promise.all([
    catalogue(input, input.before, signal),
    catalogue(input, input.after, signal),
  ]);
  const pairs = rankScenePairs(before, after, input);
  if (!pairs.length)
    throw new Error(
      `No compatible clear scene pair found (${before.length} before scenes; ${after.length} after scenes). Widen the date window or choose earlier dates.`,
    );
  const failures: string[] = [];
  for (const pair of pairs) {
    try {
      const epsg = pair.before.epsg,
        zone = epsg % 100;
      if (!((epsg >= 32601 && epsg <= 32660) || (epsg >= 32701 && epsg <= 32760)))
        throw new Error("Scene projection is not supported.");
      const utm = `+proj=utm +zone=${zone} ${epsg >= 32700 ? "+south " : ""}+datum=WGS84 +units=m +no_defs`;
      const center = proj4("EPSG:4326", utm, [input.lon, input.lat]);
      const half = input.sizeKm * 500;
      // Snap both dates to one shared 20 m grid, also aligned with the SCL mask.
      const west = Math.floor((center[0] - half) / 20) * 20,
        south = Math.floor((center[1] - half) / 20) * 20,
        east = Math.ceil((center[0] + half) / 20) * 20,
        north = Math.ceil((center[1] + half) / 20) * 20;
      const width = Math.round((east - west) / 10),
        height = Math.round((north - south) / 10);
      const outputWidth = Math.min(512, width),
        outputHeight = Math.round((height * outputWidth) / width);
      const read = async (scene: SatelliteScene) => {
        const [rgbTif, sclTif] = await Promise.all([
          fromUrl(scene.visual, { allowFullFile: false }, signal),
          fromUrl(scene.scl, { allowFullFile: false }, signal),
        ]);
        try {
          const im = await rgbTif.getImage(),
            mask = await sclTif.getImage();
          const windowFor = (image: typeof im) => {
            const [ox, oy] = image.getOrigin(),
              [rx, ry] = image.getResolution();
            const win = [
              Math.round((west - ox) / rx),
              Math.round((north - oy) / ry),
              Math.round((east - ox) / rx),
              Math.round((south - oy) / ry),
            ];
            if (win[0] < 0 || win[1] < 0 || win[2] > image.getWidth() || win[3] > image.getHeight())
              throw new Error(
                "Requested area crosses the available scene edge. Move the map center or reduce area size.",
              );
            return win;
          };
          const [rgb, scl] = await Promise.all([
            im.readRGB({
              window: windowFor(im),
              width: outputWidth,
              height: outputHeight,
              interleave: true,
              resampleMethod: "bilinear",
              signal,
            }),
            mask.readRasters({
              window: windowFor(mask),
              width: outputWidth,
              height: outputHeight,
              interleave: true,
              resampleMethod: "nearest",
              samples: [0],
              signal,
            }),
          ]);
          return {
            rgb: Uint8Array.from(rgb as ArrayLike<number>),
            scl: Uint8Array.from(scl as ArrayLike<number>),
          };
        } finally {
          await rgbTif.close();
          await sclTif.close();
        }
      };
      const [b, a] = await Promise.all([read(pair.before), read(pair.after)]);
      const result = detectLandChanges(b.rgb, a.rgb, b.scl, a.scl, outputWidth, outputHeight);
      if (result.validFraction < 0.25)
        throw new Error(
          `Only ${(result.validFraction * 100).toFixed(0)}% comparable land after cloud/shadow/water masking.`,
        );
      const corners = [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ].map((p) => proj4(utm, "EPSG:4326", p));
      const candidateFeatures = {
        type: "FeatureCollection" as const,
        features: result.candidates.map((c, i) => ({
          type: "Feature" as const,
          properties: {
            index: i + 1,
            label: "Change " + (i + 1),
            status: "Unreviewed visible change",
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              [
                [c.x, c.y],
                [c.x + c.width, c.y],
                [c.x + c.width, c.y + c.height],
                [c.x, c.y + c.height],
                [c.x, c.y],
              ].map(([x, y]) =>
                proj4(utm, "EPSG:4326", [west + x * (east - west), north - y * (north - south)]),
              ),
            ],
          },
        })),
      };
      const pack = (pixels: Uint8Array) => Buffer.from(pixels).toString("base64");
      return {
        candidateFeatures,
        before: {
          ...pair.before,
          rgb: pack(b.rgb),
          sha256: createHash("sha256").update(b.rgb).digest("hex"),
        },
        after: {
          ...pair.after,
          rgb: pack(a.rgb),
          sha256: createHash("sha256").update(a.rgb).digest("hex"),
        },
        width: outputWidth,
        height: outputHeight,
        overlay: pack(result.overlay),
        candidates: result.candidates,
        validFraction: result.validFraction,
        changedFraction: result.changedFraction,
        exposureBias: result.exposureBias,
        metersPerPixel: (east - west) / outputWidth,
        corners,
        epsg,
        projectedBounds: [west, south, east, north],
        searched: { before: before.length, after: after.length },
        attempts: failures,
        generatedAt: new Date().toISOString(),
      };
    } catch (e) {
      if (signal.aborted)
        throw new Error("Satellite data retrieval timed out. Try a smaller area.");
      failures.push(
        `${pair.before.id} / ${pair.after.id}: ${e instanceof Error ? e.message : "Raster read failed"}`,
      );
    }
  }
  throw new Error(`No usable image pair: ${failures.join(" | ")}`);
}
export const runSatelliteAnalysis = createServerFn({ method: "POST" })
  .inputValidator((data: AutoScanInput) => scanInput(data))
  .handler(async ({ data }) =>
    cache(`civilian-imagery:${JSON.stringify(data)}`, 10 * 60_000, () => run(data)),
  );
export type SatelliteScanResult = Awaited<ReturnType<typeof runSatelliteAnalysis>>;
