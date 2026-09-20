import { test } from "node:test";
import assert from "node:assert/strict";
import { analysisBounds, validateAnalysisGeometry } from "./mapbox-geometry.ts";
test("real Mapbox buffer + Devkit validator cover all square-crop corners", async () => {
  const [w, s, e, n] = await analysisBounds(32.5, 15.6, 2);
  assert.ok(w < 32.49 && e > 32.51 && s < 15.59 && n > 15.61);
  await validateAnalysisGeometry({ type: "FeatureCollection", features: [] });
  await assert.rejects(() => analysisBounds(NaN, 15, 2));
  await assert.rejects(() =>
    validateAnalysisGeometry({
      type: "Polygon",
      coordinates: [
        [
          [1, 1],
          [2, 2],
        ],
      ],
    }),
  );
});
