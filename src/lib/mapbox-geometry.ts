/** Actual upstream Mapbox MCP tool execution, kept on the server. */
export async function analysisBounds(lon: number, lat: number, sizeKm: number): Promise<number[]> {
  if (
    !Number.isFinite(lon) ||
    !Number.isFinite(lat) ||
    Math.abs(lon) > 179 ||
    Math.abs(lat) > 80 ||
    !Number.isFinite(sizeKm) ||
    sizeKm <= 0 ||
    sizeKm > 10
  )
    throw new Error("Invalid analysis area");
  const [{ buffer }, { boundingBox, validateGeojson }] = await Promise.all([
    import("@mapbox/mcp-server/tools"),
    import("@mapbox/mcp-devkit-server/tools"),
  ]);
  // Circumscribe the square crop so catalogue search covers all four corners.
  const result = await buffer.run({
    geometry: [lon, lat],
    distance: sizeKm / Math.SQRT2,
    units: "kilometers",
  });
  if (result.isError || !result.structuredContent?.bufferedPolygon)
    throw new Error("Mapbox buffer calculation failed");
  const geojson = { type: "Polygon", coordinates: result.structuredContent.bufferedPolygon };
  const validation = await validateGeojson.run({ geojson });
  if (validation.isError || validation.structuredContent?.valid !== true)
    throw new Error("Analysis geometry did not pass Mapbox validation");
  const bounds = await boundingBox.run({ geojson });
  const bbox = bounds.structuredContent?.bbox;
  if (bounds.isError || !Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite))
    throw new Error("Mapbox bounding box calculation failed");
  return bbox as number[];
}
export async function validateAnalysisGeometry(geojson: Record<string, unknown>): Promise<void> {
  const { validateGeojson } = await import("@mapbox/mcp-devkit-server/tools");
  const result = await validateGeojson.run({ geojson });
  if (result.isError || result.structuredContent?.valid !== true)
    throw new Error("Change geometries failed GeoJSON validation");
}
