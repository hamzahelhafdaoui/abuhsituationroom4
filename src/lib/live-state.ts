import type { LiveBundle, LiveMeta } from "./types";

export function emptyLiveBundle(): LiveBundle {
  const pending = (source: string): LiveMeta => ({
    source,
    fetchedAt: null,
    recordCount: 0,
    status: "gap",
    note: "This source has not returned a result yet.",
  });
  return {
    firms: [],
    firmsMeta: pending("NASA FIRMS"),
    flights: [],
    flightsMeta: pending("ADS-B"),
    reports: [],
    reportsMeta: pending("ReliefWeb"),
    news: [],
    newsPoints: [],
    newsMeta: pending("News"),
    gdelt: [],
    gdeltMeta: pending("GDELT"),
    osm: [],
    osmMeta: pending("OpenStreetMap"),
    feeds: [],
    feedsMeta: pending("Public channels"),
    ticker: [],
    vessels: [],
    vesselsMeta: pending("Maritime"),
  };
}
