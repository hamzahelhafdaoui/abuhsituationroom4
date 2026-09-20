import { useState } from "react";
import { mapFit } from "@/lib/utils";
import { useAnalysisArea } from "@/lib/analysis-area";
import { useAppStore } from "@/lib/store";
import { runSatelliteAnalysis, type SatelliteScanResult } from "@/lib/satellite-service";
import { newImageryReview, type ImageryReview, type ReviewScene } from "@/lib/imagery-review";
function png(base64: string, width: number, height: number, channels = 3) {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d")!;
  const im = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    for (let j = 0; j < 3; j++) im.data[i * 4 + j] = raw[i * channels + j];
    im.data[i * 4 + 3] = channels === 4 ? raw[i * 4 + 3] : 255;
  }
  ctx.putImageData(im, 0, 0);
  return c.toDataURL();
}
export function SatelliteAutoScan({
  onComplete,
  onStatus,
  busy,
  setBusy,
  onShowMap,
}: {
  onShowMap: () => void;
  onComplete: (review: ImageryReview) => Promise<void>;
  onStatus: (status: string) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
}) {
  const center = useAnalysisArea((s) => s.center);
  const mapBefore = useAppStore((s) => s.compareDate),
    mapAfter = useAppStore((s) => s.date);
  const [before, setBefore] = useState(mapBefore),
    [after, setAfter] = useState(mapAfter),
    [size, setSize] = useState(5),
    [windowDays, setWindowDays] = useState(15),
    [maxCloud, setMaxCloud] = useState(20);
  const [result, setResult] = useState<SatelliteScanResult | null>(null);
  const run = async () => {
    setBusy(true);
    setResult(null);
    onStatus(
      "Searching actual Sentinel-2 acquisitions, selecting matching tiles, reading image crops and cloud masks… This can take 1–2 minutes.",
    );
    try {
      const r = await runSatelliteAnalysis({
        data: { lon: center[0], lat: center[1], sizeKm: size, before, after, windowDays, maxCloud },
      });
      const scene = (s: SatelliteScanResult["before"]): ReviewScene => ({
        id: s.id,
        name: s.id,
        source: `Copernicus Sentinel-2 L2A · ${s.tile} · scene cloud ${s.cloud.toFixed(1)}%`,
        sourceUrl: s.metadata,
        capturedAt: s.date.slice(0, 10),
        loadedAt: r.generatedAt,
        width: r.width,
        height: r.height,
        originalSha256: s.sha256,
        hashKind: "decoded-rgb",
        dataUrl: png(s.rgb, r.width, r.height),
        resolutionM: r.metersPerPixel,
        bbox: {
          west: Math.min(...r.corners.map((p) => p[0])),
          south: Math.min(...r.corners.map((p) => p[1])),
          east: Math.max(...r.corners.map((p) => p[0])),
          north: Math.max(...r.corners.map((p) => p[1])),
        },
      });
      const review: ImageryReview = {
        ...newImageryReview(),
        title: `Satellite change scan · ${center[1].toFixed(3)}, ${center[0].toFixed(3)}`,
        before: scene(r.before),
        after: scene(r.after),
        alignmentConfirmed: true,
        marks: r.candidates.map((c, i) => ({
          id: crypto.randomUUID(),
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
          label: `Change candidate ${i + 1}`,
          assessment: "unreviewed",
          confidence: "low",
          note: `Automatically grouped ${c.pixels} changed land pixels; mean adjusted RGB difference ${c.score}/255. This is a change candidate, not a building identification or damage determination. Check shadows, seasonal changes and registration.`,
          updatedAt: r.generatedAt,
        })),
        notes: `AUTOMATED ACQUISITION\nRequested dates: ${before} / ${after}, ±${windowDays} days.\nActual acquisitions: ${r.before.date} / ${r.after.date}.\nScenes found: ${r.searched.before} before / ${r.searched.after} after.\nShared projected grid EPSG:${r.epsg}; bounds ${r.projectedBounds.join(", ")}. Display spacing ${r.metersPerPixel.toFixed(1)} m; native RGB 10 m, SCL mask 20 m.\nComparable land ${(r.validFraction * 100).toFixed(1)}%; changed comparable land ${(r.changedFraction * 100).toFixed(1)}%.\nCloud/shadow/snow/no-data/water excluded using both SCL masks. Vegetation-to-vegetation changes excluded from candidates. Median exposure correction RGB: ${r.exposureBias.join(", ")}.\nCoordinates are aligned; residual sensor registration is not independently validated. Sentinel-2 cannot establish individual small-building damage.\n${r.attempts.length ? `Rejected pairs: ${r.attempts.join("; ")}` : ""}`,
      };
      await onComplete(review);
      useAnalysisArea.getState().setOverlay({
        image: review.after!.dataUrl,
        corners: r.corners as [number, number][],
        features: {
          ...r.candidateFeatures,
          features: r.candidateFeatures.features.map((f, i) => ({
            ...f,
            properties: { ...f.properties, reviewMarkId: review.marks[i].id },
          })),
        },
        date: r.after.date.slice(0, 10),
        label: review.title,
      });
      setResult(r);
      onStatus(
        `Scan complete: ${r.candidates.length} change candidates from real acquisitions on ${r.before.date.slice(0, 10)} and ${r.after.date.slice(0, 10)}. Select a candidate to inspect its image chips.`,
      );
    } catch (e) {
      onStatus(e instanceof Error ? e.message : "Satellite acquisition failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ir-auto">
      <div>
        <span className="ir-kicker">AUTOMATIC SATELLITE ACQUISITION + CHANGE SCREENING</span>
        <h3>Scan the area you’re looking at</h3>
        <p>
          Map center {center[1].toFixed(4)}°, {center[0].toFixed(4)}°. Close this panel and pan the
          map to change the area. No image upload needed.
        </p>
      </div>
      <div className="ir-auto-fields">
        <label>
          Before target
          <input
            aria-label="Scan before date"
            value={before}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            disabled={busy}
            onChange={(e) => setBefore(e.target.value)}
          />
        </label>
        <label>
          After target
          <input
            aria-label="Scan after date"
            value={after}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            disabled={busy}
            onChange={(e) => setAfter(e.target.value)}
          />
        </label>
        <label>
          Area width
          <select
            aria-label="Scan area width"
            value={size}
            disabled={busy}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            <option value={2}>2 km · local area</option>
            <option value={5}>5 km · neighborhood</option>
            <option value={10}>10 km · district</option>
          </select>
        </label>
        <label>
          Search around dates
          <select
            aria-label="Scene search window"
            value={windowDays}
            disabled={busy}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          >
            <option value={7}>±7 days</option>
            <option value={15}>±15 days</option>
            <option value={30}>±30 days</option>
          </select>
        </label>
        <label>
          Maximum scene cloud
          <select
            aria-label="Maximum scene cloud"
            value={maxCloud}
            disabled={busy}
            onChange={(e) => setMaxCloud(Number(e.target.value))}
          >
            <option value={10}>10%</option>
            <option value={20}>20%</option>
            <option value={40}>40%</option>
          </select>
        </label>
      </div>
      <button className="ir-run" disabled={busy} onClick={() => void run()}>
        {busy ? "Acquiring & analyzing…" : "Find imagery & scan changes"}
      </button>
      <p className="ir-hint">
        Automatically searches the scene catalogue, selects same-tile acquisitions, crops both dates
        to one grid, masks invalid/cloudy pixels, and groups changed areas. Public Sentinel-2 is 10
        m: candidates indicate visible land/infrastructure change, not verified building damage.
      </p>
      {result && (
        <div className="ir-auto-result">
          <button
            onClick={() => {
              const c = result.corners;
              mapFit(
                {
                  west: Math.min(...c.map((p) => p[0])),
                  south: Math.min(...c.map((p) => p[1])),
                  east: Math.max(...c.map((p) => p[0])),
                  north: Math.max(...c.map((p) => p[1])),
                },
                { maxZoom: 15, pitch: 0 },
              );
              onShowMap();
            }}
          >
            Show results on map
          </button>
          <b>
            {result.candidates.length} candidates · {(100 * result.validFraction).toFixed(0)}%
            comparable land
          </b>
          <p>
            {result.searched.before + result.searched.after} catalogue matches searched ·{" "}
            {(100 * result.changedFraction).toFixed(1)}% changed comparable land
          </p>
          <div>
            {[result.before, result.after].map((s, i) => (
              <a key={s.id} href={s.metadata} target="_blank" rel="noreferrer">
                {i ? "AFTER" : "BEFORE"} {s.date.slice(0, 10)} · {s.cloud.toFixed(1)}% scene cloud ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
export function CandidateChips({
  before,
  after,
  area,
}: {
  before: ReviewScene | null;
  after: ReviewScene | null;
  area: { x: number; y: number; width: number; height: number };
}) {
  const pad = 0.018,
    x = Math.max(0, area.x - pad),
    y = Math.max(0, area.y - pad),
    w = Math.min(1 - x, area.width + pad * 2),
    h = Math.min(1 - y, area.height + pad * 2);
  return (
    <div className="ir-chips">
      {[before, after].map(
        (scene, i) =>
          scene && (
            <figure key={scene.id}>
              <figcaption>
                {i ? "AFTER" : "BEFORE"} · {scene.capturedAt}
              </figcaption>
              <div
                style={{
                  aspectRatio: `${w * scene.width}/${h * scene.height}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  alt={`${i ? "After" : "Before"} candidate crop`}
                  src={scene.dataUrl}
                  style={{
                    position: "absolute",
                    maxWidth: "none",
                    width: `${100 / w}%`,
                    height: `${100 / h}%`,
                    left: `${(-x / w) * 100}%`,
                    top: `${(-y / h) * 100}%`,
                  }}
                />
              </div>
            </figure>
          ),
      )}
    </div>
  );
}
