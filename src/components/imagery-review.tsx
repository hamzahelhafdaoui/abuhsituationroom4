import { useAnalysisArea } from "@/lib/analysis-area";
import { useAppStore } from "@/lib/store";
import { SatelliteAutoScan, CandidateChips } from "./satellite-auto-scan";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  newImageryReview,
  normalizeRect,
  parseImageryReview,
  pixelDifference,
  REVIEW_ASSESSMENTS,
  REVIEW_LIMITATIONS,
  reviewHtml,
  validatePair,
  type ImageryReview,
  type ReviewMark,
  type ReviewScene,
} from "@/lib/imagery-review";
import { listImageryReviews, saveImageryReview } from "@/lib/imagery-review-storage";
import "./imagery-review.css";

async function decode(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}
async function loadScene(file: File): Promise<ReviewScene> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 20_000_000)
    throw new Error("Use a PNG, JPEG or WebP smaller than 20 MB.");
  const bytes = await file.arrayBuffer();
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const url = URL.createObjectURL(file);
  try {
    const image = await decode(url);
    const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      source: "User-supplied imagery",
      sourceUrl: null,
      capturedAt: "",
      loadedAt: new Date().toISOString(),
      width: canvas.width,
      height: canvas.height,
      originalSha256: digest,
      dataUrl: canvas.toDataURL("image/png"),
      resolutionM: null,
      bbox: null,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function ImageryReviewWorkbench() {
  const [open, setOpen] = useState(false);
  const mapOverlay = useAnalysisArea((s) => s.overlay);
  const [review, setReview] = useState<ImageryReview>(newImageryReview);
  const [saved, setSaved] = useState<ImageryReview[]>([]);
  const [status, setStatus] = useState(
    "Choose two dates and run a scan. The app finds and processes the imagery for you.",
  );
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"side" | "swipe">("side");
  const [swipe, setSwipe] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<ReturnType<typeof normalizeRect>>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [threshold, setThreshold] = useState(35);
  const [difference, setDifference] = useState<{ url: string; summary: string } | null>(null);
  useEffect(() => {
    const select = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (review.marks.some((m) => m.id === id)) {
        setSelected(id);
        setOpen(true);
      }
    };
    window.addEventListener("civilian-candidate-select", select);
    return () => window.removeEventListener("civilian-candidate-select", select);
  }, [review.marks]);
  const errors = validatePair(review);
  const active = review.marks.find((m) => m.id === selected);
  const patch = (changes: Partial<ImageryReview>) =>
    setReview((r) => ({ ...r, ...changes, updatedAt: new Date().toISOString() }));
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "The operation failed.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (open)
      void listImageryReviews()
        .then(setSaved)
        .catch((e) => setStatus(String(e)));
  }, [open]);
  useEffect(() => {
    setDifference(null);
  }, [review.before, review.after, review.alignmentConfirmed, threshold]);
  const save = async () => {
    await saveImageryReview(review);
    setSaved(await listImageryReviews());
    setStatus("Saved in this browser. Export JSON for a portable backup.");
  };
  const markPatch = (changes: Partial<ReviewMark>) =>
    patch({
      marks: review.marks.map((m) =>
        m.id === selected ? { ...m, ...changes, updatedAt: new Date().toISOString() } : m,
      ),
    });
  const decide = async (disposition: "confirmed-change" | "rejected") => {
    const next: ImageryReview = {
      ...review,
      updatedAt: new Date().toISOString(),
      marks: review.marks.map((m) =>
        m.id === selected
          ? {
              ...m,
              disposition,
              assessment:
                disposition === "confirmed-change" ? "visible-change" : "no-visible-change",
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    };
    await saveImageryReview(next);
    setReview(next);
    setSaved(await listImageryReviews());
    setStatus("Analyst decision saved. No model accuracy or damage claim is implied.");
  };
  const rectangles = (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="ir-annotations"
      aria-hidden="true"
    >
      {review.marks.map((m, i) => (
        <g key={m.id}>
          <rect
            x={m.x * 100}
            y={m.y * 100}
            width={m.width * 100}
            height={m.height * 100}
            className={m.id === selected ? "selected" : ""}
          />
          <text x={m.x * 100} y={Math.max(3, m.y * 100 - 1)}>
            {i + 1}
          </text>
        </g>
      ))}
      {draft && (
        <rect
          x={draft.x * 100}
          y={draft.y * 100}
          width={draft.width * 100}
          height={draft.height * 100}
        />
      )}
    </svg>
  );
  function stage(scene: ReviewScene, annotate: boolean) {
    return (
      <div
        className={`ir-stage ${drawing && annotate ? "ir-draw" : ""}`}
        style={{ aspectRatio: `${scene.width}/${scene.height}` }}
        onPointerDown={(e) => {
          if (!drawing || !annotate || errors.length || review.marks.length >= 100) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const b = e.currentTarget.getBoundingClientRect();
          start.current = { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height };
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const b = e.currentTarget.getBoundingClientRect();
          setDraft(
            normalizeRect(
              start.current.x,
              start.current.y,
              (e.clientX - b.left) / b.width,
              (e.clientY - b.top) / b.height,
            ),
          );
        }}
        onPointerCancel={() => {
          start.current = null;
          setDraft(null);
        }}
        onPointerUp={(e) => {
          if (!start.current) return;
          const b = e.currentTarget.getBoundingClientRect();
          const rect = normalizeRect(
            start.current.x,
            start.current.y,
            (e.clientX - b.left) / b.width,
            (e.clientY - b.top) / b.height,
          );
          start.current = null;
          setDraft(null);
          if (rect) {
            const id = crypto.randomUUID();
            patch({
              marks: [
                ...review.marks,
                {
                  ...rect,
                  id,
                  label: `Area ${review.marks.length + 1}`,
                  assessment: "unreviewed",
                  confidence: "low",
                  note: "",
                  updatedAt: new Date().toISOString(),
                },
              ],
            });
            setSelected(id);
            setDrawing(false);
          }
        }}
      >
        <img
          src={scene.dataUrl}
          alt={`${annotate ? "After" : "Before"} imagery`}
          draggable={false}
        />
        {mode === "swipe" && annotate && review.before && (
          <img
            src={review.before.dataUrl}
            alt="Before imagery swipe overlay"
            draggable={false}
            style={{ clipPath: `inset(0 ${100 - swipe}% 0 0)` }}
          />
        )}{" "}
        {annotate && difference && (
          <img src={difference.url} alt="Pixel change overlay" draggable={false} />
        )}{" "}
        {rectangles}
      </div>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {mapOverlay && !open && (
        <div className="ir-map-result">
          <b>DATED SCAN · {mapOverlay.date}</b>
          <span>{mapOverlay.features.features.length} change candidates · for review</span>
          <button onClick={() => useAnalysisArea.getState().setOverlay(null)}>
            Hide scan layer
          </button>
        </div>
      )}
      <Dialog.Trigger asChild>
        <button className="ir-launch">AUTO CHANGE SCAN</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="ir-backdrop" />
        <Dialog.Content className="ir-workbench">
          <header className="ir-header">
            <div>
              <span className="ir-kicker">ABU HUREIRAH / CIVILIAN ANALYSIS</span>
              <Dialog.Title>Automatic satellite change scan</Dialog.Title>
              <Dialog.Description>
                Find dated imagery, screen cloud cover, and surface civilian infrastructure change
                candidates.
              </Dialog.Description>
            </div>
            <Dialog.Close className="ir-button" aria-label="Close imagery review">
              Close
            </Dialog.Close>
          </header>
          <SatelliteAutoScan
            onShowMap={() => setOpen(false)}
            busy={busy}
            setBusy={setBusy}
            onStatus={setStatus}
            onComplete={async (next) => {
              if (review.before || review.after) await saveImageryReview(review);
              await saveImageryReview(next);
              setReview(next);
              setSaved(await listImageryReviews());
              setSelected(next.marks[0]?.id ?? null);
              setMode("side");
              setDifference(null);
            }}
          />
          <div className="ir-toolbar">
            <input
              aria-label="Review title"
              maxLength={200}
              value={review.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <button disabled={busy} onClick={() => void act(save)}>
              Save review
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  if (review.before || review.after) await save();
                  setReview(newImageryReview());
                  setSelected(null);
                  setDifference(null);
                  setStatus("New review. Previous images were saved in this browser.");
                })
              }
            >
              New review
            </button>
            <select
              aria-label="Open saved review"
              value=""
              disabled={busy}
              onChange={(e) => {
                const next = saved.find((r) => r.id === e.target.value);
                if (next)
                  void act(async () => {
                    if (review.before || review.after) await save();
                    setReview(next);
                    setSelected(null);
                    setStatus("Opened saved review.");
                  });
              }}
            >
              <option value="">Saved reviews ({saved.length})</option>
              {saved.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <label className="ir-button">
              Import JSON
              <input
                className="ir-file"
                type="file"
                accept="application/json,.json"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f)
                    void act(async () => {
                      if (f.size > 50_000_000) throw new Error("Review exceeds 50 MB.");
                      const next = parseImageryReview(await f.text());
                      for (const s of [next.before, next.after])
                        if (s) {
                          const image = await decode(s.dataUrl);
                          if (image.width !== s.width || image.height !== s.height)
                            throw new Error("Image dimensions do not match the review metadata.");
                        }
                      if (review.before || review.after) await save();
                      setReview(next);
                      setSelected(null);
                      setStatus("Imported review. Save to keep it in this browser.");
                    });
                }}
              />
            </label>
          </div>
          <p className="ir-status" role="status">
            {status}
          </p>
          <div className="ir-body">
            <main>
              <details className="ir-manual">
                <summary>Optional: use your own aligned imagery</summary>
                <div className="ir-loaders">
                  {(["before", "after"] as const).map((side) => (
                    <section key={side}>
                      <h3>{side === "before" ? "01 / BEFORE" : "02 / AFTER"}</h3>
                      <label className="ir-button">
                        {review[side] ? "Replace image" : "Load image"}
                        <input
                          className="ir-file"
                          aria-label={`Load ${side} image`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={busy || review.marks.length > 0}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f)
                              void act(async () => {
                                const scene = await loadScene(f);
                                patch({ [side]: scene, alignmentConfirmed: false });
                                setStatus(
                                  "Image loaded. Enter its actual capture date and source.",
                                );
                              });
                          }}
                        />
                      </label>
                      {review[side] && (
                        <>
                          <p>
                            {review[side].name} · {review[side].width} × {review[side].height}
                          </p>
                          <label>
                            Capture date
                            <input
                              type="text"
                              placeholder="YYYY-MM-DD"
                              maxLength={10}
                              inputMode="numeric"
                              aria-label={`${side} capture date`}
                              value={review[side].capturedAt}
                              onChange={(e) =>
                                patch({ [side]: { ...review[side], capturedAt: e.target.value } })
                              }
                            />
                          </label>
                          <label>
                            Source / provider
                            <input
                              aria-label={`${side} image source`}
                              maxLength={300}
                              value={review[side].source}
                              onChange={(e) =>
                                patch({ [side]: { ...review[side], source: e.target.value } })
                              }
                            />
                          </label>
                        </>
                      )}
                    </section>
                  ))}
                </div>
                <p className="ir-hint">
                  Use aligned crops of the same area. PNG, JPEG or WebP, up to 20 MB each. Working
                  copies are capped at 2,048 pixels; the original file hash is retained. Start a new
                  review to replace images after marking areas.
                </p>
              </details>
              <label className="ir-check">
                <input
                  type="checkbox"
                  checked={review.alignmentConfirmed}
                  onChange={(e) => patch({ alignmentConfirmed: e.target.checked })}
                />
                Use this aligned pair for comparison; inspect stable landmarks for residual
                misalignment.
              </label>
              {review.before && errors.length > 0 && (
                <p className="ir-notice">{errors.join(" ")}</p>
              )}
              <div className="ir-controls">
                <button aria-pressed={mode === "side"} onClick={() => setMode("side")}>
                  Side by side
                </button>
                <button
                  aria-pressed={mode === "swipe"}
                  disabled={!!errors.length}
                  onClick={() => setMode("swipe")}
                >
                  Swipe
                </button>
                <button
                  aria-pressed={drawing}
                  disabled={!!errors.length || review.marks.length >= 100}
                  onClick={() => setDrawing(!drawing)}
                >
                  {drawing ? "Drag on AFTER image" : "Mark an area"}
                </button>
                <button
                  disabled={!!errors.length || busy}
                  onClick={() =>
                    void act(async () => {
                      if (difference) {
                        setDifference(null);
                        return;
                      }
                      const b = await decode(review.before!.dataUrl),
                        a = await decode(review.after!.dataUrl);
                      const c = document.createElement("canvas");
                      c.width = Math.min(768, b.width);
                      c.height = Math.round((c.width * b.height) / b.width);
                      const ctx = c.getContext("2d", { willReadFrequently: true })!;
                      ctx.drawImage(b, 0, 0, c.width, c.height);
                      const pixels = ctx.getImageData(0, 0, c.width, c.height);
                      ctx.clearRect(0, 0, c.width, c.height);
                      ctx.drawImage(a, 0, 0, c.width, c.height);
                      const d = pixelDifference(
                        pixels.data,
                        ctx.getImageData(0, 0, c.width, c.height).data,
                        threshold,
                      );
                      const out = ctx.createImageData(c.width, c.height);
                      out.data.set(d.overlay);
                      ctx.putImageData(out, 0, 0);
                      setDifference({
                        url: c.toDataURL(),
                        summary: d.valid
                          ? `${((100 * d.changed) / d.valid).toFixed(1)}% of comparable pixels exceed the threshold. This is not a damage percentage.${d.brightFraction > 0.25 ? " Many bright pixels: check clouds, glare and exposure." : ""}`
                          : "No comparable opaque pixels. Review image coverage.",
                      });
                    })
                  }
                >
                  {difference ? "Hide raw pixel differences" : "Show raw pixel differences"}
                </button>
                <label>
                  Threshold{" "}
                  <input
                    aria-label="Pixel difference threshold"
                    type="range"
                    min="5"
                    max="120"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  />
                  {threshold}
                </label>
              </div>
              {difference && <p className="ir-notice">{difference.summary}</p>}
              {mode === "swipe" && (
                <label className="ir-swipe">
                  Before ←{" "}
                  <input
                    type="range"
                    aria-label="Before after swipe position"
                    min="0"
                    max="100"
                    value={swipe}
                    onChange={(e) => setSwipe(Number(e.target.value))}
                  />{" "}
                  → After
                </label>
              )}
              <label className="ir-swipe">
                Zoom{" "}
                <input
                  aria-label="Image zoom"
                  type="range"
                  min="1"
                  max="4"
                  step="0.25"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                {zoom}×
              </label>
              <div className="ir-image-scroll">
                <div
                  style={{ width: `${zoom * 100}%` }}
                  className={`ir-pair ${mode === "swipe" ? "single" : ""}`}
                >
                  {mode === "side" && (
                    <div>
                      <h3>BEFORE · {review.before?.capturedAt || "date unknown"}</h3>
                      {review.before ? (
                        stage(review.before, false)
                      ) : (
                        <div className="ir-empty">Run a scan to acquire the earlier scene</div>
                      )}
                    </div>
                  )}
                  <div>
                    <h3>AFTER · {review.after?.capturedAt || "date unknown"}</h3>
                    {review.after ? (
                      stage(review.after, true)
                    ) : (
                      <div className="ir-empty">The later scene appears here automatically</div>
                    )}
                  </div>
                </div>
              </div>
            </main>
            <aside>
              <h3>
                OBSERVATIONS <span>{review.marks.length}</span>
              </h3>
              {!review.marks.length && (
                <p className="ir-hint">
                  Mark a building, road, bridge or other infrastructure area on the after image. The
                  same outline appears on both scenes.
                </p>
              )}
              <div className="ir-mark-list">
                {review.marks.map((m, i) => (
                  <button
                    key={m.id}
                    aria-pressed={m.id === selected}
                    onClick={() => setSelected(m.id)}
                  >
                    {i + 1}. {m.label}
                    <small>
                      {m.disposition === "confirmed-change"
                        ? "Change confirmed by analyst"
                        : m.disposition === "rejected"
                          ? "Rejected"
                          : REVIEW_ASSESSMENTS[m.assessment]}
                    </small>
                  </button>
                ))}
              </div>
              {active && (
                <div className="ir-editor">
                  <CandidateChips before={review.before} after={review.after} area={active} />
                  {mapOverlay?.features.features.some(
                    (f) => f.properties?.reviewMarkId === active.id,
                  ) && (
                    <button
                      onClick={() => {
                        const f = mapOverlay.features.features.find(
                          (f) => f.properties?.reviewMarkId === active.id,
                        )!;
                        const ring = f.geometry.coordinates[0].slice(0, 4);
                        const lon = ring.reduce((v, p) => v + p[0], 0) / 4,
                          lat = ring.reduce((v, p) => v + p[1], 0) / 4;
                        useAppStore.getState().setImagery("hires");
                        useAppStore.getState().setFlyTarget({
                          lon,
                          lat,
                          zoom: 16.7,
                          label: active.label,
                          inspect: true,
                        });
                        setOpen(false);
                      }}
                    >
                      Inspect candidate on map
                    </button>
                  )}
                  <div className="ir-controls">
                    <button
                      disabled={busy}
                      onClick={() => void act(() => decide("confirmed-change"))}
                    >
                      Confirm visible change
                    </button>
                    <button disabled={busy} onClick={() => void act(() => decide("rejected"))}>
                      Reject candidate
                    </button>
                  </div>
                  <label>
                    Area name
                    <input
                      aria-label="Area name"
                      value={active.label}
                      maxLength={200}
                      onChange={(e) => markPatch({ label: e.target.value })}
                    />
                  </label>
                  <label>
                    Assessment
                    <select
                      aria-label="Area assessment"
                      value={active.assessment}
                      onChange={(e) =>
                        markPatch({ assessment: e.target.value as ReviewMark["assessment"] })
                      }
                    >
                      {Object.entries(REVIEW_ASSESSMENTS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Confidence
                    <select
                      aria-label="Assessment confidence"
                      value={active.confidence}
                      onChange={(e) =>
                        markPatch({ confidence: e.target.value as ReviewMark["confidence"] })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label>
                    Visible evidence & alternative explanations
                    <textarea
                      aria-label="Area evidence notes"
                      maxLength={10000}
                      value={active.note}
                      onChange={(e) => markPatch({ note: e.target.value })}
                    />
                  </label>
                  <button
                    onClick={() => {
                      patch({ marks: review.marks.filter((m) => m.id !== selected) });
                      setSelected(null);
                    }}
                  >
                    Remove area
                  </button>
                </div>
              )}
              <label>
                Review notes
                <textarea
                  aria-label="Review notes"
                  maxLength={20000}
                  value={review.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                />
              </label>
              <div className="ir-exports">
                <button
                  disabled={!review.before || !review.after}
                  onClick={() =>
                    download(`imagery-review-${review.id}.html`, reviewHtml(review), "text/html")
                  }
                >
                  Export evidence report
                </button>
                <button
                  onClick={() =>
                    download(
                      `imagery-review-${review.id}.json`,
                      JSON.stringify(review),
                      "application/json",
                    )
                  }
                >
                  Export JSON backup
                </button>
              </div>
              <p className="ir-hint">
                The report embeds both images, outlines, dates, image hashes and analyst notes. JSON
                can be imported into this workbench.
              </p>
            </aside>
          </div>
          <footer>{REVIEW_LIMITATIONS}</footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
