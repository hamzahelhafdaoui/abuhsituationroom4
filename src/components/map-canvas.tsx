import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, RasterTileSource, StyleSpecification } from "maplibre-gl";
import { SITES } from "@/data/catalog";
import { FACTION_META, type OsintReport } from "@/lib/osint";
import { controlZonesFor, isUsefulOsm, mergedControlCities } from "@/lib/control";
import { circlePoly, type BriefAnno } from "@/lib/briefing";
import { CORRIDORS, THEATER_BY_ID } from "@/lib/theaters";
import { SEA_LANES, allVessels, deadReckon } from "@/lib/traffic";
import {
  AOI,
  siteInKindGroup,
  type BriefItem,
  type FlightEvent,
  type GdeltEvent,
  type ImagerySource,
  type NewsPoint,
  type OsmSite,
  type ThermalEvent,
  type VesselEvent,
  type WatchBox,
} from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { cn, snapshotUrl } from "@/lib/utils";

const PARTY_COLOR: Record<string, string> = {
  saf: "#7b93a6",
  rsf: "#b38862",
  mixed: "#9aa08a",
  other_armed: "#8b7d9a",
  civilian: "#7d9a7a",
  unknown: "#8a857c",
};

const CLOSE_KINDS = new Set(["logistics", "airfield", "port", "compound", "hospital", "market"]);
/** Esri Dark Gray Canvas — public ArcGIS tiles, no API key. Not CARTO. */
const DARK_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const DARK_REF_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const S2_CLOUDLESS =
  "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg";

type FC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry:
      | { type: "Polygon"; coordinates: number[][][] }
      | { type: "Point"; coordinates: [number, number] }
      | { type: "LineString"; coordinates: number[][] };
  }>;
};

function gibsUrl(layer: string, date: string, level: number, ext = "jpg"): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${ext}`;
}
function hlsUrl(date: string): string {
  return gibsUrl("HLS_S30_Nadir_BRDF_Adjusted_Reflectance", date, 12, "png");
}
function viirsUrl(date: string): string {
  return gibsUrl("VIIRS_NOAA20_CorrectedReflectance_TrueColor", date, 9, "jpg");
}
function thermalUrl(date: string): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_Thermal_Anomalies_375m_All/default/${date}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`;
}

function vis(imagery: ImagerySource, id: "hls" | "viirs" | "s2cloudless" | "esri" | "dark"): "visible" | "none" {
  if (id === "dark") return imagery === "dark" ? "visible" : "none";
  if (id === "esri") return imagery === "hires" || imagery === "s2" || imagery === "viirs" ? "visible" : "none";
  if (id === "hls") return imagery === "s2" ? "visible" : "none";
  if (id === "viirs") return imagery === "viirs" ? "visible" : "none";
  return imagery === "s2cloudless" ? "visible" : "none";
}

function hudPad(panelOpen: boolean) {
  return { top: 220, right: panelOpen ? 420 : 72, bottom: 108, left: 16 };
}

function canvasIcon(draw: (ctx: CanvasRenderingContext2D, s: number) => void, size = 64): ImageData {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  return ctx.getImageData(0, 0, size, size);
}

function addContactIcons(map: MlMap) {
  const plane = (fill: string) =>
    canvasIcon((ctx, s) => {
      ctx.translate(s / 2, s / 2);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(12, 16);
      ctx.lineTo(0, 8);
      ctx.lineTo(-12, 16);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "#07090b";
      ctx.lineWidth = 2.4;
      ctx.stroke();
    });
  if (!map.hasImage("plane-icon")) {
    map.addImage("plane-icon", plane("#f4fff8"), { pixelRatio: 2 });
  }
  if (!map.hasImage("plane-cargo")) {
    map.addImage("plane-cargo", plane("#e2a15a"), { pixelRatio: 2 });
  }
  if (!map.hasImage("ship-icon")) {
    map.addImage(
      "ship-icon",
      canvasIcon((ctx, s) => {
        ctx.translate(s / 2, s / 2);
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(11, -5);
        ctx.lineTo(13, 12);
        ctx.lineTo(-13, 12);
        ctx.lineTo(-11, -5);
        ctx.closePath();
        ctx.fillStyle = "#9adbb8";
        ctx.fill();
        ctx.strokeStyle = "#07090b";
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }),
      { pixelRatio: 2 },
    );
  }
}

