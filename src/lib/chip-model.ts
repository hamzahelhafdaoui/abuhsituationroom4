/**
 * Weak-supervised chip classifier.
 * Priors fitted to @AfriMEOSINT published stills (SE Libya camp, Kufra apron,
 * Wadi Sayyidna burn, Asosa IL-76). Human confirm/reject is the training step
 * (osm-ai-helper HITL). Not YOLO. Not a weapons ID.
 */
export type ModelKlass =
  | "none"
  | "camp"
  | "veh"
  | "berm"
  | "burn"
  | "wreck_air"
  | "wreck_bldg"
  | "cargo";

export interface ChipFeatures {
  blobs: number;
  hv: number;
  edge: number;
  exg: number;
  red: number;
  delta: number;
  meanL: number;
}

type Weights = Record<keyof ChipFeatures, number> & { bias: number };

export const MODEL_KLASS_LABEL: Record<ModelKlass, string> = {
  none: "no cue",
  camp: "camp / staging",
  veh: "vehicle park",
  berm: "earthwork",
  burn: "burn / scorch",
  wreck_air: "airframe / hangar damage",
  wreck_bldg: "building scrape",
  cargo: "yard / cargo",
};

/** Priors from published stills — compact objects on desert, scorch, apron. */
export const DEFAULT_WEIGHTS: Record<ModelKlass, Weights> = {
  none: { blobs: -0.15, hv: -0.2, edge: -0.4, exg: 1.2, red: -0.2, delta: -0.4, meanL: 0, bias: 0.4 },
  camp: { blobs: 0.22, hv: 0.5, edge: 0.8, exg: -1.4, red: 0.1, delta: 0.6, meanL: 0.2, bias: -0.9 },
  veh: { blobs: 0.28, hv: 0.3, edge: 0.5, exg: -1.2, red: 0, delta: 0.3, meanL: 0.15, bias: -0.8 },
  berm: { blobs: 0.04, hv: 1.6, edge: 1.2, exg: -0.8, red: 0, delta: 0.4, meanL: 0, bias: -0.7 },
  burn: { blobs: 0.02, hv: 0.1, edge: 0.3, exg: -1.0, red: 2.4, delta: 1.8, meanL: 0.1, bias: -0.85 },
  wreck_air: { blobs: 0.12, hv: 0.4, edge: 0.7, exg: -0.6, red: 1.1, delta: 1.4, meanL: 0.4, bias: -0.95 },
  wreck_bldg: { blobs: 0.05, hv: 0.6, edge: 0.9, exg: -0.4, red: 0.8, delta: 1.6, meanL: 0.2, bias: -0.9 },
  cargo: { blobs: 0.18, hv: 0.45, edge: 0.7, exg: -1.0, red: 0, delta: 0.7, meanL: 0.35, bias: -0.75 },
};

const LR = 0.04;

function dot(w: Weights, x: ChipFeatures) {
  return (
    w.bias +
    w.blobs * x.blobs +
    w.hv * x.hv +
    w.edge * x.edge +
    w.exg * x.exg +
    w.red * x.red +
    w.delta * x.delta +
    w.meanL * x.meanL
  );
}

export function predictChip(
  x: ChipFeatures,
  weights: Record<ModelKlass, Weights> = DEFAULT_WEIGHTS,
): { klass: ModelKlass; score: number; scores: Record<ModelKlass, number> } {
  const scores = {} as Record<ModelKlass, number>;
  let best: ModelKlass = "none";
  let bestV = -Infinity;
  (Object.keys(weights) as ModelKlass[]).forEach((k) => {
    const v = dot(weights[k], x);
    scores[k] = v;
    if (v > bestV) {
      bestV = v;
      best = k;
    }
  });
  return { klass: best, score: bestV, scores };
}

export function trainChip(
  weights: Record<ModelKlass, Weights>,
  x: ChipFeatures,
  klass: ModelKlass,
  confirmed: boolean,
): Record<ModelKlass, Weights> {
  const next = structuredClone(weights);
  const w = next[klass];
  const s = confirmed ? LR : -LR;
  w.blobs += s * x.blobs;
  w.hv += s * x.hv;
  w.edge += s * x.edge;
  w.exg += s * x.exg;
  w.red += s * x.red;
  w.delta += s * x.delta;
  w.meanL += s * x.meanL;
  w.bias += s;
  return next;
}

export function modelToKlass(k: ModelKlass): string {
  if (k === "camp") return "camp_buildup";
  if (k === "veh") return "vehicle_park";
  if (k === "berm") return "earthwork";
  if (k === "burn") return "burn_scar";
  if (k === "wreck_air") return "wreck_air";
  if (k === "wreck_bldg") return "wreck_bldg";
  if (k === "cargo") return "cargo_yard";
  return "unresolved_objects";
}

export function featuresFromShape(
  shape: { blobs: number; hv: number; edge: number },
  sm: { exg: number; red: number; meanL: number },
  delta: number,
): ChipFeatures {
  return {
    blobs: Math.min(shape.blobs, 24),
    hv: shape.hv,
    edge: shape.edge,
    exg: sm.exg,
    red: sm.red,
    delta,
    meanL: sm.meanL,
  };
}

export function serializeWeights(w: Record<ModelKlass, Weights>) {
  return JSON.stringify({ version: 1, kind: "ahsr-chip-weights", weights: w }, null, 2);
}

export function parseWeights(raw: string): Record<ModelKlass, Weights> | null {
  try {
    const j = JSON.parse(raw) as { kind?: string; weights?: Record<ModelKlass, Partial<Weights>> };
    if (!j.weights) return null;
    const next = structuredClone(DEFAULT_WEIGHTS);
    (Object.keys(DEFAULT_WEIGHTS) as ModelKlass[]).forEach((k) => {
      if (j.weights?.[k]) next[k] = { ...DEFAULT_WEIGHTS[k], ...j.weights[k] };
    });
    return next;
  } catch {
    return null;
  }
}
