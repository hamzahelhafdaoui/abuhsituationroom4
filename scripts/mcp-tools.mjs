import * as geo from "@mapbox/mcp-server/tools";
import * as devkit from "@mapbox/mcp-devkit-server/tools";
import { getAllTools as documentationTools } from "@mapbox/mcp-docs-server/tools";

/** Explicit read-only selection. No account, token, upload, or style mutation tools. */
export function installWorkbenchTools(server) {
  const selected = [
    geo.buffer,
    geo.distance,
    geo.bearing,
    geo.area,
    geo.centroid,
    geo.midpoint,
    geo.simplify,
    devkit.boundingBox,
    devkit.countryBoundingBox,
    devkit.coordinateConversion,
    devkit.validateGeojson,
    devkit.validateExpression,
    devkit.checkColorContrast,
    ...documentationTools(),
  ];
  for (const tool of selected) tool.installTo(server);
  return selected.map((t) => ({ name: t.name, description: t.description }));
}