function baseStyle(date: string, imagery: ImagerySource): StyleSpecification {
  const phosphor = {
    "raster-saturation": 0.85,
    "raster-hue-rotate": 102,
    "raster-contrast": 0.28,
    "raster-brightness-min": 0.04,
  };
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      esri: {
        type: "raster",
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        attribution: "Esri World Imagery",
        maxzoom: 19,
      },
      dark: {
        type: "raster",
        tiles: [DARK_TILES],
        tileSize: 256,
        maxzoom: 16,
        attribution: "Esri Dark Gray Canvas",
      },
      "dark-ref": {
        type: "raster",
        tiles: [DARK_REF_TILES],
        tileSize: 256,
        maxzoom: 16,
        attribution: "Esri",
      },
      viirs: { type: "raster", tiles: [viirsUrl(date)], tileSize: 256, maxzoom: 9, attribution: "NASA GIBS / VIIRS NOAA-20" },
      hls: { type: "raster", tiles: [hlsUrl(date)], tileSize: 256, maxzoom: 12, attribution: "NASA HLS / Sentinel-2 MSI" },
      s2cloudless: {
        type: "raster",
        tiles: [S2_CLOUDLESS],
        tileSize: 256,
        maxzoom: 16,
        attribution: "Sentinel-2 cloudless 2024 © EOX / Copernicus",
      },
    },
    layers: [
      { id: "esri", type: "raster", source: "esri", layout: { visibility: vis(imagery, "esri") } },
      {
        id: "dark",
        type: "raster",
        source: "dark",
        layout: { visibility: vis(imagery, "dark") },
        paint: phosphor,
      },
      {
        id: "dark-ref",
        type: "raster",
        source: "dark-ref",
        layout: { visibility: vis(imagery, "dark") },
        paint: { "raster-saturation": 0.7, "raster-hue-rotate": 102, "raster-contrast": 0.2 },
      },
      {
        id: "viirs",
        type: "raster",
        source: "viirs",
        maxzoom: 9.4,
        layout: { visibility: vis(imagery, "viirs") },
        paint: {
          "raster-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.72, 6, 0.92, 9.4, 0],
          "raster-brightness-min": 0.18,
          "raster-contrast": 0.22,
          "raster-fade-duration": 0,
        },
      },
      {
        id: "hls",
        type: "raster",
        source: "hls",
        maxzoom: 12.8,
        layout: { visibility: vis(imagery, "hls") },
        paint: {
          "raster-opacity": ["interpolate", ["linear"], ["zoom"], 4, 1, 12, 1, 12.8, 0],
          "raster-brightness-min": 0.08,
          "raster-contrast": 0.12,
          "raster-fade-duration": 0,
        },
      },
      {
        id: "s2cloudless",
        type: "raster",
        source: "s2cloudless",
        layout: { visibility: vis(imagery, "s2cloudless") },
        paint: { "raster-opacity": 1, "raster-brightness-min": 0.06, "raster-contrast": 0.1, "raster-fade-duration": 0 },
      },
    ],
  };
}

function controlFc(theater = "sdn"): FC {
  const zones = controlZonesFor(theater as "sdn");
  return {
    type: "FeatureCollection",
    features: zones.map((z) => {
      const ring = z.polygon.map(([lat, lon]) => [lon, lat]);
      const first = ring[0];
      if (first) ring.push(first);
      return {
        type: "Feature" as const,
        properties: { id: z.id, faction: z.faction, label: z.label, note: z.note },
        geometry: { type: "Polygon" as const, coordinates: [ring] },
      };
    }),
  };
}

function controlLabelFc(theater = "sdn"): FC {
  const zones = controlZonesFor(theater as "sdn");
  return {
    type: "FeatureCollection",
    features: zones.map((z) => {
      let lat = 0;
      let lon = 0;
      for (const [la, lo] of z.polygon) {
        lat += la;
        lon += lo;
      }
      const n = Math.max(z.polygon.length, 1);
      return {
        type: "Feature" as const,
        properties: { label: z.label, faction: z.faction },
        geometry: { type: "Point" as const, coordinates: [lon / n, lat / n] },
      };
    }),
  };
}

function boxFc(boxes: WatchBox[]): FC {
  return {
    type: "FeatureCollection",
    features: boxes.map((b) => ({
      type: "Feature",
      properties: { id: b.id, name: b.name, priority: b.priority },
      geometry: {
        type: "Polygon",
        coordinates: [[[b.west, b.south], [b.east, b.south], [b.east, b.north], [b.west, b.north], [b.west, b.south]]],
      },
    })),
  };
}

function siteFc(partyOf: (id: string) => string, kindFilter = "all"): FC {
  return {
    type: "FeatureCollection",
    features: SITES.filter((s) => siteInKindGroup(s.kind, kindFilter)).map((s) => ({
      type: "Feature",
      properties: { id: s.id, name: s.name, kind: s.kind, party: partyOf(s.id), status: s.status },
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
    })),
  };
}

