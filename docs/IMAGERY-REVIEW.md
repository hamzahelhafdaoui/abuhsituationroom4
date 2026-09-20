# Automated civilian satellite change screening

The primary entry is **AUTO CHANGE SCAN** on the existing map. Pan to an area, choose before/after target dates, and run the scan. No image upload or API key is required for this pipeline.

## What runs automatically

1. Search Element 84 Earth Search for Sentinel-2 L2A acquisitions within the requested date windows and cloud threshold.
2. Rank compatible pairs by date distance and scene cloud cover; require the same MGRS tile and UTM projection, distinct chronological acquisitions, and publicly accessible RGB/SCL COG assets.
3. Read actual GeoTIFF windows using range requests, not a thumbnail or undated basemap. Both dates use the same projected extent snapped to a 20 m grid.
4. Read the 20 m scene-classification masks. Exclude cloud, shadow, snow, invalid pixels and water; preserve comparable vegetation/bare land, but suppress vegetation-to-vegetation candidates.
5. Estimate median RGB exposure offsets, threshold residual differences, group connected changes, discard isolated components, and surface at most 30 candidates for human review.
6. Automatically save both image crops, actual acquisition dates, scene catalogue links, decoded-RGB hashes and candidate outlines locally. Show candidate before/after chips, analyst confirm/reject controls, and a dated raster plus candidate outlines on the existing map.

## Accuracy and operational limits

This is automatic **change screening**, not a trained building-damage detector. Sentinel-2 RGB has 10 m native pixels; the SCL mask has 20 m pixels. Small buildings, residual registration, seasonal changes, shadows and broad exposure changes limit interpretation. Candidate counts are not damaged-building counts. Median normalization may suppress broad real change.

Areas are limited to 1–10 km wide, outputs to 512 pixels wide, date windows to ±30 days, compatible-pair attempts to four, and retrieval to 150 seconds. Fewer than 25% comparable land pixels rejects a pair. The provider is a best-effort public service; errors and missing scenes are shown explicitly. No substitution of VIIRS or undated mosaics occurs in this pipeline.

Saved reviews live in this browser's IndexedDB, not in a deployed database. Export portable JSON or standalone HTML evidence reports for backups. Optional image upload remains under a collapsed advanced section. Image hashes for acquired scenes refer to decoded analysis RGB; they are not whole-source-file hashes.

## Verified behavior

A real no-upload browser run around the initial map center found 13 catalogue matches, selected 2025-01-01 / 2025-01-31 acquisitions, and generated 11 change candidates with about 51% comparable land and 1.3% changed comparable land in a 2 km area. This verifies acquisition and processing, not the truth of any damage claim.

Tests cover request bounds and dates, compatible pair selection, cloud masking, exposure invariance, connected changes, vegetation suppression, review serialization, HTML escaping and request coalescing. Commands: `npm run test:imagery`, `npm run typecheck`, `npm run build`.

The platform suite has 10 pre-existing Windows failures (8 branding expectations and 2 symlink permission checks), reproduced on unchanged HEAD. Existing application/auth tests passed.

## Scope

Implemented: automatic civilian imagery acquisition/change screening, candidate evidence chips, human review, map overlays, local persistence/export, optical clarity fixes and source-request reliability.

Not implemented: trained ONNX inference, Astra/vector memory, MCP agents, a FastAPI model service, continuous background monitoring, or automatic high-resolution commercial imagery acquisition. The existing tactical detector and military-site training pipeline are not enhanced by this change.

Primary API references: [Earth Search](https://element84.com/earth-search/examples), [GeoTIFF.js](https://geotiffjs.github.io/geotiff.js/).
