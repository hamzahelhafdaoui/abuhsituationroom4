import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as DocPage } from "./doc-page-CHcT7Jif.mjs";
//#region D:/Codex-work/ahsr-20260920/node_modules/.nitro/vite/services/ssr/assets/methods-pjV9k8DG.js
var import_jsx_runtime = require_jsx_runtime();
function Methods() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocPage, {
		kicker: "Methods appendix",
		title: "How this archive sees, and what it cannot see",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Abu Hureirah Situation Room uses only publicly available satellite browse, thermal anomaly feeds, and unfiltered-or-public ADS-B aggregators. It is a documentation workbench for journalists, researchers, human-rights archivists, and humanitarian analysts. It is not a fire-control system." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Optical browse" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Four public stacks, switched in the workspace: ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sentinel-2 HLS" }),
				" (NASA GIBS ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "HLS_S30_Nadir_BRDF_Adjusted_Reflectance" }),
				", GoogleMapsCompatible Level 12, ~30 m, dated, latency typically 2–4 days), ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "VIIRS daily" }),
				" (NOAA-20 true color, ~250 m), ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sentinel-2 cloudless" }),
				" (EOX 2024 mosaic — morphology only, not a dated overpass), and ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "high-res" }),
				" (Esri World Imagery for yards and roofs). HLS granules are not global every day; empty or cloudy tiles stay empty. Higher-resolution change notes in the archive still assume Sentinel-2 L2A at 10 m when an analyst has a lawfully obtained scene. Commercial Maxar/Airbus/Planet is not scraped."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Object counting at 10 m is an estimate band, not a census. The interface stores ranges (for example 12–25 large vehicles) and states that pickups, technicals, and civilian 4x4s are not separable at this resolution." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Thermal / FIRMS" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "NASA FIRMS VIIRS 375 m (NOAA-20 and NOAA-21 24-hour public CSVs) is ingested server-side, clipped to the Sudan-plus-corridors AOI, and deduped. FIRMS is a thermal-anomaly feed, not a strike feed. Each point is classified agricultural, industrial, urban structure fire, possible explosive/combat-related, or unknown. Combat-related labels above “possible” require optical follow-up. Agricultural burning, oil flares, brick kilns, and gas flares are first-class negative evidence." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Flights" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Live positions are requested from public ADS-B aggregators (adsb.lol, then adsb.fi) with OpenSky Network as a last-resort anonymous bbox query — the same public-source cascade documented by open dashboards such as World Monitor, reimplemented here without copying their code. We log registration, ICAO hex, type, operator if known, time over the AOI, and nearest airfield. We never claim cargo. Category (pax / cargo / bizjet / tanker / unknown) is typical for the airframe." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "ADS-B coverage in Darfur, Kordofan, Blue Nile, and the Libya desert tracks is sparse. Absence of a track is not absence of a flight. Coverage gaps are marked on the health chips. Scheduled passenger services are low priority unless they divert to unusual fields." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: "colab",
				children: "Train a better chip model on Google Colab"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The sitroom’s auto-find is a weak-supervised linear classifier on seven chip stats (blobs, HV edges, edge density, excess-green, red, bitemporal delta, mean luminance). Confirm / Reject in the queue is the training step. That is not YOLO. To fit a stronger model on the same blueprint classes, use Colab:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"In the imagery sweep panel, press ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Export labels" }),
					" (your Confirm/Reject chips) and ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Export weights" }),
					" (current priors)."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Download ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/sudan-chip-train.ipynb",
						children: "sudan-chip-train.ipynb"
					}),
					" from this workbench."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Open ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "https://colab.research.google.com/",
						children: "Google Colab"
					}),
					" → File → Upload notebook → the ipynb."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Runtime → Change runtime type → GPU (T4 is enough)." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Upload ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "ahsr-chip-samples.json" }),
					" when the notebook asks. It trains a multinomial logistic model on the seven features (and optionally pulls Sentinel-2 HLS chips around each lat/lon if you enable Path B)."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"The last cell writes ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "ahsr-chip-weights.json" }),
					". Download it."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					"Back in the sitroom, ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Import Colab JSON" }),
					". The next sweep uses those weights. Confirm/Reject still updates them online."
				] })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Blueprint classes: ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "camp" }),
				", ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "veh" }),
				", ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "berm" }),
				", ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "burn" }),
				",",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "wreck_air" }),
				", ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "wreck_bldg" }),
				", ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "cargo" }),
				", ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "none" }),
				". Label morphology, not weapons. A burn scar is a scar. A pad is a pad. Occupancy and cargo remain human calls."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "What was borrowed from the other workbenches" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Public-code ideas only — not their brand, not their keys, not targeting:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "War-Probability-OSINT" }), " — multi-domain fusion of weak signals (airlift, tankers, thermal, GDELT, headlines, UAE→Africa tracks) as a coincidence meter, not a war forecast."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "IRONSIGHT" }), " — theater-scoped public RSS + ADS-B.lol + FIRMS, no keys. Already how this desk ingest works."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "OSINT-War-Room" }), " — GDELT pulse + OSM military as observation layers."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "aegis-osint-map / Shadowbroker / velocity" }), " — live flights/ships/bases on one dark map; inspect-to-yard zoom; human HITL before any claim."] })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Six-hour analytical engine" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Every sweep compiles a commander one-pager in the Brief tab from the live ingest and the change log. The engine is a civilian OSINT curriculum: observation is not identification, identification is not assessment, assessment is not judgment. Ten recrawls of one Telegram clip remain one origin. Official statements are evidence that an actor claimed X. Confidence (quality of the judgment) is not probability (how likely an event is)." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Academic vocabulary is drawn from public teaching texts — US joint levels of war (tactical / operational / strategic) as in Jordan et al., ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Understanding Modern Warfare" }),
				", and unclassified FM 3-90 (May 2023, unlimited distribution) labels for offensive types (movement to contact, attack, exploitation, pursuit) and the note that offense typically costs more sustainment than defense. Those words are descriptive labels for publicly reported activity. They are not employment guidance. Terrain discussion stays conceptual. The product still refuses targeting, fire-control, and kill-chain language."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Pressing ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "AI 48h" }),
				" is optional: a Grok pass over public reporting that may overlay the bottom line. The one-pager does not wait on that button. Actor profiles (SAF, RSF, neighbors) persist and update only when public evidence changes."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Open reporting & control" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Google News RSS (Sudan + RSF/SAF/Darfur/Kordofan query, last 4 days) is geocoded against a town gazetteer. Pins are named-place centroids — not incident coordinates. A Grok analyst brief runs only when you press the button; it is a lead list, not confirmation. Territorial control polygons are a coarse regional snapshot as of August 2026 aggregated from published assessments. They are not a live frontline." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Seeded OSINT reports (Asosa IL-76, ENDF compound change detection, Bahir Dar shelters, Wadi Sayyidna hangar damage, Kurmuk) are published posts by named accounts, ingested as documentation — not original assessments by this archive." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Alerts" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "An alert card opens only when two or more indicator families co-occur, or when change exceeds a threshold the analyst set. Auto-text stays observational. Nothing is labelled “confirmed” without a human click. Default new detections to confidence 1 or 2." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Confidence rubric" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "list-decimal space-y-1 pl-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Single weak indicator." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Repeated same indicator, no corroboration." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Two indicator families, same site, multi-date." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Three families plus consistent open-source reporting." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "High-res or ground media + multi-date satellite + reporting + movement chain." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Automated finding (DET)" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"The DET toggle runs a civilian chip pipeline adapted from the public playbook",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "https://github.com/satellite-image-deep-learning/techniques",
					target: "_blank",
					rel: "noopener noreferrer",
					children: "satellite-image-deep-learning/techniques"
				}),
				"— tiling, image-quality and cloud gates, co-registered bitemporal difference, RGB stand-ins for NDVI/NBR, OSM weak labels, xView2-style damage ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "bins" }),
				" (not classes), multimodal fusion with FIRMS, ADS-B, AIS-typical shipping, news/GDELT wire cues, and a plain-language explanation on every box. The hunt list is a GEOINT desk: BDA, cargo, air, sea, vehicle parks, compounds, non-army pads, earthworks, POL, camps, crossings, desert tracks, foreign-linked nodes, OSM gaps. We do not load YOLO, mmrotate, U-Net, Prithvi, or Clay weights; those need a GPU and still would only produce candidates. Default confidence is 1–2. A box is an observation, not an identification."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Resolution gate: HLS is ~30 m. Compact bright pixels are labelled unresolved objects, never a vehicle or aircraft census. High-res Esri is morphology only and is not a dated scene. Sentinel-1 SAR is not in this sweep — clouded Darfur is a coverage gap, not a negative. Agricultural FIRMS is negative evidence. Confirm / reject / needs-imagery is the active-learning loop." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Reproducibility" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Each observation stores sensor, scene ID, time, cloud percentage, notes, indicator families, and confidence. Exports (GeoJSON, CSV, briefing) print a limitations footer on every page. Party-label changes write an audit row with reason." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "What we pulled from open dashboards" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "World Monitor (koala73/worldmonitor, AGPL) is a useful map of public sources: NASA FIRMS, ADS-B aggregators, OpenSky, GIBS-class browse, ACLED/UCDP as corroboration. This archive reuses those public contracts — gold-standard server-side ingest, freshness metadata, coverage-gap warnings — and does not copy their application code or targeting-adjacent language. Their military-flight seeder is intentionally not reproduced; we classify airframes, we do not hunt a party." })
		]
	});
}
//#endregion
export { Methods as component };
