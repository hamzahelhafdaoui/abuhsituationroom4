import { createServerFn } from "@tanstack/react-start";
import {
  normalizeEonet,
  normalizeEarthquakes,
  normalizeGdacs,
  mergeHazards,
  type HazardFeed,
} from "./hazards";
import { createRequestCache } from "./request-cache";
const cached = createRequestCache(4);
export async function fetchHazards(): Promise<HazardFeed> {
  const providers = [
    {
      name: "NASA EONET",
      url: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100",
      parse: async (r: Response) => normalizeEonet(await r.json()),
    },
    {
      name: "USGS",
      url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      parse: async (r: Response) => normalizeEarthquakes(await r.json()),
    },
    {
      name: "GDACS",
      url: "https://www.gdacs.org/xml/rss.xml",
      parse: async (r: Response) => normalizeGdacs(await r.text()),
    },
  ];
  const results = await Promise.allSettled(
    providers.map((p) =>
      cached(p.name, 300_000, async () => {
        const r = await fetch(p.url, { signal: AbortSignal.timeout(15_000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return p.parse(r);
      }),
    ),
  );
  return {
    fetchedAt: new Date().toISOString(),
    events: mergeHazards(results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))),
    sources: results.map((r, i) => ({
      name: providers[i].name,
      count: r.status === "fulfilled" ? r.value.length : 0,
      status: r.status === "fulfilled" ? "ok" : "error",
      note:
        r.status === "fulfilled"
          ? "Published observations; event dates retained."
          : String(r.reason?.message ?? "Provider unavailable"),
    })),
  };
}
export const getHazards = createServerFn({ method: "GET" }).handler(fetchHazards);
