export interface ReviewScene {
  id: string;
  name: string;
  source: string;
  sourceUrl: string | null;
  capturedAt: string;
  loadedAt: string;
  width: number;
  height: number;
  originalSha256: string;
  hashKind?: "original-file" | "decoded-rgb";
  dataUrl: string;
  resolutionM: number | null;
  bbox: { west: number; south: number; east: number; north: number } | null;
}
export interface ReviewMark {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  assessment:
    "unreviewed" | "possible-damage" | "visible-change" | "no-visible-change" | "uncertain";
  confidence: "low" | "medium" | "high";
  disposition?: "pending" | "confirmed-change" | "rejected";
  note: string;
  updatedAt: string;
}
export interface ImageryReview {
  schema: "ahsr.imagery-review/v1";
  id: string;
  title: string;
  before: ReviewScene | null;
  after: ReviewScene | null;
  alignmentConfirmed: boolean;
  marks: ReviewMark[];
  notes: string;
  updatedAt: string;
}
export const REVIEW_ASSESSMENTS: Record<ReviewMark["assessment"], string> = {
  unreviewed: "Not assessed",
  "possible-damage": "Possible damage",
  "visible-change": "Visible change · cause unknown",
  "no-visible-change": "No visible change",
  uncertain: "Uncertain / obscured",
};
export const REVIEW_LIMITATIONS =
  "Analyst interpretation of imagery, not a verified damage inventory. Shadows, clouds, seasonal change, differing sensors, parallax, and image misalignment can create apparent change. A pixel-difference overlay cannot establish damage or its cause. No visible change does not establish safety or occupancy.";

export function newImageryReview(): ImageryReview {
  return {
    schema: "ahsr.imagery-review/v1",
    id: crypto.randomUUID(),
    title: "Building & infrastructure review",
    before: null,
    after: null,
    alignmentConfirmed: false,
    marks: [],
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}
export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Pick<ReviewMark, "x" | "y" | "width" | "height"> | null {
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const x = clamp(Math.min(x1, x2)),
    y = clamp(Math.min(y1, y2));
  const width = clamp(Math.max(x1, x2)) - x,
    height = clamp(Math.max(y1, y2)) - y;
  return width < 0.006 || height < 0.006 ? null : { x, y, width, height };
}
export function validCaptureDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validatePair(review: ImageryReview): string[] {
  const errors: string[] = [],
    { before, after } = review;
  if (!before || !after) return ["Load a before image and an after image."];
  if (!validCaptureDate(before.capturedAt) || !validCaptureDate(after.capturedAt))
    errors.push(
      "Enter valid capture dates as YYYY-MM-DD. File modification dates are not capture dates.",
    );
  if (before.capturedAt && after.capturedAt && before.capturedAt >= after.capturedAt)
    errors.push("The after date must be later than the before date.");
  if (Math.abs(before.width / before.height - after.width / after.height) > 0.01)
    errors.push("Image aspect ratios differ. Upload aligned crops of the same extent.");
  if (JSON.stringify(before.bbox) !== JSON.stringify(after.bbox))
    errors.push("Image extents differ. Load both dated scenes for the same area.");
  if (!review.alignmentConfirmed)
    errors.push("Check the images and confirm that they cover the same aligned area.");
  return errors;
}

/** RGB difference only. Never an object classifier or an estimate of damaged buildings. */
export function pixelDifference(
  before: Uint8ClampedArray,
  after: Uint8ClampedArray,
  threshold = 35,
): { overlay: Uint8ClampedArray; changed: number; valid: number; brightFraction: number } {
  if (before.length !== after.length || before.length % 4)
    throw new Error("Aligned image buffers must have identical dimensions.");
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 255)
    throw new Error("Invalid difference threshold.");
  const overlay = new Uint8ClampedArray(before.length);
  let changed = 0,
    valid = 0,
    bright = 0;
  for (let i = 0; i < before.length; i += 4) {
    if (before[i + 3] < 200 || after[i + 3] < 200) continue;
    valid++;
    const b = (before[i] + before[i + 1] + before[i + 2]) / 3;
    const a = (after[i] + after[i + 1] + after[i + 2]) / 3;
    if (a > 235 || b > 235) bright++;
    const d =
      (Math.abs(before[i] - after[i]) +
        Math.abs(before[i + 1] - after[i + 1]) +
        Math.abs(before[i + 2] - after[i + 2])) /
      3;
    if (d < threshold) continue;
    changed++;
    overlay[i] = 244;
    overlay[i + 1] = 169;
    overlay[i + 2] = 75;
    overlay[i + 3] = 175;
  }
  return { overlay, changed, valid, brightFraction: valid ? bright / valid : 0 };
}

