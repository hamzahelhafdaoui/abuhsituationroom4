/**
 * Technique stack adapted from
 * https://github.com/satellite-image-deep-learning/techniques
 * (satellite-image-deep-learning/techniques — curated DL methods for satellite
 * & aerial imagery). We do not ship YOLO / U-Net / Prithvi weights. Each entry
 * is the method we actually run in this workbench, mapped onto that playbook.
 */
export interface Technique {
  id: string;
  playbook: string;
  weRun: string;
  limit: string;
}

export const TECHNIQUES: Technique[] = [
  {
    id: "chip",
    playbook: "Tiling / chipping large scenes (SpaceNet, eolearn, SR_Utils)",
    weRun: "Watch-boxes and site buffers are cut into WMS chips (HLS 30 m, 768 px) so change is scored locally, not over the whole theater.",
    limit: "Chip size is a compromise. Objects smaller than ~2–3 pixels (vehicles at 30 m) are below Nyquist — we do not count them.",
  },
  {
    id: "qa",
    playbook: "Image quality / DOTA-C robustness, iquaflow",
    weRun: "Brightness, saturation, and alpha (no-data) gates. Degraded chips are marked, not promoted.",
    limit: "A quality gate is not a cloud mask product (s2cloudless / Fmask). Empty HLS granules look like cloud.",
  },
  {
    id: "cloud",
    playbook: "Cloud detection & removal (FCI, s2cloudless-class methods)",
    weRun: "High-luma / low-chroma pixel fraction plus transparent HLS as no-data. Cloudy chips skip change scoring.",
    limit: "Thin cirrus and dust are missed. We never inpaint. Absence of a chip is not absence of activity.",
  },
  {
    id: "coreg",
    playbook: "Image registration / co-registration before change detection",
    weRun: "Same bbox, same WMS CRS, two dates (scene vs compare). No rubber-sheeting.",
    limit: "Residual misregistration at chip edges can look like change. We require a margin above that noise.",
  },
  {
    id: "cd",
    playbook: "Bitemporal change detection (Siamese / UNet-diff / DS_UNet / ChaBuD)",
    weRun: "Mean absolute RGB difference on a 96 px downsample. High Δ + not-cloudy → possible_change.",
    limit: "Phenology, flood, harvest, and new metal roofs all light up. Change ≠ damage ≠ strike.",
  },
  {
    id: "spectral",
    playbook: "NDVI / NBR / NDWI and Remote-Sensing-Indices-Derivation-Tool",
    weRun: "RGB proxies only: Excess Green (2G−R−B) for vegetation scrape, luma for yards/roofs, redness for scorch. HLS WMS is 3-band true color, not MSI.",
    limit: "True NBR needs SWIR. FIRMS is the thermal stand-in, never a burn-severity map.",
  },
  {
    id: "obb",
    playbook: "Oriented object detection (DOTA, mmrotate, YOLOv5-OBB, SuperYOLO, DRBox)",
    weRun: "Resolution gate: at HLS 30 m we emit unresolved compact-object notes, not vehicle/aircraft boxes. High-res Esri is morphology only and not dated.",
    limit: "No OBB weights in this client. 30 m cannot separate technicals from 4x4s. Super-resolution is not applied.",
  },
  {
    id: "buildings",
    playbook: "Building extraction (SpaceNet, YOLT2, Microsoft building damage, xView2 / xBD)",
    weRun: "OSM / OurAirports as weak labels for aerodromes, compounds, yards, ports. Catalog sites as the human-curated layer.",
    limit: "OSM is volunteered. A `military` or `aerodrome` tag is not occupancy and not a new base until an analyst confirms morphology.",
  },
  {
    id: "damage",
    playbook: "xView2 / dual-HRNet / SKAI / Microsoft building-damage-assessment (no-damage → destroyed)",
    weRun: "Four observation bins: no_change, possible_change, thermal_cluster, possible_damage. Default confidence 1–2.",
    limit: "We never output destroyed / major-damage as a judgment. Optical darkening + FIRMS is still an observation.",
  },
  {
    id: "sar",
    playbook: "SAR change, SSDD / xView3 ships, SpaceNet SAR buildings",
    weRun: "Not wired. Optical + FIRMS only. Cloud-covered Darfur stays a coverage gap.",
    limit: "No Sentinel-1 GRD in this sweep. Do not treat optical silence as a negative.",
  },
  {
    id: "sits",
    playbook: "Satellite image time series / ConvLSTM / EarthPT",
    weRun: "Paired dates from the date strip (scene vs compare) plus 24 h FIRMS. Not a full SITS encoder.",
    limit: "Two dates are not a season. Agricultural fire windows are filed as negative evidence.",
  },
  {
    id: "weak",
    playbook: "Weak / semi-supervised labels (OSM buildings, active learning)",
    weRun: "OSM features >5 km from the archive are osm_gap candidates. Human review is the active-learning loop (confirm / reject / needs imagery).",
    limit: "Gaps are invitations to look, not discoveries of secret facilities.",
  },
  {
    id: "fusion",
    playbook: "Multimodal fusion (optical + SAR + ancillary)",
    weRun: "Optical change × FIRMS × ADS-B (airframe category typical, never cargo) × news centroids × OSM. Two families required to promote a card.",
    limit: "News pins are named-place centroids. ADS-B silence ≠ no flight. FIRMS ≠ strike.",
  },
  {
    id: "xai",
    playbook: "Explainable AI / UQ (XAI4EO, Lightning UQ Box)",
    weRun: "Every box carries the technique IDs that fired, a plain-language why, cloud class, and Δ score.",
    limit: "Explanation is the rule list, not a saliency map from a trained net.",
  },
  {
    id: "foundational",
    playbook: "Prithvi, Clay, SpectralGPT, TerraTorch, DOFA",
    weRun: "Not loaded. This workbench is classical proxies + public feeds so it runs without a GPU.",
    limit: "A foundation-model pass would still be a candidate list for the same human review.",
  },
];

export const TECHNIQUE_BY_ID = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t]));
