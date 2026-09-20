import { y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as DocPage } from "./doc-page-CHcT7Jif.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ethics-J4ST5L-I.js
var import_jsx_runtime = require_jsx_runtime();
var MISSION = {
	name: "Abu Hureirah Situation Room: Sudan Wing",
	existsFor: [
		"Journalism and public-interest reporting",
		"Human-rights documentation and archival",
		"Academic research",
		"Humanitarian early warning and civilian-harm context",
		"Accountability and historical record"
	],
	doesNotExistFor: [
		"Targeting, fire control, or strike planning",
		"Real-time tactical advice to any armed actor",
		"Kill-chain or aim-point language",
		"Recommending attacks, interdiction, or military operations"
	]
};
var LANGUAGE_RULES = {
	allowed: [
		"newly compacted yard",
		"increase of approximately 20–40 large vehicles since 12 Aug",
		"thermal anomaly cluster within 150 m of warehouse roof",
		"Il-76-type airframe overflew X at 02:14 UTC; landing not confirmed in ADS-B",
		"damage consistent with explosive impact, origin undetermined"
	],
	disallowed: [
		"valid target",
		"high-value target",
		"recommended aimpoint",
		"destroy this depot",
		"this flight is smuggling weapons",
		"confirmed RSF drone base",
		"confirmed arms depot",
		"SAF airstrike confirmed from crater shape"
	]
};
var DOCTRINE = [
	"No single image, hotspot, container, aircraft, or vehicle proves ownership, intent, cargo contents, or combat use.",
	"Confidence may rise only when multiple independent signs line up over time.",
	"Treat all armed parties symmetrically: RSF, SAF, allied militias, other armed groups, and foreign-linked logistics.",
	"Always maintain a civilian baseline: trucking, markets, farms, humanitarian convoys, mining, oil-service traffic, passenger aviation.",
	"Use probabilistic labels: observed / possible / assessed / consistent with / unconfirmed.",
	"Distinguish detection from attribution. Imagery alone does not name a perpetrator.",
	"Record negative evidence: military-looking sites that resolve civilian; unusual flights that are scheduled cargo or humanitarian; agricultural burning, flares, brick kilns.",
	"Every finding must be reproducible: scene IDs, times, bbox, parameters, notes, confidence."
];
function Ethics() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocPage, {
		kicker: "Legal / ethics memo",
		title: "Public data, no targeting, multi-party, confidence",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This page is the one-page memo that ships with the product. It is binding on generated text, exports, and analyst workflow." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Purpose" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The platform exists for:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: MISSION.existsFor.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: x }, x)) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The platform does not exist for:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: MISSION.doesNotExistFor.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: x }, x)) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "If a later user asks for targeting, ranking of “best targets,” predicted strike effectiveness, or operational military advice, refuse and keep the tool in documentation mode." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Public data only" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Ingest is limited to public satellite browse (NASA GIBS / Sentinel-2 L2A via Copernicus when configured), NASA FIRMS, public ADS-B / OpenSky, and user-curated open reporting (UN, OHCHR, Yale HRL, Bellingcat, Reuters, ACLED, official statements, already-verified geolocated media). Paywalled commercial imagery is not scraped. User-uploaded commercial scenes are allowed only if the researcher lawfully obtained them." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Analytical doctrine" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: DOCTRINE.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: d }, d)) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Language" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Allowed examples:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: LANGUAGE_RULES.allowed.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				"“",
				x,
				"”"
			] }, x)) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Disallowed examples:" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: LANGUAGE_RULES.disallowed.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				"“",
				x,
				"”"
			] }, x)) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Symmetry" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Rapid Support Forces, Sudanese Armed Forces, allied militias, other armed groups, and foreign-linked logistics are treated as parties to be documented, not as a single hunter’s quarry. Cross-border compounds default to undetermined local actors (including ENDF, regional forces, militia, commercial, humanitarian) until a movement chain is shown." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Civilian objects" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Markets, hospitals, power, water, IDP camps, and residential fabric are first-class archive objects. Damage there is recorded as civilian-harm context. Protected status under international humanitarian law does not depend on nearby military activity." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Human review" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Automation may open an alert. A human must confirm, reject, or mark “needs imagery.” Party labels require a written reason and are audited. Confidence 5 is rare on purpose." })
		]
	});
}
//#endregion
export { Ethics as component };