function pointFc<T extends { id: string; lat: number; lon: number }>(
  rows: T[],
  extra: (r: T) => Record<string, unknown>,
): FC {
  return {
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      properties: { id: r.id, ...extra(r) },
      geometry: { type: "Point", coordinates: [r.lon, r.lat] },
    })),
  };
}

function annoFc(rows: BriefAnno[]): FC {
  return {
    type: "FeatureCollection",
    features: rows.flatMap((a) => [
      {
        type: "Feature" as const,
        properties: { id: a.id, title: a.title, paragraph: a.paragraph, confidence: a.confidence, claim: a.claim, sources: a.sources, color: a.color },
        geometry: { type: "Polygon" as const, coordinates: [circlePoly(a.lat, a.lon, a.radiusKm)] },
      },
      {
        type: "Feature" as const,
        properties: { id: a.id, title: a.title, paragraph: a.paragraph, confidence: a.confidence, claim: a.claim, sources: a.sources, color: a.color },
        geometry: { type: "Point" as const, coordinates: [a.lon, a.lat] },
      },
    ]),
  };
}

function flightData(rows: FlightEvent[]): FC {
  return pointFc(rows, (r) => ({
    category: r.category,
    hex: r.hex,
    military: !!r.military,
    track: r.track ?? 0,
    label: `${r.typeCode} ${r.reg === "unknown" ? r.hex.slice(0, 6) : r.reg}`,
  }));
}

function vesselData(rows: VesselEvent[]): FC {
  return pointFc(rows, (r) => ({ name: r.name, kind: r.kind, live: r.live, cog: r.cog ?? 0 }));
}

function pct(lat: number, lon: number) {
  return {
    left: `${((lon - AOI.west) / (AOI.east - AOI.west)) * 100}%`,
    top: `${((AOI.north - lat) / (AOI.north - AOI.south)) * 100}%`,
  };
}

function StaticSatellite({
  date, boxes, firms, flights, onPick,
}: {
  date: string; boxes: WatchBox[]; firms: ThermalEvent[]; flights: FlightEvent[]; onPick: (id: string) => void;
}) {
  const [src, setSrc] = useState(snapshotUrl(date, AOI));
  useEffect(() => { setSrc(snapshotUrl(date, AOI)); }, [date]);
  const partyOf = useAppStore((s) => s.partyOverrides);
  return (
    <div className="absolute inset-0 overflow-hidden bg-bg">
      <img src={src} alt="NASA VIIRS mosaic" className="h-full w-full object-cover" onError={() => setSrc("/sudan-viirs.jpg")} />
      {firms.map((f) => (
        <span key={f.id} className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-thermal" style={pct(f.lat, f.lon)} />
      ))}
      {flights.map((f) => (
        <span key={f.id} className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-bg bg-fg" style={pct(f.lat, f.lon)} />
      ))}
      {SITES.map((s) => {
        const party = partyOf[s.id]?.party ?? s.party;
        return (
          <button key={s.id} type="button" title={s.name} onClick={() => onPick(s.id)} className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg" style={{ ...pct(s.lat, s.lon), background: PARTY_COLOR[party] ?? PARTY_COLOR.unknown }} />
        );
      })}
    </div>
  );
}

interface Props {
  boxes: WatchBox[];
  firms: ThermalEvent[];
  flights: FlightEvent[];
  panelOpen?: boolean;
  reports?: OsintReport[];
  newsPoints?: NewsPoint[];
  aiEvents?: BriefItem[];
  gdelt?: GdeltEvent[];
  osm?: OsmSite[];
  vessels?: VesselEvent[];
  briefingOn?: boolean;
  annotations?: BriefAnno[];
}

