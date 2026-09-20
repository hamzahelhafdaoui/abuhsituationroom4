import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as DocPage } from "./doc-page-CHcT7Jif.mjs";
//#region D:/Codex-work/ahsr-20260920/node_modules/.nitro/vite/services/ssr/assets/sop-BB9U14Aq.js
var import_jsx_runtime = require_jsx_runtime();
function Sop() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocPage, {
		kicker: "Analyst SOP",
		title: "Review an alert in ten minutes",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This is the standard operating procedure for a human reviewing an auto-opened card. Stay observational. If you cannot answer a question from the evidence in hand, write “unknown.”" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "0:00–0:30 — Read the card cold" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Note type (change / thermal / flight / convoy / damage / multi-source), score, linked sites, and the confidence pip. Check that auto-text did not name a perpetrator or a cargo. If it did, reject and rewrite." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "0:30–1:00 — Drop the party filter" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Set Party to All before you look at the map. Confirm you are not reviewing an RSF-only or SAF-only slice. Look at the civilian baseline on the site card (market, farm, hospital, scheduled aviation, humanitarian convoy)." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "1:00–3:00 — Two clear optical frames" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Open the site. Use GIBS before/after or the two snapshots. If either date is cloudy, say so. Do not interpolate vehicles through cloud. At 10 m, log an estimate band, not a census. Ask: new berms, compacted yards, vegetation removal, burn scars, roof collapse, dispersal into tree cover?" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "3:00–4:00 — Thermal" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "FIRMS: day or night, FRP, satellite, confidence. Is this Gezira in the dry season (agricultural)? Heglig (flare)? Brick kilns? Urban night cluster near a hospital or camp (possible structure fire or explosive — still “possible”)? Snap radius is kilometres, not metres; 375 m pixels do not pinpoint a warehouse door." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "4:00–5:00 — Flights" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If a flight family is attached: airframe category, scheduled or not, nearest airfield, whether a landing is actually in ADS-B. Forced questions you must answer or explicitly decline:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Where did the aircraft arrive?" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "What ground vehicles met it?" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Where did those vehicles go in subsequent scenes?" })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If the next image is cloudy or 10 m cannot show the convoy, write that. Do not invent." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "5:00–7:00 — Corroboration" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Scan ReliefWeb, UN, OHCHR, Yale HRL, Reuters, or the analyst’s own verified citations. Reporting can raise confidence; it is not ground truth. Cross-border Ethiopian compounds stay undetermined until a movement chain into Sudan is shown." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "7:00–9:00 — Score" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Apply the rubric. Two families + multi-date = 3. Do not award 4 without consistent reporting. Do not award 5 without high-res or ground media plus a movement chain. Record negative evidence if the site resolves civilian." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "9:00–10:00 — Click" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Confirm, reject, or needs imagery. Write one observational sentence. If you change a party label, give a reason — the audit log stores who/when/why. Export only with the limitations footer still attached." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Stop conditions" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Anyone asks for an aimpoint, target rank, or strike advice — refuse, stay in documentation mode." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A single FIRMS point or a single overflight — do not promote to a confirmed military narrative." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You are guessing cargo, intent, or perpetrator from crater shape — stop." })
			] })
		]
	});
}
//#endregion
export { Sop as component };
