import { create } from "zustand";
import type { FeatureCollection, Polygon } from "geojson";
export interface AnalysisOverlay {
  image: string;
  corners: [number, number][];
  features: FeatureCollection<Polygon>;
  date: string;
  label: string;
}
export const useAnalysisArea = create<{
  center: [number, number];
  overlay: AnalysisOverlay | null;
  setOverlay: (overlay: AnalysisOverlay | null) => void;
  setCenter: (center: [number, number]) => void;
}>((set) => ({
  center: [32.5, 15.6],
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  setCenter: (center) => set({ center }),
}));
