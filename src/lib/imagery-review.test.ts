import test from "node:test";
import assert from "node:assert/strict";
import {
  newImageryReview,
  normalizeRect,
  parseImageryReview,
  pixelDifference,
  reviewHtml,
  validatePair,
  type ReviewScene,
} from "./imagery-review.ts";
const scene = (date: string): ReviewScene => ({
  id: "scene",
  name: "test.png",
  source: "Test fixture",
  sourceUrl: null,
  capturedAt: date,
  loadedAt: "",
  width: 100,
  height: 100,
  originalSha256: "a".repeat(64),
  dataUrl: "data:image/png;base64,AAAA",
  resolutionM: null,
  bbox: null,
});
test("pair requires dates, later after image and verified alignment", () => {
  const r = newImageryReview();
  assert.equal(validatePair(r).length, 1);
  r.before = scene("");
  r.after = scene("");
  assert.equal(validatePair(r).length, 2);
  r.before.capturedAt = "2026-01-01";
  r.after.capturedAt = "2026-02-01";
  r.alignmentConfirmed = true;
  assert.deepEqual(validatePair(r), []);
  r.after.capturedAt = "2025-02-01";
  assert.match(validatePair(r)[0], /later/);
  r.after.capturedAt = "2026-02-01";
  r.after.width = 200;
  assert.match(validatePair(r)[0], /aspect ratios/);
});
test("rectangles normalize reverse drags, clamp edges and reject clicks", () => {
  assert.deepEqual(normalizeRect(0.8, 0.9, 0.2, 0.1), {
    x: 0.2,
    y: 0.1,
    width: 0.6000000000000001,
    height: 0.8,
  });
  assert.deepEqual(normalizeRect(-1, -1, 2, 2), { x: 0, y: 0, width: 1, height: 1 });
  assert.equal(normalizeRect(0, 0, 0, 0), null);
  assert.equal(normalizeRect(NaN, 0, 1, 1), null);
});
test("pixel differences exclude transparent coverage and count RGB changes only", () => {
  const b = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 0, 100, 100, 100, 255]);
  const a = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255, 105, 105, 105, 255]);
  const d = pixelDifference(b, a, 35);
  assert.equal(d.changed, 1);
  assert.equal(d.valid, 2);
  assert.equal(d.brightFraction, 0.5);
  assert.equal(d.overlay[7], 0);
  assert.equal(pixelDifference(b, b).changed, 0);
  assert.throws(() => pixelDifference(b, a, NaN));
  assert.throws(() => pixelDifference(b, new Uint8ClampedArray(4)));
});
test("portable review round trips while rejecting unsafe images and invalid annotations", () => {
  const r = newImageryReview();
  r.before = scene("2026-01-01");
  r.after = scene("2026-02-01");
  assert.deepEqual(parseImageryReview(JSON.stringify(r)), r);
  r.before.dataUrl = "https://tracking.invalid/pixel";
  assert.throws(() => parseImageryReview(JSON.stringify(r)), /unsafe/);
  r.before = scene("2026-01-01");
  r.marks = [
    {
      id: "a",
      x: 0.9,
      y: 0,
      width: 0.2,
      height: 0.2,
      label: "Area",
      assessment: "unreviewed",
      confidence: "low",
      note: "",
      updatedAt: "",
    },
  ];
  assert.throws(() => parseImageryReview(JSON.stringify(r)), /annotation/);
});
test("report escapes analyst text, embeds scenes and explicitly marks unconfirmed alignment", () => {
  const r = newImageryReview();
  r.before = scene("2026-01-01");
  r.after = scene("2026-02-01");
  r.title = "<script>alert(1)</script>";
  r.notes = "<img src=x onerror=alert(1)>";
  const html = reviewHtml(r);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Alignment was NOT confirmed"));
  assert.equal((html.match(/data:image\/png;base64,AAAA/g) || []).length, 2);
});
