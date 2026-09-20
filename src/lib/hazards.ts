// Provider mappings adapted from simplifaisoul/osiris (MIT). See THIRD-PARTY-NOTICES.md.
export type Hazard = {
  id: string;
  title: string;
  category: string;
  lat: number;
  lon: number;
  at: string;
  url: string;
  provider: string;
  severity: string;
};
export type HazardFeed = {
  events: Hazard[];
  sources: { name: string; count: number; status: "ok" | "error"; note: string }[];
  fetchedAt: string;
};
export const validPoint = (lon: unknown, lat: unknown): boolean =>
  typeof lon === "number" &&
  typeof lat === "number" &&
  Number.isFinite(lon) &&
  Number.isFinite(lat) &&
  Math.abs(lon) <= 180 &&
  Math.abs(lat) <= 90;
export function safeSource(value: unknown, fallback: string): string {
  try {
    const u = new URL(String(value));
    return u.protocol === "https:" ? u.href : fallback;
  } catch {
    return fallback;
  }
}
export function normalizeEonet(data: any): Hazard[] {
  if (!Array.isArray(data.events)) throw new Error("Invalid EONET response");
  return data.events.flatMap((event: any) => {
    const geometries = (event.geometry ?? [])
      .filter(
        (g: any) =>
          g.type === "Point" &&
          validPoint(g.coordinates?.[0], g.coordinates?.[1]) &&
          Number.isFinite(Date.parse(g.date)),
      )
      .sort((a: any, b: any) => Date.parse(b.date) - Date.parse(a.date));
    const g = geometries[0],
      category = event.categories?.[0]?.id;
    if (!g || !event.id || ["wildfires", "earthquakes"].includes(category)) return [];
    return [
      {
        id: `eonet-${event.id}`,
        title: String(event.title),
        category: event.categories?.[0]?.title ?? "Natural event",
        lon: g.coordinates[0],
        lat: g.coordinates[1],
        at: new Date(g.date).toISOString(),
        url: safeSource(event.sources?.[0]?.url, "https://eonet.gsfc.nasa.gov"),
        provider: "NASA EONET",
        severity: "Not supplied",
      },
    ];
  });
}
export function normalizeEarthquakes(data: any): Hazard[] {
  if (!Array.isArray(data.features)) throw new Error("Invalid USGS response");
  return data.features.flatMap((f: any) => {
    const [lon, lat] = f.geometry?.coordinates ?? [],
      p = f.properties ?? {};
    if (!f.id || !validPoint(lon, lat) || !Number.isFinite(p.time) || !Number.isFinite(p.mag))
      return [];
    return [
      {
        id: `usgs-${f.id}`,
        title: `M${p.mag.toFixed(1)} · ${p.place ?? "Earthquake"}`,
        category: "Earthquake",
        lon,
        lat,
        at: new Date(p.time).toISOString(),
        url: safeSource(p.url, "https://earthquake.usgs.gov"),
        provider: "USGS",
        severity: p.alert ?? "Not supplied",
      },
    ];
  });
}
export function normalizeGdacs(xml: string): Hazard[] {
  if (!/<rss[\s>]/i.test(xml)) throw new Error("Invalid GDACS response");
  const decode = (s: string) =>
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  return [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].flatMap((m) => {
    const tag = (name: string) =>
      decode(m[1].match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`))?.[1] ?? "");
    const category = (
      { FL: "Flood", TC: "Tropical cyclone", DR: "Drought" } as Record<string, string>
    )[tag("gdacs:eventtype")];
    const lon = Number(tag("geo:long")),
      lat = Number(tag("geo:lat")),
      at = Date.parse(tag("pubDate"));
    if (
      !category ||
      !tag("geo:long") ||
      !tag("geo:lat") ||
      !validPoint(lon, lat) ||
      !Number.isFinite(at)
    )
      return [];
    return [
      {
        id: `gdacs-${tag("gdacs:eventtype")}-${tag("gdacs:eventid")}-${tag("gdacs:episodeid")}`,
        title: tag("title"),
        category,
        lon,
        lat,
        at: new Date(at).toISOString(),
        url: safeSource(tag("link"), "https://www.gdacs.org"),
        provider: "GDACS",
        severity: tag("gdacs:alertlevel") || "Not supplied",
      },
    ];
  });
}
export function mergeHazards(rows: Hazard[]): Hazard[] {
  return [...new Map(rows.map((r) => [r.id, r])).values()].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  );
}
