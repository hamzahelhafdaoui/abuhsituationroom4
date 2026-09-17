/**
 * Client-side loop adapted from hamzahelhafdaoui/osm-ai-helper
 * (Mozilla.ai OSM-AI-helper: OSM ground truth → tiles → existing / new / missed).
 * We do not load YOLO or SAM2. Morphology chips + OSM tags are the stand-in.
 * Human review (confirm / reject / needs-imagery) is the active-learning step.
 */
import { nearest } from "@/lib/geo";
import type { OsmSite, Site } from "@/lib/types";

export type OsmVerdict = "existing" | "new" | "missed";

export const OSM_VERDICT: Record<OsmVerdict, { label: string; color: string; note: string }> = {
  existing: {
    label: "OSM existing",
    color: "#6fbf8a",
    note: "OSM already has a matching feature. Chip is for change, not a new pad.",
  },
  new: {
    label: "OSM new",
    color: "#d4a017",
    note: "Morphology or volunteered OSM more than 5 km from the archive. Weak label — not a newly found base.",
  },
  missed: {
    label: "OSM missed",
    color: "#c4894a",
    note: "Catalog pin with no OSM aerodrome/military/warehouse nearby. Mapping gap, not occupancy.",
  },
};

const GT =
  /airfield|airstrip|aerodrome|strip|helipad|heliport|military|barrack|depot|yard|port|warehouse|fuel|tank|compound|base/i;

export function isOsmGroundTruth(o: OsmSite): boolean {
  return GT.test(`${o.kind} ${o.name}`);
}

export function osmVerdictFor(
  lat: number,
  lon: number,
  catalog: Pick<Site, "lat" | "lon">[],
  osm: OsmSite[],
  fromOsm: boolean,
): OsmVerdict {
  const nearCat = nearest(lat, lon, catalog, 5);
  const nearOsm = nearest(lat, lon, osm.filter(isOsmGroundTruth), 5);
  if (fromOsm && !nearCat) return "new";
  if (!fromOsm && !nearOsm) return "missed";
  return "existing";
}
