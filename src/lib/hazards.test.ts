import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEonet, normalizeEarthquakes, normalizeGdacs, mergeHazards } from "./hazards.ts";
test("EONET chooses newest geometry, rejects bad coordinates and unsafe links", () => {
  const rows = normalizeEonet({
    events: [
      {
        id: "one",
        title: "Flood",
        categories: [{ id: "floods", title: "Flood" }],
        sources: [{ url: "javascript:alert(1)" }],
        geometry: [
          { type: "Point", coordinates: [32, 15], date: "2025-02-01" },
          { type: "Point", coordinates: [31, 14], date: "2025-01-01" },
        ],
      },
      { id: "bad", geometry: [{ type: "Point", coordinates: [400, 14], date: "2025-01-01" }] },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].lon, 32);
  assert.ok(rows[0].url.startsWith("https:"));
});
test("USGS does not manufacture coordinates or accept missing magnitudes", () => {
  assert.deepEqual(
    normalizeEarthquakes({
      features: [
        { id: "missing", properties: { time: 1, mag: 3 } },
        { id: "bad", geometry: { coordinates: [32, 15] }, properties: { time: 1, mag: null } },
      ],
    }),
    [],
  );
});
test("GDACS preserves published severity and deduplicates stable episode identifiers", () => {
  const item =
    "<item><title>Flood &amp; rain</title><gdacs:eventtype>FL</gdacs:eventtype><gdacs:eventid>1</gdacs:eventid><gdacs:episodeid>2</gdacs:episodeid><geo:lat>15</geo:lat><geo:long>32</geo:long><pubDate>Tue, 01 Jul 2025 00:00:00 GMT</pubDate><gdacs:alertlevel>Orange</gdacs:alertlevel><link>https://www.gdacs.org/report</link></item>";
  const rows = normalizeGdacs(`<rss>${item}${item}</rss>`);
  assert.equal(mergeHazards(rows).length, 1);
  assert.equal(rows[0].severity, "Orange");
  assert.equal(rows[0].title, "Flood & rain");
  assert.throws(() => normalizeGdacs("<html>rate limited</html>"));
});