function isScene(value: unknown): value is ReviewScene {
  if (!value || typeof value !== "object") return false;
  const s = value as ReviewScene;
  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.source === "string" &&
    typeof s.capturedAt === "string" &&
    s.capturedAt.length <= 10 &&
    Number.isFinite(s.width) &&
    Number.isFinite(s.height) &&
    s.width > 0 &&
    s.height > 0 &&
    s.width <= 4096 &&
    s.height <= 4096 &&
    typeof s.dataUrl === "string" &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.dataUrl) &&
    s.dataUrl.length < 24_000_000 &&
    typeof s.originalSha256 === "string" &&
    /^[a-f0-9]{64}$/.test(s.originalSha256)
  );
}
export function parseImageryReview(text: string): ImageryReview {
  if (text.length > 50_000_000) throw new Error("Review exceeds 50 MB.");
  const r = JSON.parse(text) as ImageryReview;
  if (
    r?.schema !== "ahsr.imagery-review/v1" ||
    typeof r.id !== "string" ||
    typeof r.title !== "string" ||
    r.title.length > 200 ||
    typeof r.notes !== "string" ||
    r.notes.length > 20000 ||
    typeof r.alignmentConfirmed !== "boolean" ||
    !Array.isArray(r.marks) ||
    r.marks.length > 100
  )
    throw new Error("Invalid imagery review file.");
  for (const s of [r.before, r.after])
    if (s !== null && !isScene(s)) throw new Error("Invalid or unsafe scene image.");
  const ids = new Set<string>();
  for (const m of r.marks) {
    if (
      !m ||
      typeof m.id !== "string" ||
      ids.has(m.id) ||
      ![m.x, m.y, m.width, m.height].every(Number.isFinite) ||
      m.x < 0 ||
      m.y < 0 ||
      m.width <= 0 ||
      m.height <= 0 ||
      m.x + m.width > 1.000001 ||
      m.y + m.height > 1.000001 ||
      !Object.hasOwn(REVIEW_ASSESSMENTS, m.assessment) ||
      !["low", "medium", "high"].includes(m.confidence) ||
      typeof m.label !== "string" ||
      m.label.length > 200 ||
      typeof m.note !== "string" ||
      m.note.length > 10000
    )
      throw new Error("Invalid review annotation.");
    ids.add(m.id);
  }
  // Reconstruct the schema so unknown imported fields never become executable UI.
  const cleanScene = (s: ReviewScene | null): ReviewScene | null =>
    s
      ? {
          id: s.id,
          name: s.name,
          source: s.source,
          sourceUrl: s.sourceUrl && /^https?:\/\//.test(s.sourceUrl) ? s.sourceUrl : null,
          capturedAt: s.capturedAt,
          loadedAt: typeof s.loadedAt === "string" ? s.loadedAt : "",
          width: s.width,
          height: s.height,
          originalSha256: s.originalSha256,
          ...(s.hashKind === "decoded-rgb" ? { hashKind: "decoded-rgb" as const } : {}),
          dataUrl: s.dataUrl,
          resolutionM: Number.isFinite(s.resolutionM) ? s.resolutionM : null,
          bbox:
            s.bbox && [s.bbox.west, s.bbox.south, s.bbox.east, s.bbox.north].every(Number.isFinite)
              ? s.bbox
              : null,
        }
      : null;
  return {
    schema: r.schema,
    id: r.id,
    title: r.title,
    before: cleanScene(r.before),
    after: cleanScene(r.after),
    alignmentConfirmed: r.alignmentConfirmed,
    marks: r.marks.map((m) => ({
      id: m.id,
      x: m.x,
      y: m.y,
      width: m.width,
      height: m.height,
      label: m.label,
      assessment: m.assessment,
      confidence: m.confidence,
      ...(m.disposition && ["pending", "confirmed-change", "rejected"].includes(m.disposition)
        ? { disposition: m.disposition }
        : {}),
      note: m.note,
      updatedAt: typeof m.updatedAt === "string" ? m.updatedAt : "",
    })),
    notes: r.notes,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
  };
}
export function reviewHtml(review: ImageryReview): string {
  const r = parseImageryReview(JSON.stringify(review));
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );
  const scene = (s: ReviewScene | null, label: string) =>
    s
      ? `<figure><figcaption><b>${label} · ${esc(s.capturedAt || "Capture date unknown")}</b><br>${esc(s.source)} · ${s.width} × ${s.height}</figcaption><div class="scene"><img src="${s.dataUrl}" alt="${label} scene"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${r.marks.map((m, i) => `<rect x="${m.x * 100}" y="${m.y * 100}" width="${m.width * 100}" height="${m.height * 100}"/><text x="${m.x * 100}" y="${Math.max(3, m.y * 100 - 1)}">${i + 1}</text>`).join("")}</svg></div><small>${s.hashKind === "decoded-rgb" ? "Decoded analysis RGB" : "Original file"} SHA-256: ${esc(s.originalSha256)}<br>Source: ${esc(s.sourceUrl ?? s.name)}</small></figure>`
      : "";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(r.title)}</title><style>body{font:15px/1.6 system-ui;color:#202b27;background:#f7f9f8;margin:32px auto;max-width:1200px;padding:24px}h1{font-size:32px}header p,small{color:#53635b}small{overflow-wrap:anywhere}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}figcaption{margin-bottom:8px}.scene{position:relative}.scene img{display:block;width:100%}.scene svg{position:absolute;inset:0;width:100%;height:100%}rect{fill:none;stroke:#edaa43;stroke-width:.35}text{fill:#edaa43;font:bold 3px system-ui}article{padding:16px 0;border-bottom:1px solid #cbd4cf}p{white-space:pre-wrap}.notice{padding:16px;border-left:3px solid #b9822c;background:#efeee6}@media(max-width:700px){.pair{grid-template-columns:1fr}}@media print{body{margin:0}article,figure{break-inside:avoid}}</style><header><p>ABU HUREIRAH · CIVILIAN IMAGERY REVIEW</p><h1>${esc(r.title)}</h1><p>Updated ${esc(r.updatedAt)} · ${r.marks.length} areas marked</p></header><p class="notice">${esc(REVIEW_LIMITATIONS)}${r.alignmentConfirmed ? "" : " Alignment was NOT confirmed."}</p><div class="pair">${scene(r.before, "BEFORE")}${scene(r.after, "AFTER")}</div><h2>Analyst observations</h2>${r.marks.map((m, i) => `<article><h3>${i + 1}. ${esc(m.label)}</h3><b>${esc(REVIEW_ASSESSMENTS[m.assessment])} · ${esc(m.confidence)} confidence · ${esc(m.disposition ?? "pending")}</b><p>${esc(m.note || "No rationale supplied.")}</p></article>`).join("")}<h2>Review notes</h2><p>${esc(r.notes || "No additional notes.")}</p></html>`;
}
