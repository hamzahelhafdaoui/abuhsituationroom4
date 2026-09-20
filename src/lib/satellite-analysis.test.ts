import test from "node:test";
import assert from "node:assert/strict";
import {
  scanInput,
  rankScenePairs,
  detectLandChanges,
  type SatelliteScene,
} from "./satellite-analysis.ts";
const input = {
  lon: 32.5,
  lat: 15.6,
  sizeKm: 2,
  before: "2025-01-01",
  after: "2025-02-01",
  windowDays: 15,
  maxCloud: 20,
};
const scene = (id: string, date: string, tile = "36PVC", cloud = 0): SatelliteScene => ({
  id,
  date,
  tile,
  cloud,
  epsg: 32636,
  visual: "",
  scl: "",
  metadata: "",
});
test("request validation rejects invalid dates and unbounded scans", () => {
  assert.deepEqual(scanInput(input), input);
  for (const bad of [
    { sizeKm: 100 },
    { lat: 100 },
    { windowDays: 60 },
    { before: "2025-02-30" },
    { before: "2025-03-01" },
  ])
    assert.throws(() => scanInput({ ...input, ...bad }));
});
test("pair selection requires same tile and projection and distinct ordered dates", () => {
  const b = [scene("b", "2025-01-01T10:00:00Z")];
  const a = [
    scene("same", "2025-01-01T10:00:00Z"),
    scene("wrong", "2025-02-01T10:00:00Z", "36PVD"),
    scene("good", "2025-02-02T10:00:00Z"),
  ];
  assert.equal(rankScenePairs(b, a, input).length, 1);
  assert.equal(rankScenePairs(b, a, input)[0].after.id, "good");
});
test("cloud masks suppress changes and global exposure shifts are removed", () => {
  const n = 100,
    b = new Uint8Array(n * 3).fill(100),
    a = new Uint8Array(n * 3).fill(130),
    mask = new Uint8Array(n).fill(5);
  assert.equal(detectLandChanges(b, a, mask, mask, 10, 10).candidates.length, 0);
  const cloud = new Uint8Array(n).fill(9);
  assert.equal(detectLandChanges(b, a, cloud, mask, 10, 10).validFraction, 0);
});
test("localized land changes form a bounded candidate; vegetation-only changes do not", () => {
  const n = 100,
    b = new Uint8Array(n * 3).fill(100),
    a = b.slice(),
    mask = new Uint8Array(n).fill(5);
  for (let y = 3; y < 6; y++)
    for (let x = 3; x < 6; x++) for (let c = 0; c < 3; c++) a[(y * 10 + x) * 3 + c] = 200;
  const r = detectLandChanges(b, a, mask, mask, 10, 10);
  assert.equal(r.candidates.length, 1);
  assert.equal(r.candidates[0].pixels, 9);
  assert.equal(r.changedFraction, 0.09);
  mask.fill(4);
  assert.equal(detectLandChanges(b, a, mask, mask, 10, 10).candidates.length, 0);
});
