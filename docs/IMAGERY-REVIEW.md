# Civilian imagery review

Open **IMAGERY REVIEW** from the map. Load two aligned PNG/JPEG/WebP images, enter actual capture dates (YYYY-MM-DD), and identify their provider. Confirm matching landmarks and extent before comparing.

Use side-by-side or swipe, zoom, and draw an area on the after image. The same normalized outline appears on both scenes. Record the visible change, assessment, confidence and alternative explanations. Pixel differences are thresholded RGB changes, not a damage classifier, a count of damaged buildings, or evidence of cause.

Save reviews to IndexedDB in the current browser. Export a portable JSON backup or a standalone HTML evidence report containing both images, outlines, provenance and analyst notes. Import validates the schema and decodes images before changing the active review. Switching to a saved review or creating a new one first saves the current imagery.

## Limits

- This implementation accepts user-supplied imagery; it does not acquire licensed high-resolution historical scenes or automatically register images.
- Capture dates and alignment are analyst assertions. Equal dimensions alone do not establish alignment.
- Working images are capped at 2,048 pixels; original file SHA-256 hashes identify the inputs, but exports embed resized working copies. Retain original files separately.
- Cloud, shadows, seasonal changes, sensor differences and parallax require review. The overlay is calculated at up to 768 pixels wide and is not a model prediction.
- Browser data can be cleared. Save and export backups; there is no server sync or automatic saving of every edit.
- This change adds civilian damage documentation. It does not modify or validate the existing tactical detector or the supplied military training script.

## Validation

`npm run test:imagery`, `npm run typecheck`, `npm run build`.

Desktop browser checks use two explicitly labeled synthetic geometric fixtures, not satellite data: image loading, date validation, difference overlay, drawing, assessment editing, IndexedDB save/reopen, HTML/JSON export and JSON import. These checks validate software behavior, not damage-detection accuracy.

The existing platform suite has 10 baseline failures on this Windows checkout (8 branding expectations and 2 symlink permission checks), reproduced on unchanged HEAD. Existing application/auth tests passed.