export function MapCanvas({
  boxes, firms, flights, panelOpen = false, reports = [], newsPoints = [], aiEvents = [], gdelt = [], osm = [], vessels = [], briefingOn = false, annotations = [],
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ready = useRef(false);
  const hoverPopup = useRef<{ remove: () => void } | null>(null);
  const flightSnap = useRef({ rows: flights, at: Date.now() });
  const [engine, setEngine] = useState<"static" | "gl">("static");
  const [cursor, setCursor] = useState("—");
  const layers = useAppStore((s) => s.layers);
  const imagery = useAppStore((s) => s.imagery);
  const date = useAppStore((s) => s.date);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const setSelectedSite = useAppStore((s) => s.setSelectedSite);
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const partyOverrides = useAppStore((s) => s.partyOverrides);
  const partyFilter = useAppStore((s) => s.partyFilter);
  const kindFilter = useAppStore((s) => s.kindFilter);
  const focusedBoxId = useAppStore((s) => s.focusedBoxId);
  const yardsZoom = useAppStore((s) => s.yardsZoom);
  const clearYardsZoom = useAppStore((s) => s.clearYardsZoom);
  const theaterId = useAppStore((s) => s.theaterId);
  const flyTarget = useAppStore((s) => s.flyTarget);
  const setFlyTarget = useAppStore((s) => s.setFlyTarget);
  const controlUpdates = useAppStore((s) => s.controlUpdates);

  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;
    let map: MlMap | null = null;
    let ro: ResizeObserver | null = null;
    let onCmd: ((ev: Event) => void) | null = null;
    let onFit: ((ev: Event) => void) | null = null;
    let onMeasure: (() => void) | null = null;

    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !host.current) return;
      const { Map, NavigationControl, ScaleControl, Popup } = maplibregl;
      try { maplibregl.setWorkerCount?.(1); } catch { /* optional */ }
      const state = useAppStore.getState();
      map = new Map({
        container: host.current,
        style: baseStyle(state.date, state.imagery),
        center: AOI.center,
        zoom: 5.05,
        minZoom: 2.6,
        maxZoom: 18.5,
        attributionControl: { compact: true },
        maxPitch: 0,
      });
      map.addControl(new NavigationControl({ showCompass: false }), "bottom-left");
      map.addControl(new ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
      map.setPadding(hudPad(false));
      mapRef.current = map;

      const boxesNow = boxes;
      const firmsNow = firms;
      const flightsNow = flightSnap.current.rows.length ? flightSnap.current.rows : flights;
      const overridesNow = state.partyOverrides;
      const kindNow = state.kindFilter;

      map.on("load", () => {
        if (!map || cancelled) return;
        map.resize();
        addContactIcons(map);

        map.addSource("thermal-raster", { type: "raster", tiles: [thermalUrl(state.date)], tileSize: 256, maxzoom: 8, attribution: "NASA GIBS thermal" });
        map.addLayer({ id: "thermal-raster", type: "raster", source: "thermal-raster", maxzoom: 8.5, layout: { visibility: state.layers.thermalRaster ? "visible" : "none" }, paint: { "raster-opacity": 0.85 } });

        map.addSource("boxes", { type: "geojson", data: boxFc(boxesNow) });
        map.addLayer({ id: "boxes-fill", type: "fill", source: "boxes", paint: { "fill-color": "#d8d2c6", "fill-opacity": ["match", ["get", "priority"], "border", 0.04, 0.07] } });
        map.addLayer({ id: "boxes-line", type: "line", source: "boxes", paint: { "line-color": "#d8d2c6", "line-opacity": 0.5, "line-width": 1.4, "line-dasharray": [2, 2] } });

        map.addSource("firms", { type: "geojson", data: pointFc(firmsNow, (r) => ({ klass: r.klass, frp: r.frp, live: !!r.live })) });
        map.addLayer({ id: "firms-glow", type: "circle", source: "firms", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "frp"], 0, 6, 40, 14], "circle-color": "#c4894a", "circle-opacity": 0.28, "circle-blur": 0.5 } });
        map.addLayer({ id: "firms-core", type: "circle", source: "firms", paint: { "circle-radius": 3.5, "circle-color": "#c4894a", "circle-stroke-width": 1, "circle-stroke-color": "#12110f" } });

        map.addSource("flights", { type: "geojson", data: flightData(flightsNow) });
        map.addLayer({
          id: "flights",
          type: "circle",
          source: "flights",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 8, 8],
            "circle-color": ["case", ["==", ["get", "military"], true], "#c4894a", "#d5e4dc"],
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.2,
            "circle-stroke-color": "#07090b",
          },
        });
        map.addLayer({
          id: "flights-icon",
          type: "symbol",
          source: "flights",
          layout: {
            "icon-image": ["case", ["==", ["get", "military"], true], "plane-cargo", "plane-icon"],
            "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.85, 6, 1.25, 10, 1.55],
            "icon-rotate": ["to-number", ["get", "track"]],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "text-field": ["step", ["zoom"], "", 6.2, ["get", "label"]],
            "text-size": 11,
            "text-offset": [0, 1.35],
          },
          paint: { "text-color": "#e8f6ee", "text-halo-color": "#07090b", "text-halo-width": 1.2 },
        });

        map.addSource("vessels", { type: "geojson", data: vesselData(allVessels()) });
        map.addLayer({ id: "vessels", type: "circle", source: "vessels", paint: { "circle-radius": 4, "circle-color": "#7ec8b3", "circle-opacity": 0.55 } });
        map.addLayer({
          id: "vessels-icon",
          type: "symbol",
          source: "vessels",
          layout: {
            "icon-image": "ship-icon",
            "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.7, 7, 1.15],
            "icon-rotate": ["to-number", ["get", "cog"]],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "text-field": ["step", ["zoom"], "", 5.6, ["get", "name"]],
            "text-size": 10,
            "text-offset": [0, 1.3],
          },
          paint: { "text-color": "#9adbb8", "text-halo-color": "#07090b", "text-halo-width": 1.1 },
        });

        map.addSource("sea-lanes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: SEA_LANES.map((l) => ({ type: "Feature" as const, properties: { name: l.name }, geometry: { type: "LineString" as const, coordinates: l.coords } })) },
        });
        map.addLayer({ id: "sea-lanes", type: "line", source: "sea-lanes", paint: { "line-color": "#7ec8b3", "line-width": 1.2, "line-opacity": 0.4, "line-dasharray": [4, 3] } });

        map.addSource("corridors", {
          type: "geojson",
          data: { type: "FeatureCollection", features: CORRIDORS.map((c) => ({ type: "Feature" as const, properties: { name: c.name }, geometry: { type: "LineString" as const, coordinates: c.coordinates } })) },
        });
        map.addLayer({ id: "corridors", type: "line", source: "corridors", paint: { "line-color": "#7ec8b3", "line-width": 1.4, "line-opacity": 0.45, "line-dasharray": [2, 2] } });

        const partyOf = (id: string) => overridesNow[id]?.party ?? SITES.find((s) => s.id === id)?.party ?? "unknown";
        map.addSource("sites", { type: "geojson", data: siteFc(partyOf, kindNow) });
        map.addLayer({
          id: "sites",
          type: "circle",
          source: "sites",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3.2, 8, 7.5, 16, 12],
            "circle-color": ["match", ["get", "party"], "saf", PARTY_COLOR.saf ?? "#8a857c", "rsf", PARTY_COLOR.rsf ?? "#8a857c", "mixed", PARTY_COLOR.mixed ?? "#8a857c", "other_armed", PARTY_COLOR.other_armed ?? "#8a857c", "civilian", PARTY_COLOR.civilian ?? "#8a857c", PARTY_COLOR.unknown ?? "#8a857c"],
            "circle-stroke-width": 1.8,
            "circle-stroke-color": "#12110f",
          },
        });

        map.addSource("control", { type: "geojson", data: controlFc(state.theaterId) });
        map.addLayer({
          id: "control-fill",
          type: "fill",
          source: "control",
          paint: {
            "fill-color": ["match", ["get", "faction"], "saf", FACTION_META.saf.color, "rsf", FACTION_META.rsf.color, "splm-n", FACTION_META["splm-n"].color, FACTION_META.contested.color],
            "fill-opacity": 0.48,
          },
        }, "sites");
        map.addLayer({
          id: "control-line",
          type: "line",
          source: "control",
          filter: ["!=", ["get", "faction"], "contested"],
          paint: { "line-color": ["match", ["get", "faction"], "saf", FACTION_META.saf.color, "rsf", FACTION_META.rsf.color, "splm-n", FACTION_META["splm-n"].color, FACTION_META.contested.color], "line-width": 2.8, "line-opacity": 0.95 },
        }, "sites");
        map.addLayer({
          id: "control-line-dash",
          type: "line",
          source: "control",
          filter: ["==", ["get", "faction"], "contested"],
          paint: { "line-color": FACTION_META.contested.color, "line-width": 2.8, "line-opacity": 0.95, "line-dasharray": [2.4, 1.6] },
        }, "sites");

        const cities = mergedControlCities(state.controlUpdates);
        map.addSource("control-cities", { type: "geojson", data: pointFc(cities, (c) => ({ name: c.name, faction: c.faction })) });
        map.addLayer({ id: "control-cities", type: "circle", source: "control-cities", paint: { "circle-radius": 4.5, "circle-color": ["match", ["get", "faction"], "saf", FACTION_META.saf.color, "rsf", FACTION_META.rsf.color, FACTION_META.contested.color], "circle-stroke-width": 1.5, "circle-stroke-color": "#07090b" } });

        map.addSource("control-labels", { type: "geojson", data: controlLabelFc(state.theaterId) });
        map.addLayer({
          id: "control-labels",
          type: "symbol",
          source: "control-labels",
          layout: {
            "text-field": ["get", "label"],
            "text-size": 11,
            "text-allow-overlap": false,
          },
          paint: { "text-color": "#e8f6ee", "text-halo-color": "#07090b", "text-halo-width": 1.4 },
        });

        map.addSource("osint-reports", { type: "geojson", data: pointFc(reports, (r) => ({ name: r.title, category: r.category })) });
        map.addLayer({ id: "osint-reports", type: "circle", source: "osint-reports", paint: { "circle-radius": 6, "circle-color": "#ece8e1", "circle-stroke-width": 2, "circle-stroke-color": "#b45a3c" } });

        map.addSource("news-pts", { type: "geojson", data: pointFc(newsPoints, (r) => ({ name: r.name, count: r.count })) });
        map.addLayer({ id: "news-pts", type: "circle", source: "news-pts", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 5, 8, 11], "circle-color": "#8ec8ff", "circle-opacity": 0.8, "circle-stroke-width": 1.2, "circle-stroke-color": "#07090b" } });

        map.addSource("ai-pts", { type: "geojson", data: pointFc(aiEvents.filter((e): e is BriefItem & { lat: number; lon: number } => e.lat != null && e.lon != null), (r) => ({ name: r.headline, confidence: r.confidence })) });
        map.addLayer({ id: "ai-pts", type: "circle", source: "ai-pts", paint: { "circle-radius": 6, "circle-color": ["match", ["get", "confidence"], "corroborated", "#7d9a7a", "reported", "#c4894a", "#b45a3c"], "circle-stroke-width": 1.5, "circle-stroke-color": "#12110f" } });

        map.addSource("gdelt", { type: "geojson", data: pointFc(gdelt, (r) => ({ name: r.name, subtype: r.subtype })) });
        map.addLayer({ id: "gdelt-glow", type: "circle", source: "gdelt", paint: { "circle-radius": 10, "circle-color": "#b45a3c", "circle-opacity": 0.2, "circle-blur": 0.6 } });
        map.addLayer({ id: "gdelt", type: "circle", source: "gdelt", paint: { "circle-radius": 4, "circle-color": "#b45a3c", "circle-stroke-width": 1.2, "circle-stroke-color": "#ece8e1" } });

        map.addSource("osm", { type: "geojson", data: pointFc(osm.filter(isUsefulOsm), (r) => ({ name: r.name, kind: r.kind })) });
        map.addLayer({ id: "osm", type: "circle", source: "osm", paint: { "circle-radius": 3.2, "circle-color": "#7b93a6", "circle-stroke-width": 1, "circle-stroke-color": "#12110f" } });

        map.addSource("brief-anno", { type: "geojson", data: annoFc([]) });
        map.addLayer({ id: "brief-fill", type: "fill", source: "brief-anno", filter: ["==", ["geometry-type"], "Polygon"], layout: { visibility: "none" }, paint: { "fill-color": ["coalesce", ["get", "color"], "#d4a017"], "fill-opacity": 0.18 } });
        map.addLayer({ id: "brief-line", type: "line", source: "brief-anno", filter: ["==", ["geometry-type"], "Polygon"], layout: { visibility: "none" }, paint: { "line-color": ["coalesce", ["get", "color"], "#d4a017"], "line-width": 1.6, "line-dasharray": [2, 1.4] } });
        map.addLayer({ id: "brief-pts", type: "circle", source: "brief-anno", filter: ["==", ["geometry-type"], "Point"], layout: { visibility: "none" }, paint: { "circle-radius": 5.5, "circle-color": ["coalesce", ["get", "color"], "#d4a017"], "circle-stroke-width": 1.5, "circle-stroke-color": "#07090b" } });

        map.addSource("measure", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "measure-line", type: "line", source: "measure", paint: { "line-color": "#d8d2c6", "line-width": 2, "line-dasharray": [2, 1] } });

        ready.current = true;
        setEngine("gl");
      });

      const bindPopup = (layer: string, html: (p: Record<string, unknown>) => string) => {
        map!.on("click", layer, (e) => {
          const feat = e.features?.[0];
          if (!feat || feat.geometry.type !== "Point") return;
          const [lon, lat] = feat.geometry.coordinates as [number, number];
          hoverPopup.current?.remove();
          hoverPopup.current = new Popup({ closeButton: true, offset: 14, className: "sr-popup" })
            .setLngLat([lon, lat])
            .setHTML(html(feat.properties as Record<string, unknown>))
            .addTo(map!);
        });
        map!.on("mouseenter", layer, () => { if (map) map.getCanvas().style.cursor = "pointer"; });
        map!.on("mouseleave", layer, () => { if (map) map.getCanvas().style.cursor = ""; });
      };

      map.on("click", "sites", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelectedSite(id);
      });
      bindPopup("sites", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name ?? ""}</div>`);
      bindPopup("flights-icon", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.label ?? p.hex}<div style="opacity:.7;font-size:11px">ADS-B · not a cargo claim</div></div>`);
      bindPopup("vessels-icon", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name}<div style="opacity:.7;font-size:11px">${p.kind === "lane" ? "Documented lane marker — not live AIS" : "Port node — not live AIS"}</div></div>`);
      bindPopup("news-pts", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name} · ${p.count} headlines<div style="opacity:.7;font-size:11px">Named-place centroid</div></div>`);
      bindPopup("brief-pts", (p) => `<div style="max-width:260px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.title}</div><div style="opacity:.75;font-size:11px;margin-top:4px">${p.claim} · ${p.confidence}</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.paragraph ?? ""}</div><div style="opacity:.65;font-size:10px;margin-top:6px">${p.sources ?? ""}</div></div>`);
      map.on("click", "osint-reports", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelectedReport(id);
      });
      map.on("click", "control-fill", (e) => {
        const p = e.features?.[0]?.properties as Record<string, unknown> | undefined;
        if (!p || !map) return;
        hoverPopup.current?.remove();
        hoverPopup.current = new Popup({ closeButton: true, offset: 10, className: "sr-popup" })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.label}<div style="opacity:.7;font-size:11px;font-weight:400">${p.note}<br/>Compiled control — not a live frontline.</div></div>`)
          .addTo(map);
      });

      map.on("mousemove", (e) => {
        const z = map?.getZoom() ?? 0;
        setCursor(`${e.lngLat.lat.toFixed(4)}°  ${e.lngLat.lng.toFixed(4)}°  z${z.toFixed(1)}`);
      });

      onCmd = (ev: Event) => {
        const cmd = (ev as CustomEvent<"in" | "out">).detail;
        if (!map) return;
        if (cmd === "in") map.zoomIn({ duration: 250 });
        if (cmd === "out") map.zoomOut({ duration: 250 });
      };
      onFit = (ev: Event) => {
        const b = (ev as CustomEvent<{ west: number; south: number; east: number; north: number }>).detail;
        map?.fitBounds([[b.west, b.south], [b.east, b.north]], { padding: 48, duration: 800, maxZoom: 11.5 });
      };
      const measurePts: [number, number][] = [];
      onMeasure = () => {
        measurePts.length = 0;
        const src = map?.getSource("measure") as { setData: (d: FC) => void } | undefined;
        src?.setData({ type: "FeatureCollection", features: [] });
        const click = (e: { lngLat: { lng: number; lat: number } }) => {
          measurePts.push([e.lngLat.lng, e.lngLat.lat]);
          if (measurePts.length >= 2) {
            src?.setData({
              type: "FeatureCollection",
              features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: measurePts } }],
            });
            map?.off("click", click);
          }
        };
        map?.on("click", click);
      };
      window.addEventListener("sahel-map", onCmd);
      window.addEventListener("sahel-map-fit", onFit);
      window.addEventListener("sahel-map-measure", onMeasure);

      if (wrap.current && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => map?.resize());
        ro.observe(wrap.current);
      }
      requestAnimationFrame(() => map?.resize());
    }).catch((err) => {
      console.warn("[map] MapLibre failed, keeping static satellite", err);
      setEngine("static");
    });

    const failSafe = window.setTimeout(() => { if (!ready.current) setEngine("static"); }, 12000);
    return () => {
      cancelled = true;
      ready.current = false;
      window.clearTimeout(failSafe);
      if (onCmd) window.removeEventListener("sahel-map", onCmd);
      if (onFit) window.removeEventListener("sahel-map-fit", onFit);
      if (onMeasure) window.removeEventListener("sahel-map-measure", onMeasure);
      hoverPopup.current?.remove();
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    map.setPadding(hudPad(panelOpen));
    map.resize();
  }, [panelOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const visOn = (on: boolean): "visible" | "none" => (on ? "visible" : "none");
    const setVis = (id: string, on: boolean) => { if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visOn(on)); };
    setVis("esri", imagery === "hires" || imagery === "s2" || imagery === "viirs");
    setVis("dark", imagery === "dark");
    setVis("dark-ref", imagery === "dark");
    setVis("viirs", imagery === "viirs");
    setVis("hls", imagery === "s2");
    setVis("s2cloudless", imagery === "s2cloudless");
    setVis("thermal-raster", layers.thermalRaster);
    setVis("boxes-fill", layers.boxes);
    setVis("boxes-line", layers.boxes);
    setVis("firms-glow", layers.firms);
    setVis("firms-core", layers.firms);
    setVis("flights", layers.flights);
    setVis("flights-icon", layers.flights);
    setVis("vessels", layers.vessels);
    setVis("vessels-icon", layers.vessels);
    setVis("sea-lanes", layers.vessels);
    setVis("corridors", layers.corridors);
    setVis("sites", layers.sites);
    setVis("control-fill", layers.control);
    setVis("control-line", layers.control);
    setVis("control-line-dash", layers.control);
    setVis("control-cities", layers.control);
    setVis("control-labels", layers.control);
    setVis("osint-reports", layers.reports);
    setVis("news-pts", layers.news);
    setVis("ai-pts", layers.ai);
    setVis("gdelt", layers.gdelt);
    setVis("gdelt-glow", layers.gdelt);
    setVis("osm", layers.osm);
    setVis("brief-fill", briefingOn);
    setVis("brief-line", briefingOn);
    setVis("brief-pts", briefingOn);
  }, [layers, imagery, briefingOn]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    (map.getSource("viirs") as RasterTileSource | undefined)?.setTiles?.([viirsUrl(date)]);
    (map.getSource("hls") as RasterTileSource | undefined)?.setTiles?.([hlsUrl(date)]);
    (map.getSource("thermal-raster") as RasterTileSource | undefined)?.setTiles?.([thermalUrl(date)]);
  }, [date]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("boxes");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(boxFc(boxes));
  }, [boxes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("firms");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(pointFc(firms, (r) => ({ klass: r.klass, frp: r.frp, live: !!r.live })));
  }, [firms]);

  useEffect(() => {
    flightSnap.current = { rows: flights, at: Date.now() };
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("flights");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(flightData(flights));
  }, [flights]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const map = mapRef.current;
      if (!map || !ready.current) return;
      const { rows, at } = flightSnap.current;
      const dt = (Date.now() - at) / 1000;
      const fs = map.getSource("flights");
      if (fs && "setData" in fs) (fs as { setData: (d: FC) => void }).setData(flightData(rows.map((f) => deadReckon(f, dt))));
      const vs = map.getSource("vessels");
      if (vs && "setData" in vs) (vs as { setData: (d: FC) => void }).setData(vesselData(allVessels(Date.now())));
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("control");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(controlFc(theaterId));
    const ls = map.getSource("control-labels");
    if (ls && "setData" in ls) (ls as { setData: (d: FC) => void }).setData(controlLabelFc(theaterId));
    const cities = mergedControlCities(controlUpdates);
    const cs = map.getSource("control-cities");
    if (cs && "setData" in cs) (cs as { setData: (d: FC) => void }).setData(pointFc(cities, (c) => ({ name: c.name, faction: c.faction })));
  }, [theaterId, controlUpdates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("brief-anno");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(annoFc(annotations));
  }, [annotations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const src = map.getSource("news-pts");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(pointFc(newsPoints, (r) => ({ name: r.name, count: r.count })));
  }, [newsPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const partyOf = (id: string) => partyOverrides[id]?.party ?? SITES.find((s) => s.id === id)?.party ?? "unknown";
    const data = siteFc(partyOf, kindFilter);
    if (partyFilter !== "all") data.features = data.features.filter((f) => f.properties.party === partyFilter);
    const src = map.getSource("sites");
    if (src && "setData" in src) (src as { setData: (d: FC) => void }).setData(data);
  }, [partyOverrides, partyFilter, kindFilter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSiteId) return;
    const site = SITES.find((s) => s.id === selectedSiteId);
    if (!site) return;
    const close = yardsZoom || CLOSE_KINDS.has(site.kind);
    map.flyTo({ center: [site.lon, site.lat], zoom: yardsZoom ? 17.2 : close ? 16.1 : 14.6, duration: 900, essential: true });
    if (yardsZoom) clearYardsZoom();
  }, [selectedSiteId, yardsZoom, clearYardsZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedBoxId) return;
    const box = boxes.find((b) => b.id === focusedBoxId);
    if (!box) return;
    map.fitBounds([[box.west, box.south], [box.east, box.north]], { padding: 48, duration: 800, maxZoom: 11.5 });
  }, [focusedBoxId, boxes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    map.flyTo({ center: [flyTarget.lon, flyTarget.lat], zoom: flyTarget.zoom, duration: 900, essential: true });
    setFlyTarget(null);
  }, [flyTarget, setFlyTarget]);

  useEffect(() => {
    const t = THEATER_BY_ID[theaterId];
    const map = mapRef.current;
    if (!map || !ready.current || !t) return;
    map.fitBounds([[t.west, t.south], [t.east, t.north]], { padding: 40, duration: 700, maxZoom: t.zoom });
  }, [theaterId]);

  const grain =
    imagery === "s2" ? `S2 HLS ${date}` :
    imagery === "viirs" ? `VIIRS ${date}` :
    imagery === "s2cloudless" ? "S2 mosaic 2024" :
    imagery === "dark" ? "Dark context" : "High-res Esri";

  return (
    <div ref={wrap} className="absolute inset-0 bg-bg">
      {engine !== "gl" ? (
        <StaticSatellite date={date} boxes={boxes} firms={firms} flights={flights} onPick={setSelectedSite} />
      ) : null}
      <div ref={host} className={cn("h-full w-full", engine !== "gl" && "pointer-events-none opacity-0")} />
      <div className="pointer-events-none absolute bottom-28 left-3 hidden rounded-full border border-border bg-bg/80 px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted md:block">
        {cursor}
        <span className="mx-1.5 text-subtle">·</span>
        {grain}
      </div>
    </div>
  );
}
