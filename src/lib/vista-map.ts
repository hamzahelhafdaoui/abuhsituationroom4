import vista from "@/data/vista-control.json";

export type VistaFaction = "saf" | "rsf" | "splm" | "slm" | "disputed" | "change";

export interface VistaProps {
  id: string;
  kind: "division" | "zone";
  layer: string;
  name: string;
  nameAr: string;
  place?: string;
  party?: "saf" | "rsf";
  faction?: VistaFaction;
  color?: string;
  note: string;
  source: string;
}

type FC = {
  type: "FeatureCollection";
  name: string;
  description: string;
  attribution: string;
  url: string;
  asOf: string;
  features: Array<{
    type: "Feature";
    properties: VistaProps;
    geometry:
      | { type: "Point"; coordinates: [number, number] }
      | { type: "Polygon"; coordinates: [number, number][][] };
  }>;
};

export const VISTA = vista as FC;

export const VISTA_DIVS = VISTA.features.filter((f) => f.properties.kind === "division") as Array<{
  type: "Feature";
  properties: VistaProps & { party: "saf" | "rsf"; place: string };
  geometry: { type: "Point"; coordinates: [number, number] };
}>;

export const VISTA_ZONES = VISTA.features.filter((f) => f.properties.kind === "zone");

export function vistaZonesFc() {
  return { type: "FeatureCollection" as const, features: VISTA_ZONES };
}

export function vistaDivFc() {
  return { type: "FeatureCollection" as const, features: VISTA_DIVS };
}

export const VISTA_LEGEND: Array<{ faction: VistaFaction; label: string; color: string }> = [
  { faction: "saf", label: "SAF (source polygon)", color: "#3d8b3d" },
  { faction: "rsf", label: "RSF (source polygon)", color: "#c9a227" },
  { faction: "splm", label: "SPLM-N — al-Hilu", color: "#007276" },
  { faction: "slm", label: "SLM — Abdel Wahid", color: "#7aa3d4" },
  { faction: "disputed", label: "Disputed (Halaib / Abyei)", color: "#9aa0a6" },
  { faction: "change", label: "Unlabeled control change", color: "#5a5a5a" },
];
