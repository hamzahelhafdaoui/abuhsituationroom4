import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as DialogOverlay, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as CLAIM_CLASS, t as ACTORS } from "./doctrine-BoQ_KKoM.mjs";
import { a as FACTION_META, c as imageryLinks, i as CONTROL_ZONES, l as reportsToLog, n as CONTROL_AS_OF, o as SEED_REPORTS, r as CONTROL_SOURCE, s as geocodePlace, t as CATEGORY_META } from "./osint-wXO3XaAY.mjs";
import { C as ExternalLink, D as ChevronDown, E as CircleHelp, O as Check, S as Eye, T as Copy, _ as LoaderCircle, a as Ship, b as Flame, c as Ruler, f as Plus, g as Minus, h as Newspaper, i as Shield, l as RefreshCw, m as PanelRight, n as TriangleAlert, o as Search, p as Plane, r as Sparkles, t as X, u as Radio, v as Layers, w as Download, x as FileText, y as Focus } from "../_libs/lucide-react.mjs";
import { a as daysAgo, c as mapCommand, d as snapshotUrl, i as copyText, l as mapFit, n as PARTY_TONE, o as downloadBlob, r as cn, s as formatUtc, t as Button, u as mapMeasure } from "./button-DILtUjKf.mjs";
import { t as createRequestCache } from "./request-cache-DFna8z3y.mjs";
import { C as WATCH_BOXES, D as deadReckon, E as createSsrRpc, F as nearest, I as padBbox$1, L as partyToFaction, M as isUsefulOsm, N as mergeFlights, O as gdeltFamily, P as mergedControlCities, S as VESSEL_SEED, T as controlZonesFor, _ as PARTY_LABEL, a as CHANNEL_TONE, b as SITES, c as CONTROL_CITIES, d as FLIGHTS, f as GDELT_ARCHIVE, g as OSM_SEED, h as OBSERVATIONS, i as ARCHIVE_EVENTS, j as inBbox, k as getNewsFeed, l as FEED_CHANNELS, m as KIND_GROUP_LABEL, n as ALERTS, o as CITATIONS, p as IMAGERY, r as AOI, s as CONFIDENCE_RUBRIC, u as FEED_SEED, v as REGIONAL_EVENTS, w as allVessels, y as SEA_LANES, z as siteInKindGroup } from "./control-DOKcFDnK.mjs";
import { r as scanInput } from "./satellite-analysis-CBblDv6Y.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region D:/Codex-work/ahsr-20260920/node_modules/.nitro/vite/services/ssr/assets/routes-SFH9BBki.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function siteName(id) {
	if (!id) return void 0;
	return SITES.find((s) => s.id === id)?.name;
}
function seedChangeLog() {
	const rows = ALERTS.map((a) => ({
		id: `log-${a.id}`,
		firstSeen: a.datetime,
		lastSeen: a.datetime,
		title: a.title,
		body: a.negativeEvidence ? `${a.body} Negative evidence: ${a.negativeEvidence}` : a.body,
		siteId: a.siteIds[0],
		siteName: siteName(a.siteIds[0]),
		families: a.families,
		source: "archive",
		confidence: a.confidence,
		lat: a.lat,
		lon: a.lon,
		negative: Boolean(a.negativeEvidence)
	}));
	const covered = new Set(ALERTS.flatMap((a) => a.observationIds));
	for (const o of OBSERVATIONS) {
		if (covered.has(o.id)) continue;
		const site = SITES.find((s) => s.id === o.siteId);
		rows.push({
			id: `log-${o.id}`,
			firstSeen: o.datetime,
			lastSeen: o.datetime,
			title: `${site?.name ?? o.siteId} · ${o.sensor}`,
			body: o.notes,
			siteId: o.siteId,
			siteName: site?.name,
			families: o.indicators,
			source: "archive",
			confidence: o.confidence,
			lat: site?.lat ?? 0,
			lon: site?.lon ?? 0,
			negative: o.indicators.includes("thermal") && site?.kind === "farm"
		});
	}
	const have = new Set(rows.map((r) => r.id));
	for (const e of ARCHIVE_EVENTS) {
		if (have.has(e.id)) continue;
		const name = e.siteName || siteName(e.siteId);
		rows.push({
			...e,
			siteName: name
		});
		have.add(e.id);
	}
	for (const e of reportsToLog(SEED_REPORTS)) {
		if (have.has(e.id)) continue;
		rows.push(e);
		have.add(e.id);
	}
	for (const e of REGIONAL_EVENTS) {
		if (have.has(e.id)) continue;
		rows.push(e);
		have.add(e.id);
	}
	for (const g of GDELT_ARCHIVE) {
		const id = `log-${g.id}`;
		if (have.has(id)) continue;
		rows.push({
			id,
			firstSeen: `${g.date}T00:00:00Z`,
			lastSeen: `${g.date}T00:00:00Z`,
			title: `${g.subtype} · ${g.name}`,
			body: g.notes,
			families: gdeltFamily(g.subtype),
			source: "gdelt",
			confidence: g.source === "archive" ? 2 : 1,
			lat: g.lat,
			lon: g.lon
		});
		have.add(id);
	}
	return sortLog(rows);
}
function sortLog(rows) {
	return [...rows].sort((a, b) => {
		const c = b.firstSeen.localeCompare(a.firstSeen);
		if (c !== 0) return c;
		return b.id.localeCompare(a.id);
	});
}
function firmsIso(acqDate, acqTime) {
	return `${acqDate}T${(acqTime || "0000").padStart(4, "0").slice(0, 2)}:${(acqTime || "0000").padStart(4, "0").slice(2, 4)}:00Z`;
}
function ingestLive(bundle, existing) {
	const byId = new Map(existing.map((e) => [e.id, e]));
	let added = 0;
	const upsert = (entry) => {
		const prev = byId.get(entry.id);
		if (!prev) {
			byId.set(entry.id, entry);
			added += 1;
			return;
		}
		const firstSeen = entry.firstSeen < prev.firstSeen ? entry.firstSeen : prev.firstSeen;
		const lastSeen = entry.lastSeen > prev.lastSeen ? entry.lastSeen : prev.lastSeen;
		byId.set(entry.id, {
			...prev,
			firstSeen,
			lastSeen
		});
	};
	const agSeen = /* @__PURE__ */ new Set();
	for (const t of bundle.firms) {
		const when = firmsIso(t.acqDate, t.acqTime);
		const name = siteName(t.siteId) ?? "unanchored";
		if (t.klass === "agricultural") {
			const dayKey = `log-firms-ag-${t.siteId ?? "none"}-${t.acqDate}`;
			if (agSeen.has(dayKey)) continue;
			agSeen.add(dayKey);
			upsert({
				id: dayKey,
				firstSeen: when,
				lastSeen: when,
				title: `Seasonal / agricultural thermal · ${name}`,
				body: `FIRMS cluster classed agricultural (FRP ${t.frp.toFixed(1)}). Default is harvest or residue burning, not combat. Negative evidence unless a later optical scene shows otherwise.`,
				siteId: t.siteId,
				siteName: siteName(t.siteId),
				families: ["thermal"],
				source: "firms",
				confidence: 2,
				lat: t.lat,
				lon: t.lon,
				negative: true
			});
			continue;
		}
		if (!t.siteId && t.klass === "unknown") continue;
		upsert({
			id: `log-firms-${t.id}`,
			firstSeen: when,
			lastSeen: when,
			title: `Thermal anomaly · ${name}`,
			body: `VIIRS ${t.satellite} FRP ${t.frp.toFixed(1)} · class ${t.klass.replace("_", " ")} · ${t.daynight === "N" ? "night" : "day"}. Thermal anomaly is not a strike. Optical follow-up required.`,
			siteId: t.siteId,
			siteName: siteName(t.siteId),
			families: ["thermal"],
			source: "firms",
			confidence: t.klass === "possible_explosive" ? 2 : 1,
			lat: t.lat,
			lon: t.lon
		});
	}
	for (const v of bundle.vessels ?? []) {
		if (!v.live) continue;
		upsert({
			id: `log-ves-${v.id}`,
			firstSeen: (/* @__PURE__ */ new Date()).toISOString(),
			lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
			title: `Maritime contact · ${v.name}`,
			body: `${v.kind} · dest ${v.destination}. ${v.notes} AIS is a public broadcast, not a cargo claim.`,
			families: ["corridor"],
			source: "vessel",
			confidence: 1,
			lat: v.lat,
			lon: v.lon
		});
	}
	for (const f of bundle.flights) {
		if (!f.relevant) continue;
		upsert({
			id: `log-fl-${f.hex}-${f.firstSeen.slice(0, 13)}`,
			firstSeen: f.firstSeen,
			lastSeen: f.lastSeen,
			title: `${f.typeCode} ${f.hex} · ${f.category}`,
			body: `${f.notes} Nearest: ${f.nearestAirfield}. Category is airframe-typical, not a cargo claim.`,
			families: ["flight"],
			source: "flight",
			confidence: f.confidence,
			lat: f.lat,
			lon: f.lon
		});
	}
	for (const r of bundle.reports) {
		if (!r.date) continue;
		upsert({
			id: `log-${r.id}`,
			firstSeen: `${r.date}T00:00:00Z`,
			lastSeen: `${r.date}T00:00:00Z`,
			title: r.title,
			body: `${r.publisher}. Humanitarian corroboration, not ground truth. ${r.note}`,
			families: ["reporting"],
			source: "report",
			confidence: 2,
			lat: 15.6,
			lon: 32.5
		});
	}
	for (const n of bundle.news) {
		if (!n.date) continue;
		upsert({
			id: `log-${n.id}`,
			firstSeen: n.date,
			lastSeen: n.date,
			title: n.title,
			body: `${n.source}. Google News headline. Named-place geolocation is approximate — not an incident coordinate.`,
			families: ["reporting"],
			source: "report",
			confidence: 1,
			lat: 15.5,
			lon: 32.5
		});
	}
	for (const g of bundle.gdelt ?? []) {
		const when = `${g.date}T00:00:00Z`;
		upsert({
			id: `log-${g.id}`,
			firstSeen: when,
			lastSeen: when,
			title: `${g.subtype} · ${g.name}`,
			body: g.notes,
			families: gdeltFamily(g.subtype),
			source: "gdelt",
			confidence: g.live ? 1 : 2,
			lat: g.lat,
			lon: g.lon
		});
	}
	for (const f of bundle.feeds ?? []) upsert({
		id: `log-${f.id}`,
		firstSeen: f.timestamp,
		lastSeen: f.timestamp,
		title: `${f.channel} · ${f.text.slice(0, 88)}`,
		body: `${f.text.slice(0, 400)} Public Telegram preview. Single-source until corroborated.`,
		families: ["reporting"],
		source: "feed",
		confidence: 1,
		lat: f.lat ?? 15.5,
		lon: f.lon ?? 32.5
	});
	return {
		next: sortLog([...byId.values()]),
		added
	};
}
var getLiveBundle = createServerFn({ method: "GET" }).handler(createSsrRpc("01ac50a6b210d7c55e9b45dea72e796cba145e186591bdd88c0094df5a076b33"));
var getTraffic = createServerFn({ method: "GET" }).handler(createSsrRpc("534092db8484cb1d618e39dace1c97f0e51038567adcb1ce65879546b6fe22bd"));
var generateAiBrief = createServerFn({ method: "POST" }).handler(createSsrRpc("1f5d33602816122be63cf7759c11db5747202a5498921cc12b289e8c314b42dd"));
var H6 = 216e5;
var H72 = 2592e5;
function iso(d) {
	return d.toISOString();
}
function inWindow(isoStr, start, end) {
	const t = Date.parse(isoStr);
	return Number.isFinite(t) && t >= start && t <= end;
}
function topNews(news, n = 4) {
	return news.slice(0, n);
}
function compileSitrep(opts) {
	const now = opts.now ?? /* @__PURE__ */ new Date();
	const end = now.getTime();
	const start6 = end - H6;
	const start72 = end - H72;
	const log = opts.log;
	const live = opts.live;
	const news = live?.news ?? [];
	const firms = live?.firms ?? [];
	const flights = live?.flights ?? [];
	const gdelt = live?.gdelt ?? [];
	const log6 = log.filter((e) => inWindow(e.lastSeen || e.firstSeen, start6, end));
	const log72 = log.filter((e) => inWindow(e.lastSeen || e.firstSeen, start72, end));
	const cargo = flights.filter((f) => f.category === "cargo" || f.military);
	const hotFirms = firms.filter((f) => (f.frp ?? 0) >= 15).length;
	const cities = CONTROL_CITIES;
	const safN = cities.filter((c) => c.faction === "saf").length;
	const rsfN = cities.filter((c) => c.faction === "rsf").length;
	const mixedN = cities.filter((c) => c.faction === "contested").length;
	const developments = [];
	developments.push({
		title: "Compiled control picture unchanged this cycle",
		confidence: "MODERATE",
		claim: "assessed",
		observed: `${cities.length} named cities in the compiled open-source map: SAF ${safN}, RSF ${rsfN}, contested/mixed ${mixedN}. This is not a live frontline.`,
		assessment: "Territorial language in headlines should be checked against this coarse picture and the review queue. A single social-media capture claim does not move the map.",
		significance: "OPERATIONAL"
	});
	for (const n of topNews(news, 3)) developments.push({
		title: n.title.slice(0, 140),
		confidence: "LOW",
		claim: "reported",
		observed: `${n.source} headline in the public wire. Original reporting not independently verified by this archive.`,
		assessment: "Treat as a lead. Ten recrawls of the same headline remain one origin. Open the article before raising confidence.",
		significance: "TACTICAL",
		location: void 0
	});
	if (hotFirms > 0) developments.push({
		title: `FIRMS: ${hotFirms} higher-FRP thermal points in the AOI this cycle`,
		confidence: "MODERATE",
		claim: "observed",
		observed: `NASA FIRMS VIIRS returned ${firms.length} points; ${hotFirms} at FRP ≥ 15. Agricultural and industrial burning remain the baseline.`,
		assessment: "Thermal is an indicator, not a battle-damage assessment. Pair with dated optical and open reporting before calling explosive damage.",
		significance: "TACTICAL"
	});
	if (cargo.length > 0) developments.push({
		title: `Public ADS-B: ${cargo.length} cargo-typical or military-flagged airframes in coverage`,
		confidence: "LOW",
		claim: "observed",
		observed: cargo.slice(0, 4).map((f) => `${f.typeCode || "type?"} ${f.reg || f.hex} near ${f.nearestAirfield}`).join("; "),
		assessment: "Public tracking is incomplete. A cargo-typical airframe is not proof of cargo contents, operator intent, or a military flight. Absence of a track is not absence of a flight.",
		significance: "OPERATIONAL"
	});
	const recentLog = [...log72].filter((e) => e.source !== "flight" && e.source !== "firms" && e.source !== "vessel").filter((e) => e.families.some((f) => f === "vehicles" || f === "morphology" || f === "damage" || f === "corridor" || f === "reporting")).sort((a, b) => b.firstSeen.localeCompare(a.firstSeen)).slice(0, 2);
	for (const e of recentLog) developments.push({
		title: e.title,
		confidence: e.confidence >= 3 ? "MODERATE" : "LOW",
		claim: e.confidence >= 3 ? "assessed" : "observed",
		observed: e.body.slice(0, 280),
		assessment: e.negative ? "Negative-evidence row: civilian or alternative explanation recorded. Do not recycle as a military finding." : "Archive row. Confidence stays with the original indicator families until a human reviews it.",
		significance: e.families.includes("corridor") ? "OPERATIONAL" : "TACTICAL",
		location: e.siteName
	});
	const clipped = developments.slice(0, 7);
	const newsN = news.length;
	const overall = newsN >= 4 && log72.length >= 3 ? "MODERATE" : "LOW";
	const bottomLine = newsN === 0 && log6.length === 0 ? `No new corroborated military change in the last six hours. The campaign picture is the compiled control map (SAF ${safN} / RSF ${rsfN} named cities) plus the four-year archive — not this cycle's headlines. Overall confidence ${overall}.` : `This six-hour window added ${log6.length} log rows and ${newsN} public-wire headlines. ${hotFirms} higher-FRP thermal points and ${cargo.length} cargo-typical tracks are observations, not attributions. Who benefited: undetermined this cycle. Significance is whether independent sources corroborate the same places over the next 24–72 hours.`;
	const saf = ACTORS.find((a) => a.id === "saf");
	const rsf = ACTORS.find((a) => a.id === "rsf");
	return {
		windowStart: iso(new Date(start6)),
		windowEnd: iso(now),
		generatedAt: iso(now),
		theater: "Sudan Wing · adjacent theaters",
		overallConfidence: overall,
		bottomLine,
		developments: clipped,
		picture: {
			initiative: "Unclear this cycle — initiative is not inferred from headline volume.",
			ground: `Compiled city markers: SAF ${safN}, RSF ${rsfN}, contested/mixed ${mixedN}. Queue confirmations can nudge shading; they do not draw a FLOT.`,
			air: `${flights.length} public tracks (${cargo.length} cargo-typical/military-flagged). Coverage gaps in Darfur, Kordofan, and desert corridors remain.`,
			fires: hotFirms ? `${hotFirms} higher-FRP FIRMS points. Effect on capability: unknown without optical change detection.` : "No higher-FRP cluster highlighted this cycle.",
			logistics: `${rsf.short}: desert corridors alleged. ${saf.short}: Port Sudan / remaining airfields. Throughput not measured.`,
			c2: "No independently verified command-collapse indicator this cycle. Leadership claims stay in the claimed class."
		},
		imagery: [
			"Dated optical is Sentinel-2 HLS / VIIRS browse — not a targeting sensor.",
			"Before/after swipe is change detection, not battle-damage confirmation.",
			firms.length ? `FIRMS cycle: ${firms.length} points. Agricultural baseline still applies.` : "FIRMS empty or stale this cycle."
		],
		meaning: "The campaign is still a multi-year contest over cities, corridors, and external sustainment. This six-hour slice is too short to show culmination, breakthrough, or collapse. Watch whether additional independent reporting, dated optical change, and logistics-airframe patterns line up on the same named places — not whether a single clip is spectacular.",
		political: `${saf.political} ${rsf.political} Neighboring states manage borders and patronage; UAE supply allegations remain reported/contested. Civilian harm and displacement remain the humanitarian baseline, not a side note.`,
		forecast: {
			mostLikely: "Continued positional fighting and corridor contestation without a demonstrated nationwide shift in the compiled control picture (50–70%).",
			alt: "A locally significant urban or corridor change that later gets multi-source corroboration (20–40%).",
			lowProb: "A publicly documented, independently corroborated shift in external airlift or a named-city control change that survives 72 hours of reporting (<20%).",
			watch: [
				"Two or more independent outlets naming the same place, not the same Telegram clip",
				"Dated optical change at a documented yard or airfield already in the archive",
				"Cargo-typical airframes repeating at the same public airfield across successive sweeps",
				"Humanitarian reporting of new displacement along a named corridor",
				"Analyst-confirmed queue items that actually move the control shading"
			]
		},
		gaps: [
			"True unit strength unknown",
			"Airfield throughput unmeasured (ADS-B is a coverage sample)",
			"Weapon-system claims from explosions unverified",
			"City-control headlines often lack geolocated presence",
			GDELT_NOTE(gdelt.length)
		],
		high: [
			"Compiled control map is a snapshot, not live",
			"FIRMS and ADS-B are public sensors with known gaps",
			"This product is documentation, not a targeting feed"
		],
		moderate: ["SAF/RSF political objectives as publicly stated", "Thermal points exist where FIRMS returns them"],
		low: ["Any single-cycle attribution of a strike, cargo contents, or city capture", "External-sponsor logistics details beyond named public sites"],
		source: "local",
		counts: {
			log6h: log6.length,
			log72h: log72.length,
			news: newsN,
			firms: firms.length,
			flights: flights.length,
			cargo: cargo.length
		}
	};
}
function GDELT_NOTE(n) {
	return n > 0 ? `GDELT points this cycle: ${n} — event codes, not confirmed incidents` : "GDELT empty or cached archive only";
}
function bboxAround(lat, lon, km = 18) {
	const d = km / 111;
	return {
		west: lon - d,
		south: lat - d,
		east: lon + d,
		north: lat + d
	};
}
function imgPair(lat, lon, date) {
	const bbox = bboxAround(lat, lon, 22);
	const earlier = (/* @__PURE__ */ new Date(Date.parse(date) - 10368e5)).toISOString().slice(0, 10);
	const day = date.slice(0, 10);
	return {
		before: snapshotUrl(earlier, bbox, "HLS_S30_Nadir_BRDF_Adjusted_Reflectance"),
		after: snapshotUrl(day, bbox, "HLS_S30_Nadir_BRDF_Adjusted_Reflectance")
	};
}
function pinPlace(annotations, id, title, paragraph, hay, opts) {
	const g = geocodePlace(hay, title);
	if (!g) return;
	if (annotations.some((a) => a.id === id)) return;
	annotations.push({
		id,
		kind: g.precise ? "event" : "circle",
		title,
		paragraph,
		confidence: opts.confidence,
		claim: opts.claim,
		lat: g.lat,
		lon: g.lon,
		radiusKm: opts.radiusKm ?? (g.precise ? 22 : 55),
		color: opts.color,
		sources: opts.sources,
		at: opts.at,
		imagery: imgPair(g.lat, g.lon, opts.at)
	});
}
function composeBriefing(opts) {
	const s = opts.sitrep;
	const live = opts.live;
	const news = live?.news ?? [];
	const firms = live?.firms ?? [];
	const flights = live?.flights ?? [];
	const annotations = [];
	const sections = [];
	for (const z of CONTROL_ZONES) {
		let lat = 0;
		let lon = 0;
		for (const [la, lo] of z.polygon) {
			lat += la;
			lon += lo;
		}
		const n = Math.max(z.polygon.length, 1);
		annotations.push({
			id: `zone-${z.id}`,
			kind: "zone",
			title: z.label,
			paragraph: `${z.note} Compiled regional control as of ${CONTROL_AS_OF}. Not a live frontline. Confidence ${z.confidence}.`,
			confidence: z.confidence.toUpperCase(),
			claim: "assessed",
			lat: lat / n,
			lon: lon / n,
			radiusKm: z.faction === "contested" ? 90 : 120,
			color: FACTION_META[z.faction]?.color ?? "#d4a017",
			sources: CONTROL_SOURCE,
			at: s.generatedAt
		});
	}
	sections.push({
		id: "exec",
		kicker: "1. Executive assessment",
		title: "What changed in this window",
		body: [
			s.bottomLine,
			s.meaning,
			s.political,
			`Overall confidence ${s.overallConfidence}. Window ${s.windowStart.slice(0, 16).replace("T", " ")}–${s.windowEnd.slice(11, 16)}Z.`,
			"This product is a documentation briefing written for a civilian situation room. Observation is not identification. Identification is not assessment. Assessment is not judgment. Ten recrawls of one clip remain one origin. Nothing here is a targeting overlay, a fire-control product, or a live FLOT.",
			"Read the map with the text: every circle, shaded belt, and corridor mark on the analyst overlay corresponds to a paragraph below. If a location cannot be independently verified, it is generalized to a named-place centroid or omitted."
		].join(" "),
		annoIds: CONTROL_ZONES.map((z) => `zone-${z.id}`)
	});
	const keyBullets = s.developments.map((d, i) => ({
		d,
		id: `dev-${i}`
	}));
	for (const { d, id } of keyBullets) {
		const city = CONTROL_CITIES.find((c) => d.location && c.name.toLowerCase().includes(d.location.toLowerCase()) || d.title.toLowerCase().includes(c.name.toLowerCase()));
		if (city) annotations.push({
			id,
			kind: "event",
			title: d.title,
			paragraph: `${d.observed} Assessment: ${d.assessment}`,
			confidence: d.confidence,
			claim: d.claim,
			lat: city.lat,
			lon: city.lon,
			radiusKm: 28,
			color: FACTION_META[city.faction]?.color ?? "#d4a017",
			sources: "Compiled control city + this cycle's ingest",
			at: s.generatedAt,
			imagery: imgPair(city.lat, city.lon, s.generatedAt)
		});
		else pinPlace(annotations, id, d.title, `${d.observed} Assessment: ${d.assessment}`, `${d.location ?? ""} ${d.title}`, {
			confidence: d.confidence,
			claim: d.claim,
			color: "#d4a017",
			sources: "Named-place geocode from this cycle's development",
			at: s.generatedAt
		});
	}
	sections.push({
		id: "key",
		kicker: "2. Key developments",
		title: "Observed vs assessed",
		body: "Each item below separates what a source shows or says from what we assess. A headline is a claim. FIRMS is heat. ADS-B is a state vector. Dated optical is a granule. Imagery cards, where a named city is involved, are HLS browse — not confirmation of the claim. Click a row to fly the map to the linked annotation.",
		bullets: s.developments.map((d) => `${d.title} — ${d.claim.toUpperCase()} / ${d.confidence} / ${d.significance}${d.location ? ` / ${d.location}` : ""}. Observed: ${d.observed} Assessment: ${d.assessment}`),
		annoIds: keyBullets.map((k) => k.id)
	});
	const newsSlice = news.slice(0, 18);
	const points = live?.newsPoints ?? [];
	for (const p of points.slice(0, 12)) annotations.push({
		id: `news-${p.id}`,
		kind: "circle",
		title: `${p.name} · ${p.count} headline${p.count === 1 ? "" : "s"}`,
		paragraph: p.articles.map((a) => a.title).join(" · ") || `Public wire cluster at ${p.name}. Named-place centroid, not an incident coordinate.`,
		confidence: "LOW",
		claim: "reported",
		lat: p.lat,
		lon: p.lon,
		radiusKm: 22,
		color: "#8ec8ff",
		sources: "Google News RSS · named-place geocoding",
		at: s.generatedAt,
		imagery: imgPair(p.lat, p.lon, s.generatedAt)
	});
	for (const n of newsSlice) pinPlace(annotations, `wire-${n.id}`, n.title, `${n.source}: ${n.title}`, n.title, {
		confidence: "LOW",
		claim: "reported",
		color: "#8ec8ff",
		sources: n.source,
		at: n.date ?? s.generatedAt,
		radiusKm: 18
	});
	sections.push({
		id: "imagery",
		kicker: "3. Imagery intelligence",
		title: "What dated optical can and cannot show",
		body: s.imagery.join(" ") + " For every named-place cluster in this briefing, a before/after HLS browse card is attached to the map annotation and repeated in this section. Cloud, 30 m grain, and latency mean a report can be true while the granule is empty. Empty optical is not negative evidence. Do not read a pickup as a technical, a scar as a strike, or a roof as occupancy. High-res Esri is undated — use it to inspect yards, not to time a change. VIIRS is coarse (~375 m) and useful for smoke and burn scars, not vehicles.",
		bullets: points.slice(0, 8).map((p) => `${p.name}: ${p.count} public headlines. Centroid only. Open the annotation for HLS before/after.`),
		annoIds: points.slice(0, 8).map((p) => `news-${p.id}`)
	});
	const cargo = flights.filter((f) => f.category === "cargo" || f.military);
	sections.push({
		id: "air",
		kicker: "4. Air / aviation activity",
		title: "Public ADS-B sample, not the air picture",
		body: s.picture.air + " Positions update on a ~20 second poll and dead-reckon between polls so a moving symbol is an ADS-B state vector, not a mission. Passenger airframes are shown because the workbench displays traffic, not because they are assessed as combat. Category is typical for the airframe. Cargo contents are unknown. ADS-B silence over Darfur, Kordofan, and the desert corridors is a coverage gap — absence of a track is not absence of a flight. Archive sample tracks remain on the map when live coverage is outside the Sudan frame so the air layer is never an empty lie.",
		bullets: [`${flights.length} public tracks this cycle (${cargo.length} cargo-typical or military-flagged).`, ...flights.slice(0, 10).map((f) => `${f.typeCode} ${f.reg !== "unknown" ? f.reg : f.hex} · ${f.category} · ${f.nearestAirfield}${f.live ? " · live" : " · archive"}`)]
	});
	sections.push({
		id: "ground",
		kicker: "5. Ground situation",
		title: "Compiled control, not a FLOT",
		body: s.picture.ground + ` Control polygons are regional and time-bounded (as of ${CONTROL_AS_OF}). ${CONTROL_SOURCE} SAF cyan covers the north, Nile, Khartoum, and the east including Port Sudan. RSF rust covers the Darfur states after the fall of El Fasher in open reporting. Gold dashed marks the Kordofan belt as contested. SPLM-N green is a low-confidence Nuba overlay. A single social-media capture claim does not recode a polygon. Analyst-confirmed queue items can nudge city markers only.`,
		bullets: CONTROL_CITIES.map((c) => `${c.name}: ${c.faction.toUpperCase()} (${c.confidence}) as of ${c.asOf}. ${c.note}`),
		annoIds: CONTROL_ZONES.map((z) => `zone-${z.id}`)
	});
	const hot = firms.filter((f) => f.frp >= 15).length;
	sections.push({
		id: "fires",
		kicker: "6. Fires / thermal",
		title: "FIRMS is a heat feed",
		body: s.picture.fires + ` ${firms.length} VIIRS points in the AOI; ${hot} at FRP ≥ 15. Agricultural burning, gas flares, and brick kilns are the baseline in Sudan. A night-time urban cluster near a hospital, camp, or market is tagged possible-explosive only as a review cue. Thermal without dated optical is not battle-damage assessment. Do not promote a FIRMS point to a strike.`
	});
	sections.push({
		id: "logistics",
		kicker: "7. Logistics and sustainment",
		title: "Corridors, airframes, ports",
		body: s.picture.logistics + " Red Sea lane markers are documented-corridor animation, not live AIS — they crawl so the maritime picture is not frozen. Port Sudan, Suakin, Assab, Jebel Ali, Suez, Fujairah are nodes. Chad–West Darfur and Kufra–Darfur lines are reported desert-track geometry. External-sponsor airlift remains a reported/contested class unless independently documented at a named public airfield across successive sweeps. Throughput is unmeasured."
	});
	sections.push({
		id: "posture",
		kicker: "8. Force posture",
		title: "What this window does not show",
		body: "No independently verified reserve commitment, culmination, or command collapse this cycle. " + s.picture.c2 + " " + s.picture.initiative + " Unit designations, precise battery locations, and active-force coordinates that could facilitate real-world targeting are generalized to named cities or omitted. Presence at a public airfield or port node is not occupancy of a unit."
	});
	const saf = ACTORS.find((a) => a.id === "saf");
	const rsf = ACTORS.find((a) => a.id === "rsf");
	sections.push({
		id: "info",
		kicker: "9. Information war / narratives",
		title: "Claims vs evidence",
		body: `SAF information line: ${saf.info} RSF information line: ${rsf.info} Headlines in this cycle are ingested as reporting — the full Sudan wire, not a conflict-only filter. They are not upgraded to corroborated because they are numerous. Official military claims, local-source claims, and wire copy sit in different claim classes. Competing explanations stay on the page until independent families agree.`,
		bullets: newsSlice.slice(0, 12).map((n) => `${n.source}: ${n.title}`)
	});
	sections.push({
		id: "op",
		kicker: "10. Operational assessment",
		title: "Campaign, not incidents",
		body: s.meaning + " FM 3-90 language in this product is descriptive only: we may label a reported sequence as resembling an envelopment or a defense of a named urban area. That is an analytical metaphor, not an order of battle and not a recommendation. The campaign remains a multi-year contest over cities, corridors, and external sustainment."
	});
	sections.push({
		id: "strat",
		kicker: "11. Strategic / political",
		title: "Purpose, sponsors, civilians",
		body: s.political + " Neighboring capitals (Cairo, N'Djamena, Addis, Abu Dhabi, Tripoli) appear in this workbench as public sites and reported corridors, not as confirmed belligerents in this cycle. Civilian harm, displacement, and hospital/market pins are the humanitarian baseline. They are not a side note to the military picture."
	});
	sections.push({
		id: "forecast",
		kicker: "12. Forecast — next 24–72 hours",
		title: "Scenarios, not predictions",
		body: `MOST LIKELY (50–70%): ${s.forecast.mostLikely} SIGNIFICANT ALTERNATIVE (20–40%): ${s.forecast.alt} LOW-PROBABILITY / HIGH-IMPACT (<20%): ${s.forecast.lowProb} These bands are qualitative. They are not targeting probabilities.`,
		bullets: s.forecast.watch.map((w) => `Watch: ${w}`)
	});
	sections.push({
		id: "gaps",
		kicker: "13. Intelligence gaps",
		title: "What we do not know",
		body: "The following are first-order unknowns. Filling them would change the assessment; guessing them would corrupt it. " + s.gaps.join(" "),
		bullets: s.gaps
	});
	sections.push({
		id: "conf",
		kicker: "14. Confidence summary",
		title: "Quality of judgment, not probability",
		body: `Overall ${s.overallConfidence}. HIGH: ${s.high.join("; ")}. MODERATE: ${s.moderate.join("; ")}. LOW: ${s.low.join("; ")}. Confidence here describes the quality of the evidence, not the chance a future event occurs. A high-confidence statement can still be wrong; a low-confidence statement can still be important.`
	});
	return {
		generatedAt: s.generatedAt,
		window: `${s.windowStart} – ${s.windowEnd}`,
		overall: s.overallConfidence,
		sections,
		annotations
	};
}
function circlePoly(lat, lon, km, steps = 36) {
	const ring = [];
	const dLat = km / 111;
	const dLon = km / (111 * Math.max(Math.cos(lat * Math.PI / 180), .2));
	for (let i = 0; i <= steps; i++) {
		const a = i / steps * Math.PI * 2;
		ring.push([lon + Math.cos(a) * dLon, lat + Math.sin(a) * dLat]);
	}
	return ring;
}
var HUNTS = [
	{
		id: "bda",
		short: "BDA",
		label: "Damage / BDA",
		look: "Roof scrape, scorch, FIRMS on structure, catalog damaged. Not a strike call."
	},
	{
		id: "cargo",
		short: "CARGO",
		label: "Cargo / logistics",
		look: "Yards, cargo-typical airframes, car-carriers, apron objects. Type ≠ payload."
	},
	{
		id: "air",
		short: "AIR",
		label: "Airfields & strips",
		look: "Aprons, unlisted strips, hangars, cargo-typical overflight."
	},
	{
		id: "sea",
		short: "SEA",
		label: "Ports & ships",
		look: "AIS-typical near public ports, new yard geometry. Not a cargo claim."
	},
	{
		id: "veh",
		short: "VEH",
		label: "Vehicle parks",
		look: "Compact-object clusters, parking grids, technicals-typical. 30 m cannot ID type."
	},
	{
		id: "pad",
		short: "PAD",
		label: "Compounds / pads",
		look: "Bermed compounds, tents, staging pads. Morphology, not occupancy."
	},
	{
		id: "irreg",
		short: "IRREG",
		label: "Non-army pads",
		look: "ETH/TCD compounds and strips not labeled national army."
	},
	{
		id: "berm",
		short: "BERM",
		label: "Earthworks",
		look: "Linear HV, new berms, revetments, fighting-position geometry."
	},
	{
		id: "pol",
		short: "POL",
		label: "Fuel / storage",
		look: "Tank farms, bladders, tanker-typical airframes, refinery heat."
	},
	{
		id: "camp",
		short: "CAMP",
		label: "Camps",
		look: "Tent grids vs IDP baseline. Do not relabel humanitarian as military."
	},
	{
		id: "xing",
		short: "XING",
		label: "Crossings / bridges",
		look: "Border posts, river crossings, new tracks to the line."
	},
	{
		id: "thrm",
		short: "THRM",
		label: "Thermal",
		look: "Non-ag FIRMS, night clusters, industrial heat. Not a strike feed."
	},
	{
		id: "track",
		short: "TRACK",
		label: "Desert tracks / wells",
		look: "Well stops, dust corridors, remote pads on Libya–Chad–Darfur lines."
	},
	{
		id: "fx",
		short: "FX",
		label: "Foreign-linked nodes",
		look: "Public UAE / Assab / Berbera / Kufra / Dhafra pins. Pin ≠ cargo."
	},
	{
		id: "osm",
		short: "OSM",
		label: "Uncatalogued features",
		look: "OSM-AI-helper: existing / new / missed vs volunteered OSM. Not a secret-base finder."
	},
	{
		id: "wire",
		short: "WIRE",
		label: "Reporting cues",
		look: "News / GDELT / @AfriMEOSINT geocoded as leads, not facts."
	},
	{
		id: "saf",
		short: "SAF",
		label: "SAF-typical picture",
		look: "Formal garrisons, airbases, Nile rear. Compiled control, not occupancy."
	},
	{
		id: "rsf",
		short: "RSF",
		label: "RSF-typical picture",
		look: "Non-SAF compounds, technicals parks, converted yards. Indicators-and-patterns — not ownership."
	},
	{
		id: "chain",
		short: "CHAIN",
		label: "Movement chain",
		look: "Arrival → staging → hub → operational area. Libya–Darfur and Ethiopia–Kurmuk. Chain incomplete until observed."
	}
];
Object.fromEntries(HUNTS.map((h) => [h.id, h]));
var WIRE = [
	["bda", /\b(strike|airstrike|shelling|bombard|artillery|destroyed|rubble|burned|scorch|bda|damage)\b/i],
	["cargo", /\b(airlift|il-?76|c-?17|c-?130|cargo|convoy|shipment|logistics|supply|ammunition|arms)\b/i],
	["air", /\b(drone|uav|runway|apron|hangar|aircraft|airfield|airstrip)\b/i],
	["sea", /\b(port|vessel|ship|dhow|freighter|ais|harbour|harbor)\b/i],
	["veh", /\b(technical|pickup|armour|armor|tank|vehicle|ifv|apc)\b/i],
	["pad", /\b(base|compound|barrack|garrison|outpost|staging)\b/i],
	["berm", /\b(berm|trench|earthwork|fortif|revetment|fighting position)\b/i],
	["pol", /\b(fuel|diesel|petrol|pol|refinery|bladder|depot)\b/i],
	["camp", /\b(camp|idp|displac|tent|shelter)\b/i],
	["xing", /\b(crossing|border|bridge|checkpoint|frontier)\b/i],
	["fx", /\b(uae|emirati|abu dhabi|assab|berbera|kufra|dhafra|wagner|africa corps|pecotox)\b/i],
	["irreg", /\b(makeshift|unofficial|non-army|militia|rsf rear)\b/i],
	["saf", /\b(saf|sudanese armed|sudan army|army garrison)\b/i],
	["rsf", /\b(rsf|rapid support|hemedti|paramilitary)\b/i],
	["chain", /\b(convoy|airbridge|resupply|staging|kufra|asosa|libya.?sudan|movement chain)\b/i]
];
function matchHunts(text) {
	const out = [];
	for (const [id, re] of WIRE) if (re.test(text)) out.push(id);
	return out;
}
function huntsFromKlass(klass) {
	switch (klass) {
		case "possible_damage": return ["bda"];
		case "cargo_yard": return ["cargo"];
		case "airfield_activity": return ["air"];
		case "maritime": return ["sea"];
		case "vehicle_park": return ["veh"];
		case "base_compound": return ["pad"];
		case "irregular_pad": return ["irreg", "pad"];
		case "earthwork": return ["berm"];
		case "pol_storage": return ["pol"];
		case "camp_grid": return ["camp"];
		case "crossing_cue": return ["xing"];
		case "thermal_cluster": return ["thrm"];
		case "corridor_track": return ["track"];
		case "osm_gap": return ["osm"];
		case "reporting_cue": return ["wire"];
		case "burn_scar": return ["bda"];
		case "wreck_air": return ["bda", "air"];
		case "wreck_bldg": return ["bda"];
		case "camp_buildup": return [
			"camp",
			"pad",
			"veh"
		];
		default: return ["pad"];
	}
}
var FX_RE = /uae|emirati|dhafra|minhad|jebel ali|fujairah|assab|berbera|bosaso|kufra|al khadim|dp world/i;
function isForeignLinked(s) {
	return FX_RE.test(`${s.name} ${s.notes} ${s.admin2}`);
}
/**
* Client-side loop adapted from hamzahelhafdaoui/osm-ai-helper
* (Mozilla.ai OSM-AI-helper: OSM ground truth → tiles → existing / new / missed).
* We do not load YOLO or SAM2. Morphology chips + OSM tags are the stand-in.
* Human review (confirm / reject / needs-imagery) is the active-learning step.
*/
var GT = /airfield|airstrip|aerodrome|strip|helipad|heliport|military|barrack|depot|yard|port|warehouse|fuel|tank|compound|base/i;
function isOsmGroundTruth(o) {
	return GT.test(`${o.kind} ${o.name}`);
}
function osmVerdictFor(lat, lon, catalog, osm, fromOsm) {
	const nearCat = nearest(lat, lon, catalog, 5);
	const nearOsm = nearest(lat, lon, osm.filter(isOsmGroundTruth), 5);
	if (fromOsm && !nearCat) return "new";
	if (!fromOsm && !nearOsm) return "missed";
	return "existing";
}
var TECHNIQUE_BY_ID = Object.fromEntries([
	{
		id: "chip",
		playbook: "Tiling / chipping large scenes (SpaceNet, eolearn, SR_Utils)",
		weRun: "Watch-boxes and site buffers are cut into WMS chips (HLS 30 m, 768 px) so change is scored locally, not over the whole theater.",
		limit: "Chip size is a compromise. Objects smaller than ~2–3 pixels (vehicles at 30 m) are below Nyquist — we do not count them."
	},
	{
		id: "qa",
		playbook: "Image quality / DOTA-C robustness, iquaflow",
		weRun: "Brightness, saturation, and alpha (no-data) gates. Degraded chips are marked, not promoted.",
		limit: "A quality gate is not a cloud mask product (s2cloudless / Fmask). Empty HLS granules look like cloud."
	},
	{
		id: "cloud",
		playbook: "Cloud detection & removal (FCI, s2cloudless-class methods)",
		weRun: "High-luma / low-chroma pixel fraction plus transparent HLS as no-data. Cloudy chips skip change scoring.",
		limit: "Thin cirrus and dust are missed. We never inpaint. Absence of a chip is not absence of activity."
	},
	{
		id: "coreg",
		playbook: "Image registration / co-registration before change detection",
		weRun: "Same bbox, same WMS CRS, two dates (scene vs compare). No rubber-sheeting.",
		limit: "Residual misregistration at chip edges can look like change. We require a margin above that noise."
	},
	{
		id: "cd",
		playbook: "Bitemporal change detection (Siamese / UNet-diff / DS_UNet / ChaBuD)",
		weRun: "Mean absolute RGB difference on a 96 px downsample. High Δ + not-cloudy → possible_change.",
		limit: "Phenology, flood, harvest, and new metal roofs all light up. Change ≠ damage ≠ strike."
	},
	{
		id: "spectral",
		playbook: "NDVI / NBR / NDWI and Remote-Sensing-Indices-Derivation-Tool",
		weRun: "RGB proxies only: Excess Green (2G−R−B) for vegetation scrape, luma for yards/roofs, redness for scorch. HLS WMS is 3-band true color, not MSI.",
		limit: "True NBR needs SWIR. FIRMS is the thermal stand-in, never a burn-severity map."
	},
	{
		id: "obb",
		playbook: "Oriented object detection (DOTA, mmrotate, YOLOv5-OBB, SuperYOLO, DRBox)",
		weRun: "Resolution gate: at HLS 30 m we emit unresolved compact-object notes, not vehicle/aircraft boxes. High-res Esri is morphology only and not dated.",
		limit: "No OBB weights in this client. 30 m cannot separate technicals from 4x4s. Super-resolution is not applied."
	},
	{
		id: "buildings",
		playbook: "Building extraction (SpaceNet, YOLT2, Microsoft building damage, xView2 / xBD)",
		weRun: "OSM / OurAirports as weak labels for aerodromes, compounds, yards, ports. Catalog sites as the human-curated layer.",
		limit: "OSM is volunteered. A `military` or `aerodrome` tag is not occupancy and not a new base until an analyst confirms morphology."
	},
	{
		id: "damage",
		playbook: "xView2 / dual-HRNet / SKAI / Microsoft building-damage-assessment (no-damage → destroyed)",
		weRun: "Four observation bins: no_change, possible_change, thermal_cluster, possible_damage. Default confidence 1–2.",
		limit: "We never output destroyed / major-damage as a judgment. Optical darkening + FIRMS is still an observation."
	},
	{
		id: "sar",
		playbook: "SAR change, SSDD / xView3 ships, SpaceNet SAR buildings",
		weRun: "Not wired. Optical + FIRMS only. Cloud-covered Darfur stays a coverage gap.",
		limit: "No Sentinel-1 GRD in this sweep. Do not treat optical silence as a negative."
	},
	{
		id: "sits",
		playbook: "Satellite image time series / ConvLSTM / EarthPT",
		weRun: "Paired dates from the date strip (scene vs compare) plus 24 h FIRMS. Not a full SITS encoder.",
		limit: "Two dates are not a season. Agricultural fire windows are filed as negative evidence."
	},
	{
		id: "weak",
		playbook: "OSM-AI-helper (Mozilla.ai / hamzahelhafdaoui): OSM ground truth → tiles → existing / new / missed",
		weRun: "OSM military/aerodrome/warehouse tags are weak labels. Each chip is scored existing (OSM already maps it), new (OSM/morphology far from archive), or missed (catalog pin with no OSM). Confirm / reject / needs-imagery is the active-learning loop. No YOLO or SAM2 weights in this client.",
		limit: "A yellow 'new' box is an invitation to look, not a discovery of a secret facility. We do not train a targeting model."
	},
	{
		id: "fusion",
		playbook: "Multimodal fusion (optical + SAR + ancillary)",
		weRun: "Optical change × FIRMS × ADS-B (airframe category typical, never cargo) × news centroids × OSM. Two families required to promote a card.",
		limit: "News pins are named-place centroids. ADS-B silence ≠ no flight. FIRMS ≠ strike."
	},
	{
		id: "xai",
		playbook: "Explainable AI / UQ (XAI4EO, Lightning UQ Box)",
		weRun: "Every box carries the technique IDs that fired, a plain-language why, cloud class, and Δ score.",
		limit: "Explanation is the rule list, not a saliency map from a trained net."
	},
	{
		id: "foundational",
		playbook: "Prithvi, Clay, SpectralGPT, TerraTorch, DOFA",
		weRun: "Not loaded. This workbench is classical proxies + public feeds so it runs without a GPU.",
		limit: "A foundation-model pass would still be a candidate list for the same human review."
	}
].map((t) => [t.id, t]));
/** Priors from published stills — compact objects on desert, scorch, apron. */
var DEFAULT_WEIGHTS = {
	none: {
		blobs: -.15,
		hv: -.2,
		edge: -.4,
		exg: 1.2,
		red: -.2,
		delta: -.4,
		meanL: 0,
		bias: .4
	},
	camp: {
		blobs: .22,
		hv: .5,
		edge: .8,
		exg: -1.4,
		red: .1,
		delta: .6,
		meanL: .2,
		bias: -.9
	},
	veh: {
		blobs: .28,
		hv: .3,
		edge: .5,
		exg: -1.2,
		red: 0,
		delta: .3,
		meanL: .15,
		bias: -.8
	},
	berm: {
		blobs: .04,
		hv: 1.6,
		edge: 1.2,
		exg: -.8,
		red: 0,
		delta: .4,
		meanL: 0,
		bias: -.7
	},
	burn: {
		blobs: .02,
		hv: .1,
		edge: .3,
		exg: -1,
		red: 2.4,
		delta: 1.8,
		meanL: .1,
		bias: -.85
	},
	wreck_air: {
		blobs: .12,
		hv: .4,
		edge: .7,
		exg: -.6,
		red: 1.1,
		delta: 1.4,
		meanL: .4,
		bias: -.95
	},
	wreck_bldg: {
		blobs: .05,
		hv: .6,
		edge: .9,
		exg: -.4,
		red: .8,
		delta: 1.6,
		meanL: .2,
		bias: -.9
	},
	cargo: {
		blobs: .18,
		hv: .45,
		edge: .7,
		exg: -1,
		red: 0,
		delta: .7,
		meanL: .35,
		bias: -.75
	}
};
var LR = .04;
function dot(w, x) {
	return w.bias + w.blobs * x.blobs + w.hv * x.hv + w.edge * x.edge + w.exg * x.exg + w.red * x.red + w.delta * x.delta + w.meanL * x.meanL;
}
function predictChip(x, weights = DEFAULT_WEIGHTS) {
	const scores = {};
	let best = "none";
	let bestV = -Infinity;
	Object.keys(weights).forEach((k) => {
		const v = dot(weights[k], x);
		scores[k] = v;
		if (v > bestV) {
			bestV = v;
			best = k;
		}
	});
	return {
		klass: best,
		score: bestV,
		scores
	};
}
function trainChip(weights, x, klass, confirmed) {
	const next = structuredClone(weights);
	const w = next[klass];
	const s = confirmed ? LR : -.04;
	w.blobs += s * x.blobs;
	w.hv += s * x.hv;
	w.edge += s * x.edge;
	w.exg += s * x.exg;
	w.red += s * x.red;
	w.delta += s * x.delta;
	w.meanL += s * x.meanL;
	w.bias += s;
	return next;
}
function modelToKlass(k) {
	if (k === "camp") return "camp_buildup";
	if (k === "veh") return "vehicle_park";
	if (k === "berm") return "earthwork";
	if (k === "burn") return "burn_scar";
	if (k === "wreck_air") return "wreck_air";
	if (k === "wreck_bldg") return "wreck_bldg";
	if (k === "cargo") return "cargo_yard";
	return "unresolved_objects";
}
function featuresFromShape(shape, sm, delta) {
	return {
		blobs: Math.min(shape.blobs, 24),
		hv: shape.hv,
		edge: shape.edge,
		exg: sm.exg,
		red: sm.red,
		delta,
		meanL: sm.meanL
	};
}
function serializeWeights(w) {
	return JSON.stringify({
		version: 1,
		kind: "ahsr-chip-weights",
		weights: w
	}, null, 2);
}
function parseWeights(raw) {
	try {
		const j = JSON.parse(raw);
		if (!j.weights) return null;
		const next = structuredClone(DEFAULT_WEIGHTS);
		Object.keys(DEFAULT_WEIGHTS).forEach((k) => {
			if (j.weights?.[k]) next[k] = {
				...DEFAULT_WEIGHTS[k],
				...j.weights[k]
			};
		});
		return next;
	} catch {
		return null;
	}
}
function stamp() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function audit(action, target, reason) {
	return {
		id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		at: stamp(),
		actor: "local-analyst",
		action,
		target,
		reason
	};
}
var defaultReviews = {};
for (const a of ALERTS) if (a.review !== "unreviewed") defaultReviews[a.id] = {
	state: a.review,
	note: a.negativeEvidence || "Seeded review from archive.",
	confidence: a.confidence,
	at: a.datetime
};
var useAppStore = create()(persist((set) => ({
	selectedSiteId: null,
	selectedAlertId: null,
	focusedBoxId: null,
	yardsZoom: false,
	partyFilter: "all",
	kindFilter: "all",
	reviewFilter: "all",
	layers: {
		sites: true,
		firms: true,
		flights: true,
		boxes: true,
		gibs: true,
		thermalRaster: false,
		control: true,
		news: true,
		hazards: true,
		reports: true,
		ai: true,
		gdelt: true,
		osm: false,
		vessels: true,
		corridors: true,
		rsfWatch: true,
		vista: true
	},
	imagery: "s2cloudless",
	date: daysAgo(4),
	compareDate: daysAgo(14),
	swipeOn: false,
	query: "",
	reviews: defaultReviews,
	partyOverrides: {},
	customBoxes: [],
	hiddenBoxIds: [],
	audit: [],
	changeLog: seedChangeLog(),
	lastSweepAt: null,
	helpOpen: false,
	helpSeen: false,
	customReports: [],
	selectedReportId: null,
	addingReport: false,
	rightTab: "queue",
	hudOn: true,
	detectOn: true,
	look: "none",
	orbitOn: false,
	theaterId: "sdn",
	controlUpdates: [],
	flyTarget: null,
	dateLock: false,
	fuaeLog: [],
	listOrder: "newest",
	modelWeights: DEFAULT_WEIGHTS,
	chipSamples: [],
	setSelectedSite: (id) => set({
		selectedSiteId: id,
		focusedBoxId: null,
		selectedReportId: null
	}),
	setSelectedAlert: (id) => set({ selectedAlertId: id }),
	setFocusedBox: (id) => set({
		focusedBoxId: id,
		selectedSiteId: null,
		selectedAlertId: null
	}),
	requestYardsZoom: () => set({
		yardsZoom: true,
		imagery: "hires"
	}),
	clearYardsZoom: () => set({ yardsZoom: false }),
	setPartyFilter: (p) => set({ partyFilter: p }),
	setKindFilter: (k) => set({ kindFilter: k }),
	setReviewFilter: (r) => set({ reviewFilter: r }),
	toggleLayer: (k) => set((s) => ({ layers: {
		...s.layers,
		[k]: !s.layers[k]
	} })),
	setImagery: (i) => set({ imagery: i }),
	setDate: (d) => set({ date: d }),
	setCompareDate: (d) => set({ compareDate: d }),
	setSwipeOn: (v) => set({ swipeOn: v }),
	setQuery: (q) => set({ query: q }),
	reviewAlert: (id, state, note, confidence) => set((s) => {
		const alert = ALERTS.find((a) => a.id === id);
		const nextUpdates = [...s.controlUpdates];
		if (state === "confirmed" && alert && alert.families.includes("corridor")) nextUpdates.unshift({
			id: `cu-${id}`,
			lat: alert.lat,
			lon: alert.lon,
			faction: "contested",
			date: stamp().slice(0, 10),
			label: alert.title,
			source: "analyst-confirmed queue"
		});
		return {
			reviews: {
				...s.reviews,
				[id]: {
					state,
					note,
					confidence,
					at: stamp()
				}
			},
			controlUpdates: nextUpdates.slice(0, 80),
			audit: [audit("review-alert", id, `${state} · c${confidence} · ${note || "no note"}`), ...s.audit].slice(0, 200)
		};
	}),
	overrideParty: (siteId, party, reason) => set((s) => ({
		partyOverrides: {
			...s.partyOverrides,
			[siteId]: {
				party,
				reason,
				at: stamp()
			}
		},
		audit: [audit("party-label", siteId, `${party} · ${reason}`), ...s.audit].slice(0, 200)
	})),
	addBox: (box) => set((s) => ({
		customBoxes: [...s.customBoxes, box],
		audit: [audit("watchbox-add", box.id, box.name), ...s.audit].slice(0, 200)
	})),
	removeBox: (id) => set((s) => ({
		customBoxes: s.customBoxes.filter((b) => b.id !== id),
		audit: [audit("watchbox-remove", id, "removed custom box"), ...s.audit].slice(0, 200)
	})),
	hideDefaultBox: (id) => set((s) => ({
		hiddenBoxIds: [...s.hiddenBoxIds, id],
		audit: [audit("watchbox-hide", id, "hid default box"), ...s.audit].slice(0, 200)
	})),
	replaceLog: (rows) => set({ changeLog: sortLog(rows) }),
	setLastSweepAt: (iso) => set({ lastSweepAt: iso }),
	setHelpOpen: (v) => set(v ? { helpOpen: true } : {
		helpOpen: false,
		helpSeen: true
	}),
	addReport: (r) => set((s) => {
		const faction = r.category === "control-change" ? partyToFaction(r.party) : null;
		const controlUpdates = faction ? [{
			id: `cu-${r.id}`,
			lat: r.lat,
			lon: r.lon,
			faction,
			date: r.date,
			label: r.title,
			source: r.sourceLabel
		}, ...s.controlUpdates].slice(0, 80) : s.controlUpdates;
		return {
			customReports: [r, ...s.customReports],
			selectedReportId: r.id,
			addingReport: false,
			rightTab: "reports",
			controlUpdates,
			audit: [audit("report-add", r.id, r.title), ...s.audit].slice(0, 200)
		};
	}),
	setSelectedReport: (id) => set({
		selectedReportId: id,
		selectedSiteId: null,
		selectedAlertId: null,
		addingReport: false,
		rightTab: "reports"
	}),
	setAddingReport: (v) => set({
		addingReport: v,
		selectedReportId: null,
		rightTab: "reports"
	}),
	setRightTab: (t) => set({
		rightTab: t,
		addingReport: false
	}),
	setHudOn: (hudOn) => set({ hudOn }),
	setDetectOn: (detectOn) => set({ detectOn }),
	setLook: (look) => set((s) => ({
		look,
		hudOn: look === "none" ? s.hudOn : true
	})),
	setOrbitOn: (orbitOn) => set({ orbitOn }),
	setTheater: (theaterId) => set({ theaterId }),
	addControlUpdate: (u) => set((s) => ({ controlUpdates: [u, ...s.controlUpdates].slice(0, 80) })),
	setFlyTarget: (flyTarget) => set(flyTarget ? {
		flyTarget,
		selectedSiteId: null
	} : { flyTarget: null }),
	setDateLock: (dateLock) => set({ dateLock }),
	ingestFuae: (rows) => set((s) => {
		if (!rows.length && s.fuaeLog.length) return s;
		const map = new Map(s.fuaeLog.map((r) => [r.id, r]));
		for (const row of rows) {
			const prev = map.get(row.id);
			map.set(row.id, prev ? {
				...prev,
				...row,
				firstSeen: prev.firstSeen,
				lastSeen: row.lastSeen
			} : row);
		}
		return { fuaeLog: [...map.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, 200) };
	}),
	setListOrder: (listOrder) => set({ listOrder }),
	trainModel: (features, klass, confirmed) => set((s) => ({
		modelWeights: trainChip(s.modelWeights, features, klass, confirmed),
		chipSamples: [{
			features,
			klass,
			label: confirmed ? 1 : 0,
			at: (/* @__PURE__ */ new Date()).toISOString()
		}, ...s.chipSamples].slice(0, 400),
		audit: [audit("chip-train", klass, confirmed ? "confirm" : "reject"), ...s.audit].slice(0, 200)
	})),
	setModelWeights: (modelWeights) => set({ modelWeights })
}), {
	name: "ahsr-sudan-v2",
	partialize: (s) => ({
		reviews: s.reviews,
		partyOverrides: s.partyOverrides,
		customBoxes: s.customBoxes,
		hiddenBoxIds: s.hiddenBoxIds,
		audit: s.audit,
		imagery: s.imagery,
		changeLog: s.changeLog,
		lastSweepAt: s.lastSweepAt,
		helpSeen: s.helpSeen,
		customReports: s.customReports,
		hudOn: s.hudOn,
		detectOn: s.detectOn,
		theaterId: s.theaterId,
		controlUpdates: s.controlUpdates,
		dateLock: s.dateLock,
		fuaeLog: s.fuaeLog,
		listOrder: s.listOrder,
		modelWeights: s.modelWeights,
		chipSamples: s.chipSamples,
		look: s.look
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		const seeded = seedChangeLog();
		const have = new Map((p.changeLog ?? []).map((e) => [e.id, e]));
		for (const row of seeded) if (!have.has(row.id)) have.set(row.id, row);
		return {
			...current,
			...p,
			changeLog: sortLog([...have.values()]),
			layers: {
				...current.layers,
				...p.layers ?? {},
				control: true,
				flights: true,
				vessels: true,
				osm: p.layers?.osm ?? false,
				gdelt: p.layers?.gdelt ?? true,
				corridors: p.layers?.corridors ?? true,
				rsfWatch: p.layers?.rsfWatch ?? true,
				vista: p.layers?.vista ?? true
			},
			controlUpdates: p.controlUpdates ?? [],
			fuaeLog: p.fuaeLog ?? [],
			listOrder: p.listOrder === "oldest" ? "oldest" : "newest",
			modelWeights: p.modelWeights ?? DEFAULT_WEIGHTS,
			chipSamples: Array.isArray(p.chipSamples) ? p.chipSamples.slice(0, 400) : [],
			look: p.look === "crt" || p.look === "nvg" || p.look === "flir" || p.look === "noir" || p.look === "snow" ? p.look : "none",
			helpOpen: false,
			helpSeen: Boolean(p.helpSeen) || p.helpOpen === false
		};
	}
}));
function useVisibleBoxes() {
	const custom = useAppStore((s) => s.customBoxes);
	const hidden = useAppStore((s) => s.hiddenBoxIds);
	return [...WATCH_BOXES.filter((b) => !hidden.includes(b.id)), ...custom];
}
var DETECT_KLASS = {
	base_compound: {
		label: "Compound / base morphology",
		short: "PAD",
		color: "#7b93a6"
	},
	irregular_pad: {
		label: "Non-army pad (ETH/TCD review)",
		short: "IRREG",
		color: "#c4a35a"
	},
	cargo_yard: {
		label: "Yard / cargo in motion",
		short: "CARGO",
		color: "#b38862"
	},
	airfield_activity: {
		label: "Airfields & strips",
		short: "AIR",
		color: "#d8d2c6"
	},
	possible_damage: {
		label: "Possible change / damage",
		short: "BDA",
		color: "#c4894a"
	},
	thermal_cluster: {
		label: "Thermal cluster",
		short: "THRM",
		color: "#c4894a"
	},
	unresolved_objects: {
		label: "Unresolved compact objects",
		short: "OBJ",
		color: "#d4a017"
	},
	osm_gap: {
		label: "OSM feature not in archive",
		short: "OSM",
		color: "#7ec8b3"
	},
	vehicle_park: {
		label: "Vehicle-park morphology",
		short: "VEH",
		color: "#c9a27a"
	},
	earthwork: {
		label: "Earthwork / berm geometry",
		short: "BERM",
		color: "#8a9a6a"
	},
	pol_storage: {
		label: "Fuel / storage morphology",
		short: "POL",
		color: "#b07a4a"
	},
	camp_grid: {
		label: "Camp / tent-grid morphology",
		short: "CAMP",
		color: "#7ec8b3"
	},
	crossing_cue: {
		label: "Crossing / bridge cue",
		short: "XING",
		color: "#8aa4b8"
	},
	maritime: {
		label: "Port / ship cue",
		short: "SEA",
		color: "#6a8ea8"
	},
	corridor_track: {
		label: "Desert track / well",
		short: "TRACK",
		color: "#a09070"
	},
	reporting_cue: {
		label: "Reporting cue",
		short: "WIRE",
		color: "#9a8a78"
	},
	burn_scar: {
		label: "Burn / scorch cue",
		short: "BURN",
		color: "#c46a3a"
	},
	wreck_air: {
		label: "Airframe / hangar damage cue",
		short: "WRECK",
		color: "#b07050"
	},
	wreck_bldg: {
		label: "Building scrape cue",
		short: "RUBBLE",
		color: "#a08060"
	},
	camp_buildup: {
		label: "Camp / makeshift-base buildup",
		short: "CAMP+",
		color: "#c4a35a"
	}
};
var HLS = "HLS_S30_Nadir_BRDF_Adjusted_Reflectance";
var VIIRS = "VIIRS_NOAA20_CorrectedReflectance_TrueColor";
var CHIP = 96;
var PRIORITY = /uae|dhafra|minhad|assab|fasher|nyala|khartoum|port sudan|kufra|amdjarass|jebel ali|fujairah|wadi seidna|geneina|asosa|adre|menge|goz beida|bahir dar|abéché|abeche|omdurman|dongola|kassala/i;
var ETH = {
	west: 34.5,
	south: 8.6,
	east: 42.2,
	north: 14.8
};
var TCD = {
	west: 13.4,
	south: 11.4,
	east: 22.25,
	north: 18.5
};
var TCD_NE = {
	west: 21.5,
	south: 15.2,
	east: 24,
	north: 18.8
};
function inEth(lat, lon) {
	return lon >= ETH.west && lon <= ETH.east && lat >= ETH.south && lat <= ETH.north;
}
function inTcd(lat, lon) {
	const main = lon >= TCD.west && lon <= TCD.east && lat >= TCD.south && lat <= TCD.north;
	const ennedi = lon >= TCD_NE.west && lon <= TCD_NE.east && lat >= TCD_NE.south && lat <= TCD_NE.north;
	return main || ennedi;
}
function ethChadLabel(lat, lon) {
	if (inEth(lat, lon)) return "Ethiopia";
	if (inTcd(lat, lon)) return "Chad";
	return null;
}
function isEthChadSite(s) {
	if (/ethiopia|chad|benishangul|ouaddaï|ouaddai|wadi fira|ennedi|asosa|amhara|sila|tigray/i.test(`${s.admin1} ${s.admin2}`)) return true;
	return Boolean(ethChadLabel(s.lat, s.lon));
}
function isNonArmyCue(s) {
	if (!isEthChadSite(s)) return false;
	if (s.kind === "hospital" || s.kind === "farm" || s.kind === "market" || s.kind === "camp") return false;
	if (s.kind === "airfield") return false;
	return s.kind === "compound" || s.kind === "strip" || s.kind === "logistics";
}
function partyHunts(party, lat, lon) {
	const out = [];
	if (party === "saf") out.push("saf");
	if (party === "rsf") out.push("rsf");
	const city = nearest(lat, lon, CONTROL_CITIES, 55);
	if (city?.item.faction === "saf" && !out.includes("saf")) out.push("saf");
	if (city?.item.faction === "rsf" && !out.includes("rsf")) out.push("rsf");
	return out;
}
function lonLatToTile(lon, lat, z) {
	const n = 2 ** z;
	const x = Math.floor((lon + 180) / 360 * n);
	const latRad = lat * Math.PI / 180;
	return {
		z,
		x,
		y: Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
	};
}
function esriExportUrl(bbox, size = 256) {
	const { west, south, east, north } = bbox;
	return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${west},${south},${east},${north}&bboxSR=4326&imageSR=4326&size=${size},${size}&format=jpg&f=image`;
}
function esriTileUrl(lat, lon, z = 15) {
	const t = lonLatToTile(lon, lat, z);
	return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${t.z}/${t.y}/${t.x}`;
}
function s2TileUrl(lat, lon, z = 13) {
	const t = lonLatToTile(lon, lat, z);
	return `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/${t.z}/${t.y}/${t.x}.jpg`;
}
async function loadMorphChip(lat, lon, bbox) {
	const tile = await loadChip(esriTileUrl(lat, lon, 15), 4500);
	if (tile) return {
		im: tile,
		layer: "Esri tile"
	};
	const s2 = await loadChip(s2TileUrl(lat, lon, 13), 4e3);
	if (s2) return {
		im: s2,
		layer: "S2 mosaic"
	};
	const esri = await loadChip(esriExportUrl(bbox), 4e3);
	return {
		im: esri,
		layer: esri ? "Esri" : "none"
	};
}
async function loadDatedChip(date, bbox) {
	const hls = await loadChip(snapshotUrl(date, bbox, HLS, 256));
	if (hls) return {
		im: hls,
		layer: "HLS"
	};
	const viirs = await loadChip(snapshotUrl(date, bbox, VIIRS, 256));
	return {
		im: viirs,
		layer: viirs ? "VIIRS" : "none"
	};
}
function boxOf(lat, lon, pad = .045) {
	return padBbox$1(lat, lon, pad);
}
function explain(ids) {
	return ids.map((id) => TECHNIQUE_BY_ID[id]?.weRun).filter(Boolean).join(" ");
}
function loadChip(url, timeoutMs = 5e3) {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		const t = window.setTimeout(() => resolve(null), timeoutMs);
		img.onload = () => {
			window.clearTimeout(t);
			try {
				const c = document.createElement("canvas");
				c.width = CHIP;
				c.height = CHIP;
				const ctx = c.getContext("2d", { willReadFrequently: true });
				if (!ctx) {
					resolve(null);
					return;
				}
				ctx.drawImage(img, 0, 0, CHIP, CHIP);
				resolve(ctx.getImageData(0, 0, CHIP, CHIP));
			} catch {
				resolve(null);
			}
		};
		img.onerror = () => {
			window.clearTimeout(t);
			resolve(null);
		};
		img.src = url;
	});
}
function stats(im) {
	if (!im) return {
		n: 0,
		meanL: 0,
		exg: 0,
		red: 0,
		cloudFrac: 1,
		nodataFrac: 1,
		pixels: null,
		w: 0,
		h: 0
	};
	const px = im.data;
	let n = 0;
	let sumL = 0;
	let sumExg = 0;
	let sumRed = 0;
	let cloud = 0;
	let nodata = 0;
	for (let i = 0; i < px.length; i += 4) {
		if (px[i + 3] / 255 < .12) {
			nodata += 1;
			continue;
		}
		const r = px[i] / 255;
		const g = px[i + 1] / 255;
		const b = px[i + 2] / 255;
		const L = (r + g + b) / 3;
		const sat = Math.max(r, g, b) - Math.min(r, g, b);
		sumL += L;
		sumExg += 2 * g - r - b;
		sumRed += r - (g + b) / 2;
		if (L > .86 && sat < .08) cloud += 1;
		n += 1;
	}
	const denom = Math.max(n, 1);
	const total = im.width * im.height;
	return {
		n,
		meanL: sumL / denom,
		exg: sumExg / denom,
		red: sumRed / denom,
		cloudFrac: (cloud + nodata) / Math.max(total, 1),
		nodataFrac: nodata / Math.max(total, 1),
		pixels: px,
		w: im.width,
		h: im.height
	};
}
function cloudClass(s) {
	if (s.n < 80) return "unknown";
	if (s.cloudFrac > .55 || s.nodataFrac > .55) return "cloudy";
	if (s.cloudFrac > .28) return "mixed";
	return "clear";
}
/** Compact bright objects + rectilinear edges — desert pad / compound / yard cue. Not an ID. */
function morphScore(im) {
	if (!im) return {
		edge: 0,
		blobs: 0,
		hv: 0
	};
	const { width: w, height: h, data } = im;
	const L = new Float32Array(w * h);
	for (let i = 0, p = 0; i < data.length; i += 4, p++) L[p] = (data[i] + data[i + 1] + data[i + 2]) / 765;
	let mag = 0;
	let hv = 0;
	let all = 0;
	const strong = new Array(w * h).fill(false);
	for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
		const gx = -L[(y - 1) * w + (x - 1)] + L[(y - 1) * w + (x + 1)] + -2 * L[y * w + (x - 1)] + 2 * L[y * w + (x + 1)] + -L[(y + 1) * w + (x - 1)] + L[(y + 1) * w + (x + 1)];
		const gy = -L[(y - 1) * w + (x - 1)] - 2 * L[(y - 1) * w + x] - L[(y - 1) * w + (x + 1)] + L[(y + 1) * w + (x - 1)] + 2 * L[(y + 1) * w + x] + L[(y + 1) * w + (x + 1)];
		const m = Math.abs(gx) + Math.abs(gy);
		mag += m;
		if (m > .35) {
			all += 1;
			if (Math.abs(gx) > Math.abs(gy) * 1.6 || Math.abs(gy) > Math.abs(gx) * 1.6) hv += 1;
		}
		if (L[y * w + x] > .58) strong[y * w + x] = true;
	}
	let blobs = 0;
	const seen = new Uint8Array(w * h);
	for (let i = 0; i < strong.length; i++) {
		if (!strong[i] || seen[i]) continue;
		let size = 0;
		const stack = [i];
		seen[i] = 1;
		while (stack.length) {
			const cur = stack.pop();
			size += 1;
			const cx = cur % w;
			const cy = cur / w | 0;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const nx = cx + dx;
				const ny = cy + dy;
				if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
				const ni = ny * w + nx;
				if (seen[ni] || !strong[ni]) continue;
				seen[ni] = 1;
				stack.push(ni);
			}
		}
		if (size >= 4 && size <= 90) blobs += 1;
	}
	const n = Math.max((w - 2) * (h - 2), 1);
	return {
		edge: mag / n,
		blobs,
		hv: all ? hv / all : 0
	};
}
function mad(a, b) {
	if (!a.pixels || !b.pixels || a.w !== b.w) return 0;
	const pa = a.pixels;
	const pb = b.pixels;
	let sum = 0;
	let n = 0;
	for (let i = 0; i < pa.length; i += 4) {
		if (pa[i + 3] < 30 || pb[i + 3] < 30) continue;
		sum += (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2])) / 765;
		n += 1;
	}
	return n ? sum / n : 0;
}
function firmsIn(firms, b) {
	return firms.filter((f) => inBbox(f.lat, f.lon, b) && f.klass !== "agricultural");
}
function fuseDetect(args) {
	const { boxes, firms, flights, osm, news, date, compareDate } = args;
	const vessels = args.vessels ?? [];
	const gdelt = args.gdelt ?? [];
	const hits = [];
	const seen = /* @__PURE__ */ new Set();
	let morphQueued = 0;
	const push = (h) => {
		if (seen.has(h.id)) return;
		seen.add(h.id);
		const { party, hunts: given, ...rest } = h;
		const hunts = [.../* @__PURE__ */ new Set([...given?.length ? given : huntsFromKlass(rest.klass), ...partyHunts(party ?? "unknown", rest.lat, rest.lon)])];
		hits.push({
			...rest,
			hunts
		});
	};
	const HUNT_KINDS = /* @__PURE__ */ new Set([
		"airfield",
		"strip",
		"compound",
		"logistics",
		"port",
		"camp",
		"crossing",
		"well"
	]);
	const CIVIL_BDA = /* @__PURE__ */ new Set([
		"hospital",
		"market",
		"farm"
	]);
	for (const site of SITES) {
		const huntSite = HUNT_KINDS.has(site.kind) || isNonArmyCue(site);
		const bdaSite = CIVIL_BDA.has(site.kind) || site.status === "damaged";
		if (!huntSite && !bdaSite) continue;
		const near = nearest(site.lat, site.lon, firms, site.kind === "airfield" ? 8 : 5);
		const combatFirms = firms.filter((f) => Math.abs(f.lat - site.lat) < .08 && Math.abs(f.lon - site.lon) < .08 && (f.klass === "urban_structure" || f.klass === "possible_explosive" || f.klass === "industrial"));
		const cargoFlights = flights.filter((f) => f.category === "cargo" && f.nearestAirfield && (f.nearestAirfield.toLowerCase().includes(site.name.split(" ")[0].toLowerCase()) || Math.abs((f.lat ?? 0) - site.lat) < .35));
		const newsHit = news.find((n) => Math.abs(n.lat - site.lat) < .25 && Math.abs(n.lon - site.lon) < .25);
		if (site.status === "damaged") {
			const bbox = boxOf(site.lat, site.lon, .05);
			push({
				id: `det-dmg-${site.id}`,
				klass: "possible_damage",
				title: `${site.name} · archive damage flag`,
				body: "Catalog status is damaged. Treat as a lead for the dated HLS pair — not battle-damage confirmation.",
				lat: site.lat,
				lon: site.lon,
				...bbox,
				confidence: 2,
				families: ["damage", "morphology"],
				techniques: [
					"damage",
					"buildings",
					"xai"
				],
				explain: explain(["damage", "buildings"]),
				hunts: site.kind === "hospital" || site.kind === "market" ? ["bda", "wire"] : ["bda"],
				party: site.party,
				siteId: site.id,
				cloud: "unknown",
				date,
				compareDate
			});
		}
		if (combatFirms.length >= 2 || near && (near.item.frp ?? 0) >= 12 && near.item.klass !== "agricultural") {
			const bbox = boxOf(site.lat, site.lon, .06);
			const families = ["thermal"];
			if (newsHit) families.push("reporting");
			push({
				id: `det-th-${site.id}`,
				klass: combatFirms.length >= 2 && site.kind !== "farm" ? "possible_damage" : "thermal_cluster",
				title: `${site.name} · ${combatFirms.length || 1} FIRMS point${(combatFirms.length || 1) > 1 ? "s" : ""}`,
				body: `Thermal cluster within ${Math.round((near?.km ?? 4) * 10) / 10} km of a ${site.kind}. FIRMS is not a strike feed. Klass ${near?.item.klass ?? "unknown"}.`,
				lat: site.lat,
				lon: site.lon,
				...bbox,
				confidence: families.length > 1 ? 2 : 1,
				families,
				techniques: [
					"fusion",
					"spectral",
					"damage",
					"xai"
				],
				explain: explain(["fusion", "spectral"]),
				siteId: site.id,
				cloud: "unknown",
				date,
				compareDate
			});
		}
		if (cargoFlights.length > 0 && (site.kind === "airfield" || site.kind === "port" || site.kind === "logistics" || site.kind === "strip")) {
			const bbox = boxOf(site.lat, site.lon, .07);
			push({
				id: `det-air-${site.id}`,
				klass: site.kind === "port" ? "maritime" : site.kind === "logistics" ? "cargo_yard" : "airfield_activity",
				title: `${site.name} · cargo-typical ADS-B`,
				body: `${cargoFlights.length} cargo-typical airframe${cargoFlights.length > 1 ? "s" : ""} near this ${site.kind}. Category is typical for the type code — not a cargo claim.`,
				lat: site.lat,
				lon: site.lon,
				...bbox,
				confidence: 2,
				families: ["flight", site.kind === "logistics" || site.kind === "port" ? "vehicles" : "flight"],
				techniques: [
					"fusion",
					"obb",
					"xai"
				],
				explain: explain(["fusion", "obb"]),
				hunts: site.kind === "port" ? [
					"cargo",
					"air",
					"sea"
				] : ["cargo", "air"],
				siteId: site.id,
				cloud: "unknown",
				date,
				compareDate
			});
		}
		const alwaysMorph = isNonArmyCue(site) || site.kind === "crossing" || site.kind === "well" || site.kind === "camp" || isForeignLinked(site);
		if (alwaysMorph || morphQueued < 40 && ([
			"compound",
			"strip",
			"logistics",
			"port"
		].includes(site.kind) || site.kind === "airfield" && (site.status === "damaged" || PRIORITY.test(`${site.name} ${site.admin1} ${site.admin2} ${site.notes}`)))) {
			if (!alwaysMorph) morphQueued += 1;
			const region = ethChadLabel(site.lat, site.lon);
			const irregular = isNonArmyCue(site);
			const fx = isForeignLinked(site);
			const klass = irregular ? "irregular_pad" : site.kind === "port" ? "maritime" : site.kind === "logistics" ? "cargo_yard" : site.kind === "airfield" || site.kind === "strip" ? "airfield_activity" : site.kind === "camp" ? "camp_grid" : site.kind === "crossing" ? "crossing_cue" : site.kind === "well" ? "corridor_track" : "base_compound";
			const hunts = huntsFromKlass(klass);
			if (fx) hunts.push("fx");
			if (irregular) hunts.push("irreg");
			if (site.kind === "well" || /kufra|libya|darfur/i.test(`${site.name} ${site.notes}`)) hunts.push("chain");
			const bbox = boxOf(site.lat, site.lon, site.kind === "airfield" ? .08 : .045);
			const verdict = osmVerdictFor(site.lat, site.lon, SITES, osm, false);
			push({
				id: `det-morph-${site.id}`,
				klass,
				title: irregular ? `${region ?? site.admin2} · non-army pad cue · ${site.name}` : fx ? `FX · ${site.name}` : `${site.name} · ${DETECT_KLASS[klass].short} chip`,
				body: irregular ? `Not a national-army identification (${region ?? "ETH/TCD"}). Chip looks for pads, tents, yards, compact objects on the public pin. Humanitarian and commercial use remain the baseline until a movement chain is shown.` : fx ? "Public foreign-linked node. Pin is the published facility — not a cargo or occupancy claim. Chip looks for yards, aprons, pads." : `GEOINT chip (${DETECT_KLASS[klass].label}). OSM-AI ${verdict}: ${verdict === "missed" ? "no OSM military/aerodrome nearby." : verdict === "existing" ? "OSM already maps a feature here." : "not in archive."} Pads, yards, berms, compact objects — not a base or weapons identification.`,
				lat: site.lat,
				lon: site.lon,
				...bbox,
				confidence: irregular || fx ? 2 : 1,
				families: irregular || fx ? ["morphology", "corridor"] : ["morphology"],
				techniques: [
					"chip",
					"buildings",
					"obb",
					"xai",
					"weak"
				],
				explain: explain(["chip", "buildings"]),
				hunts,
				party: site.party,
				siteId: site.id,
				cloud: "unknown",
				date,
				compareDate
			});
		}
	}
	const gapKinds = /* @__PURE__ */ new Set([
		"airfield",
		"base",
		"compound",
		"yard",
		"port",
		"airstrip",
		"strip",
		"helipad",
		"heliport",
		"military",
		"barrack",
		"depot",
		"fuel",
		"tank",
		"bunker",
		"checkpoint"
	]);
	let gaps = 0;
	for (const o of osm) {
		const blob = `${o.kind} ${o.name}`;
		if (!gapKinds.has(o.kind) && !/airfield|airstrip|helipad|heliport|military|barrack|depot|yard|fuel|bunker|checkpoint|tank farm/i.test(blob)) continue;
		if (nearest(o.lat, o.lon, SITES, 5)) continue;
		if (gaps >= 28) break;
		gaps += 1;
		const klass = /port|yard/i.test(blob) ? "maritime" : /fuel|tank|depot|pol/i.test(blob) ? "pol_storage" : /heliport|helipad|airfield|airstrip|strip/i.test(blob) ? "airfield_activity" : /checkpoint|border/i.test(blob) ? "crossing_cue" : "osm_gap";
		const bbox = boxOf(o.lat, o.lon, .04);
		push({
			id: `det-osm-${o.id}`,
			klass,
			title: `${o.name} · OSM ${o.kind} not in archive`,
			body: "Volunteered OSM / OurAirports feature more than 5 km from a catalog pin. Weak label — not a newly found base. Confirm morphology on high-res, then add a report.",
			lat: o.lat,
			lon: o.lon,
			...bbox,
			confidence: 1,
			families: ["morphology"],
			techniques: [
				"weak",
				"buildings",
				"xai"
			],
			explain: explain(["weak", "buildings"]),
			hunts: [...huntsFromKlass(klass), "osm"],
			cloud: "unknown",
			date,
			compareDate
		});
	}
	for (const box of boxes.filter((b) => b.priority === "primary").slice(0, 8)) {
		const hot = firmsIn(firms, box);
		if (hot.length < 3) continue;
		push({
			id: `det-box-${box.id}`,
			klass: "thermal_cluster",
			title: `${box.name} · ${hot.length} non-ag FIRMS`,
			body: "Watch-box thermal density. Agricultural fires are excluded. Still not a strike map — optical follow-up required.",
			lat: (box.south + box.north) / 2,
			lon: (box.west + box.east) / 2,
			west: box.west,
			south: box.south,
			east: box.east,
			north: box.north,
			confidence: 1,
			families: ["thermal"],
			techniques: [
				"chip",
				"fusion",
				"sits",
				"xai"
			],
			explain: explain(["chip", "fusion"]),
			boxId: box.id,
			cloud: "unknown",
			date,
			compareDate
		});
	}
	const listedAir = SITES.filter((s) => s.kind === "airfield" || s.kind === "strip" || s.kind === "port");
	let remote = 0;
	for (const f of flights) {
		if (f.category !== "cargo" && f.category !== "tanker") continue;
		if (nearest(f.lat, f.lon, listedAir, 28)) continue;
		if (remote >= 8) break;
		remote += 1;
		const bbox = boxOf(f.lat, f.lon, .08);
		push({
			id: `det-remote-${f.hex || f.id}`,
			klass: "airfield_activity",
			title: `${f.operator !== "unknown" ? f.operator : f.hex} · cargo-typical over unlisted terrain`,
			body: `${f.typeCode} ${f.category}-typical, ${Math.round(f.altFt ?? 0)} ft. No catalog airfield/strip within 28 km. Possible unlisted strip, overflight, or ADS-B bounce — not a makeshift-base identification, not a weapons claim.`,
			lat: f.lat,
			lon: f.lon,
			...bbox,
			confidence: 1,
			families: ["flight", "morphology"],
			techniques: [
				"fusion",
				"obb",
				"chip",
				"xai"
			],
			explain: explain(["fusion", "obb"]),
			cloud: "unknown",
			date,
			compareDate
		});
	}
	for (const r of SEED_REPORTS) {
		const klass = r.category === "strike-damage" ? "possible_damage" : r.category === "vehicle-buildup" ? "vehicle_park" : r.category === "air-activity" ? "airfield_activity" : r.category === "displacement" ? "camp_grid" : r.category === "control-change" ? "reporting_cue" : isEthChadSite({
			admin1: r.country,
			admin2: r.place,
			lat: r.lat,
			lon: r.lon
		}) ? "irregular_pad" : "reporting_cue";
		const region = ethChadLabel(r.lat, r.lon);
		const hunts = ["wire", ...huntsFromKlass(klass)];
		if (region) hunts.push("irreg");
		const bbox = boxOf(r.lat, r.lon, .05);
		push({
			id: `det-rep-${r.id}`,
			klass,
			title: region ? `${region} · ${r.category} · ${r.place}` : `${r.place} · published ${r.category}`,
			body: `${r.summary} Open report (${r.sourceLabel}, ${r.date}). Observation for review — not a national-army or weapons identification.`,
			lat: r.lat,
			lon: r.lon,
			...bbox,
			confidence: Math.min(r.confidence, 3),
			families: r.category === "strike-damage" ? ["damage", "reporting"] : r.category === "vehicle-buildup" ? ["vehicles", "reporting"] : ["reporting"],
			techniques: [
				"fusion",
				"xai",
				r.category === "strike-damage" ? "damage" : "obb"
			],
			explain: explain(["fusion", "xai"]),
			hunts,
			party: r.party,
			cloud: "unknown",
			date,
			compareDate
		});
	}
	let corridorCargo = 0;
	for (const f of flights) {
		if (f.category !== "cargo" && f.category !== "tanker") continue;
		const region = ethChadLabel(f.lat, f.lon);
		if (!region) continue;
		if (corridorCargo >= 10) break;
		corridorCargo += 1;
		const nearSite = nearest(f.lat, f.lon, SITES, 40);
		const bbox = boxOf(f.lat, f.lon, .07);
		push({
			id: `det-ethchad-air-${f.hex || f.id}`,
			klass: "cargo_yard",
			title: `${region} · cargo-typical in motion · ${f.typeCode}`,
			body: `${f.operator !== "unknown" ? f.operator : f.hex} ${f.category}-typical near ${nearSite ? nearSite.item.name : "no catalog pin"}. ${f.origin} → ${f.dest}. Airframe category is not payload. Not a national-army flight ID.`,
			lat: f.lat,
			lon: f.lon,
			...bbox,
			confidence: 2,
			families: ["flight", "corridor"],
			techniques: [
				"fusion",
				"obb",
				"xai"
			],
			explain: explain(["fusion", "obb"]),
			siteId: nearSite?.item.id,
			cloud: "unknown",
			date,
			compareDate
		});
	}
	for (const box of boxes.filter((b) => /ethiopia|chad/i.test(`${b.region} ${b.name} ${b.notes}`))) {
		const hot = firmsIn(firms, box);
		if (hot.length < 2) continue;
		push({
			id: `det-ethchad-th-${box.id}`,
			klass: "thermal_cluster",
			title: `${box.region} · ${hot.length} non-ag FIRMS · ${box.name}`,
			body: "Thermal density on the Ethiopia / Chad approach. Agricultural fires excluded. Not a strike map and not a national-army ID — optical follow-up required.",
			lat: (box.south + box.north) / 2,
			lon: (box.west + box.east) / 2,
			west: box.west,
			south: box.south,
			east: box.east,
			north: box.north,
			confidence: 1,
			families: ["thermal", "corridor"],
			techniques: [
				"chip",
				"fusion",
				"sits",
				"xai"
			],
			explain: explain(["chip", "fusion"]),
			boxId: box.id,
			cloud: "unknown",
			date,
			compareDate
		});
	}
	const ports = SITES.filter((s) => s.kind === "port");
	let sea = 0;
	for (const v of vessels) {
		if (v.kind === "lane") continue;
		if (sea >= 14) break;
		const near = nearest(v.lat, v.lon, ports, 80);
		sea += 1;
		const bbox = boxOf(v.lat, v.lon, .12);
		push({
			id: `det-sea-${v.id}`,
			klass: "maritime",
			title: `${v.name} · ${v.kind === "ais" ? "AIS-typical" : "port node"} · ${v.flag}`,
			body: `SOG ${v.sog} · ${v.destination || "dest unknown"}. ${near ? `Near ${near.item.name} (${Math.round(near.km)} km).` : "No catalog port within 80 km."} Public track, not a cargo claim.`,
			lat: v.lat,
			lon: v.lon,
			...bbox,
			confidence: 2,
			families: ["corridor"],
			techniques: ["fusion", "xai"],
			explain: explain(["fusion"]),
			hunts: ["sea", "cargo"],
			siteId: near?.item.id,
			cloud: "unknown",
			date,
			compareDate
		});
	}
	let wireN = 0;
	for (const n of news) {
		const hunts = matchHunts(`${n.name} ${n.articles.map((a) => a.title).join(" ")}`);
		if (!hunts.length) continue;
		if (wireN >= 14) break;
		wireN += 1;
		const bbox = boxOf(n.lat, n.lon, .08);
		push({
			id: `det-wire-${n.id}`,
			klass: "reporting_cue",
			title: `${n.name} · ${hunts.map((h) => h.toUpperCase()).join("/")} wire`,
			body: `${n.count} geocoded headline${n.count > 1 ? "s" : ""} at this named place. Keyword cue only — headline pins are centroids, not incident coordinates.`,
			lat: n.lat,
			lon: n.lon,
			...bbox,
			confidence: 1,
			families: ["reporting"],
			techniques: ["fusion", "xai"],
			explain: explain(["fusion"]),
			hunts: ["wire", ...hunts],
			cloud: "unknown",
			date,
			compareDate
		});
	}
	let gd = 0;
	for (const g of gdelt) {
		const hunts = matchHunts(`${g.name} ${g.subtype} ${g.notes} ${g.actor}`);
		if (!hunts.length) continue;
		if (gd >= 10) break;
		gd += 1;
		const bbox = boxOf(g.lat, g.lon, .07);
		push({
			id: `det-gdelt-${g.id}`,
			klass: hunts.includes("bda") ? "possible_damage" : "reporting_cue",
			title: `GDELT · ${g.name}`,
			body: `${g.subtype} · ${g.actor}. ${g.notes} Machine-coded event, not a verified incident.`,
			lat: g.lat,
			lon: g.lon,
			...bbox,
			confidence: 1,
			families: ["reporting"],
			techniques: ["fusion", "xai"],
			explain: explain(["fusion"]),
			hunts: ["wire", ...hunts],
			cloud: "unknown",
			date,
			compareDate
		});
	}
	let night = 0;
	const nightFirms = firms.filter((f) => f.daynight === "N" && f.klass !== "agricultural");
	for (const f of nightFirms) {
		if (night >= 8) break;
		if (f.frp < 8) continue;
		night += 1;
		const bbox = boxOf(f.lat, f.lon, .06);
		push({
			id: `det-night-${f.id}`,
			klass: "thermal_cluster",
			title: `Night FIRMS · FRP ${f.frp.toFixed(0)}`,
			body: "Night-time thermal anomaly. Could be industry, gas flare, burn, or sensor noise. Not a strike. Optical follow-up required.",
			lat: f.lat,
			lon: f.lon,
			...bbox,
			confidence: 1,
			families: ["thermal"],
			techniques: [
				"fusion",
				"spectral",
				"xai"
			],
			explain: explain(["fusion", "spectral"]),
			hunts: ["thrm"],
			cloud: "unknown",
			date,
			compareDate
		});
	}
	let mil = 0;
	for (const f of flights) {
		if (!f.military && f.category !== "tanker") continue;
		if (mil >= 8) break;
		mil += 1;
		const near = nearest(f.lat, f.lon, SITES, 40);
		const bbox = boxOf(f.lat, f.lon, .07);
		push({
			id: `det-mil-${f.hex || f.id}`,
			klass: f.category === "tanker" ? "pol_storage" : "airfield_activity",
			title: `${f.military ? "State/military-typical" : "Tanker-typical"} · ${f.typeCode}`,
			body: `${f.operator !== "unknown" ? f.operator : f.hex} ${f.origin} → ${f.dest}. ${near ? `Near ${near.item.name}.` : "No catalog pin within 40 km."} Type code is not a mission or payload.`,
			lat: f.lat,
			lon: f.lon,
			...bbox,
			confidence: 2,
			families: ["flight"],
			techniques: [
				"fusion",
				"obb",
				"xai"
			],
			explain: explain(["fusion", "obb"]),
			hunts: f.category === "tanker" ? ["pol", "air"] : ["air", "fx"],
			siteId: near?.item.id,
			cloud: "unknown",
			date,
			compareDate
		});
	}
	return hits;
}
async function scoreChip(hit, date, compareDate) {
	const bbox = {
		west: hit.west,
		south: hit.south,
		east: hit.east,
		north: hit.north
	};
	const morph = await loadMorphChip(hit.lat, hit.lon, bbox);
	const after = await loadDatedChip(date, bbox);
	const before = await loadDatedChip(compareDate, bbox);
	const sm = stats(morph.im);
	const sa = stats(after.im);
	const sb = stats(before.im);
	const shape = morphScore(morph.im ?? after.im);
	const cloud = after.im ? cloudClass(sa) : morph.im ? "clear" : "unknown";
	const delta = mad(sb, sa);
	const techniques = [...hit.techniques];
	for (const id of [
		"chip",
		"qa",
		"cloud",
		"coreg",
		"cd",
		"spectral",
		"buildings",
		"obb"
	]) if (!techniques.includes(id)) techniques.push(id);
	let klass = hit.klass;
	let confidence = hit.confidence;
	let families = [...hit.families];
	let hunts = [...hit.hunts];
	const bits = [];
	if (morph.layer !== "none") bits.push(`Morphology chip ${morph.layer}.`);
	if (after.layer !== "none") bits.push(`Dated ${after.layer}.`);
	if (shape.hv >= .55 && shape.edge >= .09 && sm.exg < .07) {
		bits.push(`Linear HV ${shape.hv.toFixed(2)} · edge ${shape.edge.toFixed(2)} — possible berm/earthwork geometry, not a fighting-position ID.`);
		if (klass !== "possible_damage" && klass !== "irregular_pad") klass = "earthwork";
		if (!hunts.includes("berm")) hunts.push("berm");
		if (confidence < 2) confidence = 2;
	}
	if (shape.blobs >= 8 && sm.exg < .08) {
		bits.push(`${shape.blobs} compact bright objects — vehicle-park / apron morphology. Type unresolvable at this grain.`);
		if (klass === "base_compound" || klass === "osm_gap" || klass === "unresolved_objects") klass = "vehicle_park";
		if (!hunts.includes("veh")) hunts.push("veh");
		if (!families.includes("vehicles")) families.push("vehicles");
	}
	if (shape.blobs >= 3 && shape.edge >= .07 && sm.exg < .08) {
		bits.push(`${shape.blobs} compact bright objects · edge ${shape.edge.toFixed(2)} · HV ${shape.hv.toFixed(2)}. Possible pad/yard/compound morphology.`);
		if (!families.includes("morphology")) families.push("morphology");
		if (shape.blobs >= 6 && shape.hv >= .5) {
			if (klass === "airfield_activity" || klass === "osm_gap") klass = hit.klass === "irregular_pad" ? "irregular_pad" : "base_compound";
			if (klass === "unresolved_objects") klass = ethChadLabel(hit.lat, hit.lon) ? "irregular_pad" : "base_compound";
			if (confidence < 2) confidence = 2;
		} else if (shape.blobs >= 4 && sm.exg < .06 && shape.edge >= .08) {
			bits.push("Bright compact objects on low-vegetation ground — possible pad / staging morphology. Not a weapons or smuggling claim.");
			if (klass === "osm_gap" || klass === "unresolved_objects") klass = ethChadLabel(hit.lat, hit.lon) ? "irregular_pad" : "base_compound";
			if (!families.includes("vehicles")) families.push("vehicles");
		}
	} else if (morph.im) bits.push(`Low compact-object count (${shape.blobs}). No pad/yard cue this chip.`);
	if (cloud === "cloudy") bits.push(`Dated chip cloudy/no-data (${Math.round(sa.cloudFrac * 100)}%). Change not scored.`);
	else if (after.layer === "none") bits.push("Dated HLS/VIIRS unreadable this cycle. Morphology from mosaic only.");
	else {
		bits.push(`Cloud ${cloud}. Δ ${delta.toFixed(3)} (RGB MAD).`);
		if (delta >= .11 && !families.includes("morphology")) families.push("morphology");
		if (delta >= .14 && sa.red - sb.red > .04 && sa.exg < sb.exg) {
			klass = "possible_damage";
			if (confidence < 2) confidence = 2;
			if (!families.includes("damage")) families.push("damage");
			bits.push("Redness up, Excess-Green down — possible scrape/scorch. Not a damage class from xView2.");
		} else if (delta >= .12) bits.push("Bitemporal difference above noise. Phenology and roofs also trigger this.");
	}
	bits.push("Observation only — not a base ID, not a weapons or smuggling claim.");
	hunts = [.../* @__PURE__ */ new Set([...hunts, ...huntsFromKlass(klass)])];
	return {
		...hit,
		klass,
		confidence,
		families,
		hunts,
		techniques,
		cloud,
		change: cloud === "cloudy" || cloud === "unknown" || after.layer === "none" ? void 0 : Math.round(delta * 1e3) / 1e3,
		explain: `${hit.explain} ${bits.join(" ")}`.trim(),
		body: `${hit.body} ${bits.join(" ")}`.trim()
	};
}
function pool(items, n, fn) {
	const out = [];
	let i = 0;
	const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
		while (i < items.length) {
			const cur = items[i++];
			if (cur === void 0) break;
			out.push(await fn(cur));
		}
	});
	return Promise.all(workers).then(() => out);
}
/** Blank-tile hunt — not Twitter. Rotates so each cycle looks at a new slice of desert/city. */
var SWEEP_SECTORS = [
	{
		id: "fasher",
		name: "El Fasher ring",
		west: 24.9,
		south: 13.2,
		east: 25.7,
		north: 13.95,
		step: .11,
		mode: "urban"
	},
	{
		id: "nyala",
		name: "Nyala ring",
		west: 24.65,
		south: 11.8,
		east: 25.25,
		north: 12.35,
		step: .1,
		mode: "urban"
	},
	{
		id: "geneina",
		name: "Geneina–Adré",
		west: 21.7,
		south: 13.2,
		east: 22.7,
		north: 13.85,
		step: .12,
		mode: "urban"
	},
	{
		id: "khartoum-out",
		name: "Khartoum outskirts",
		west: 32.15,
		south: 15.25,
		east: 32.9,
		north: 16.05,
		step: .1,
		mode: "urban"
	},
	{
		id: "port-sudan",
		name: "Port Sudan yards",
		west: 36.75,
		south: 19.05,
		east: 37.45,
		north: 19.85,
		step: .12,
		mode: "urban"
	},
	{
		id: "el-obeid",
		name: "El Obeid / Kordofan",
		west: 29.85,
		south: 12.85,
		east: 30.55,
		north: 13.45,
		step: .1,
		mode: "urban"
	},
	{
		id: "kufra-south",
		name: "Kufra south tracks",
		west: 22.7,
		south: 21.4,
		east: 24.3,
		north: 24.35,
		step: .28,
		mode: "desert"
	},
	{
		id: "se-libya-camp",
		name: "SE Libya camp box",
		west: 22,
		south: 21.7,
		east: 23.5,
		north: 22.9,
		step: .12,
		mode: "desert"
	},
	{
		id: "blue-nile",
		name: "Blue Nile / Kurmuk",
		west: 33.85,
		south: 10.15,
		east: 34.55,
		north: 11.05,
		step: .1,
		mode: "desert"
	},
	{
		id: "n-darfur-out",
		name: "N Darfur wadis",
		west: 24.3,
		south: 13,
		east: 26.5,
		north: 14.7,
		step: .22,
		mode: "desert"
	},
	{
		id: "s-darfur-out",
		name: "S Darfur ring",
		west: 24.1,
		south: 11.35,
		east: 25.7,
		north: 12.7,
		step: .18,
		mode: "desert"
	},
	{
		id: "w-kordofan",
		name: "W Kordofan tracks",
		west: 27.1,
		south: 11.1,
		east: 29.9,
		north: 13.3,
		step: .28,
		mode: "desert"
	},
	{
		id: "asosa-menge",
		name: "Asosa / Menge",
		west: 34.15,
		south: 9.85,
		east: 34.95,
		north: 11.25,
		step: .12,
		mode: "desert"
	},
	{
		id: "adre-amd",
		name: "Adré–Amdjarass",
		west: 21.35,
		south: 13.15,
		east: 22.7,
		north: 16.3,
		step: .22,
		mode: "desert"
	},
	{
		id: "dongola",
		name: "Dongola north",
		west: 30.15,
		south: 18.7,
		east: 31.25,
		north: 19.7,
		step: .16,
		mode: "desert"
	},
	{
		id: "white-nile",
		name: "Kosti / Rabak yards",
		west: 32.25,
		south: 12.85,
		east: 32.95,
		north: 13.55,
		step: .12,
		mode: "urban"
	}
];
function cellKey(lat, lon) {
	return `${lat.toFixed(3)}:${lon.toFixed(3)}`;
}
function sweepCells(known) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const sector of SWEEP_SECTORS) for (let lat = sector.south + sector.step / 2; lat < sector.north; lat += sector.step) for (let lon = sector.west + sector.step / 2; lon < sector.east; lon += sector.step) {
		const k = cellKey(lat, lon);
		if (seen.has(k)) continue;
		if (nearest(lat, lon, known, 7)) continue;
		seen.add(k);
		out.push({
			lat,
			lon,
			sector
		});
	}
	const slot = Math.floor(Date.now() / 9e4);
	return out.map((c, i) => ({
		c,
		k: (i * 17 + slot * 13) % 997
	})).sort((a, b) => a.k - b.k).map((x) => x.c);
}
function classifyScan(shape, sm, delta, cloud, mode) {
	if (cloud === "cloudy") return null;
	if (sm.n < 80) return null;
	if (sm.exg > .11) return null;
	const weights = useAppStore.getState().modelWeights ?? DEFAULT_WEIGHTS;
	const pred = predictChip(featuresFromShape(shape, sm, delta), weights);
	if (pred.klass !== "none" && pred.score > .15) {
		if (modelToKlass(pred.klass) === "burn_scar" || pred.klass === "burn") return {
			klass: "burn_scar",
			confidence: 2,
			why: `Chip model (AfriMEOSINT priors + your reviews): burn/scorch cue. Δ ${delta.toFixed(3)} red ${sm.red.toFixed(3)}. Not a strike call.`
		};
		if (pred.klass === "wreck_air") return {
			klass: "wreck_air",
			confidence: 2,
			why: `Chip model: airframe/hangar damage cue. Confirm on Google/Esri. Not a destroyed-aircraft ID.`
		};
		if (pred.klass === "wreck_bldg") return {
			klass: "wreck_bldg",
			confidence: 2,
			why: `Chip model: building scrape/rubble cue. Roofs and phenology also trigger this.`
		};
		if (pred.klass === "camp" && mode === "desert" && shape.blobs >= 4) return {
			klass: "camp_buildup",
			confidence: 2,
			why: `Chip model: camp/staging morphology (${shape.blobs} compact objects, low veg). Makeshift-base candidate for human review — not an RSF/SAF ID.`
		};
	}
	if (mode === "urban") {
		if (delta >= .14 && sm.red > .02) return {
			klass: "burn_scar",
			confidence: 2,
			why: `Urban chip Δ ${delta.toFixed(3)} with redness up — burn/scrape cue, also phenology/roofs.`
		};
		if (delta >= .16 && shape.hv >= .5) return {
			klass: "wreck_bldg",
			confidence: 2,
			why: `Urban scrape geometry with dated change. Building-damage candidate for review.`
		};
		if (shape.blobs >= 8 && shape.hv >= .48 && sm.exg < .08) return {
			klass: "cargo_yard",
			confidence: 2,
			why: `${shape.blobs} compact bright objects + HV ${shape.hv.toFixed(2)} — yard/apron morphology in a city ring.`
		};
		if (shape.hv >= .6 && shape.edge >= .11 && delta >= .1) return {
			klass: "earthwork",
			confidence: 2,
			why: `Rectilinear edges with dated change. Berm/compound cue, not a fighting-position ID.`
		};
		return null;
	}
	if (shape.blobs >= 8 && sm.exg < .07) return {
		klass: "camp_buildup",
		confidence: 2,
		why: `${shape.blobs} compact objects on desert — camp/makeshift-base morphology (AfriMEOSINT SE Libya pattern). Human verify.`
	};
	if (delta >= .13 && sm.exg < .08) return {
		klass: delta >= .16 && sm.red > .02 ? "burn_scar" : "cargo_yard",
		confidence: 2,
		why: `Desert chip Δ ${delta.toFixed(3)}. New bright/scrape relative to compare date — phenology still possible.`
	};
	if (shape.blobs >= 4 && sm.exg < .08 && shape.edge >= .06) return {
		klass: "vehicle_park",
		confidence: 2,
		why: `${shape.blobs} compact bright objects on low-vegetation ground — vehicle-park / staging morphology. Type unresolvable at this grain.`
	};
	if (shape.hv >= .55 && shape.edge >= .09 && sm.exg < .07) return {
		klass: "earthwork",
		confidence: 2,
		why: `Linear HV ${shape.hv.toFixed(2)} · edge ${shape.edge.toFixed(2)} — possible bermed pad/compound.`
	};
	if (shape.blobs >= 4 && shape.edge >= .08 && sm.exg < .07) return {
		klass: "base_compound",
		confidence: 1,
		why: `${shape.blobs} compact objects · edge ${shape.edge.toFixed(2)} — unlisted pad/yard cue.`
	};
	return null;
}
async function scoreScanCell(cell, date, compareDate) {
	const bbox = boxOf(cell.lat, cell.lon, Math.min(cell.sector.step * .45, .05));
	const morph = await loadMorphChip(cell.lat, cell.lon, bbox);
	if (!morph.im) return null;
	const sm = stats(morph.im);
	const shape = morphScore(morph.im);
	if (!(cell.sector.mode === "desert" ? shape.blobs >= 3 || shape.hv >= .5 || shape.edge >= .1 : shape.blobs >= 6 || shape.hv >= .55 || shape.edge >= .12) || sm.exg > .12) return null;
	let delta = 0;
	let cloud = "clear";
	let datedLayer = "none";
	if (cell.sector.mode === "desert") {
		const after = await loadDatedChip(date, bbox);
		const before = await loadDatedChip(compareDate, bbox);
		const sa = stats(after.im);
		const sb = stats(before.im);
		cloud = after.im ? cloudClass(sa) : "clear";
		delta = mad(sb, sa);
		datedLayer = after.layer;
	}
	const labelLat = cell.lat;
	const labelLon = cell.lon;
	const found = (() => {
		const raw = classifyScan(shape, sm, delta, cloud, cell.sector.mode);
		if (!raw) return null;
		if (ethChadLabel(labelLat, labelLon) && (raw.klass === "base_compound" || raw.klass === "vehicle_park")) return {
			...raw,
			klass: "irregular_pad"
		};
		return raw;
	})();
	if (!found) return null;
	const hunts = huntsFromKlass(found.klass);
	if (ethChadLabel(cell.lat, cell.lon) && !hunts.includes("irreg")) hunts.push("irreg");
	const meta = DETECT_KLASS[found.klass];
	return {
		id: `det-scan-${cell.sector.id}-${cellKey(cell.lat, cell.lon).replace(":", "-")}`,
		klass: found.klass,
		title: `Tile find · ${meta.short} · ${cell.sector.name}`,
		body: `Blank-tile sweep of ${cell.sector.name} (not a Twitter pin). ${found.why} Observation only — not a base, weapons, or occupancy ID.`,
		lat: cell.lat,
		lon: cell.lon,
		...bbox,
		confidence: found.confidence,
		families: found.klass === "possible_damage" ? ["morphology", "damage"] : ["morphology"],
		techniques: [
			"chip",
			"obb",
			"cd",
			"spectral",
			"xai"
		],
		explain: `${found.why} Chip ${morph.layer}${datedLayer !== "none" ? ` · dated ${datedLayer}` : ""}.`,
		hunts,
		cloud,
		change: datedLayer === "none" || cloud === "cloudy" || cloud === "unknown" ? void 0 : Math.round(delta * 1e3) / 1e3,
		date,
		compareDate,
		features: featuresFromShape(shape, sm, delta)
	};
}
async function sweepTiles(args) {
	const cells = sweepCells(args.known).slice(0, 20);
	const hits = (await pool(cells, 6, (c) => scoreScanCell(c, args.date, args.compareDate))).filter((h) => h != null);
	return {
		tried: cells.length,
		hits
	};
}
async function runDetect(args) {
	const fused = fuseDetect(args);
	const empty = {
		ranAt: (/* @__PURE__ */ new Date()).toISOString(),
		opticalTried: 0,
		opticalOk: 0,
		gridTried: 0,
		gridHits: 0
	};
	if (!args.optical) return {
		hits: fused,
		...empty,
		note: "Fusion-only this pass. Tile sweep runs when DET stays on."
	};
	const rank = (h) => (h.id.startsWith("det-scan-") ? 20 : 0) + (h.id.startsWith("det-rep-") ? 8 : 0) + (h.hunts.includes("wire") ? 4 : 0) + (h.hunts.includes("rsf") || h.hunts.includes("chain") ? 6 : 0) + h.families.length * 3 + h.hunts.length * 2 + (h.klass === "possible_damage" ? 6 : 0) + (h.klass === "irregular_pad" ? 6 : 0) + (h.klass === "cargo_yard" || h.klass === "maritime" || h.klass === "vehicle_park" ? 5 : 0) + (h.klass === "earthwork" || h.klass === "pol_storage" ? 4 : 0) + (h.klass === "airfield_activity" ? 2 : 0) + h.confidence;
	const known = [
		...SITES.map((s) => ({
			lat: s.lat,
			lon: s.lon
		})),
		...SEED_REPORTS.map((r) => ({
			lat: r.lat,
			lon: r.lon
		})),
		...fused.map((h) => ({
			lat: h.lat,
			lon: h.lon
		}))
	];
	const pinTop = [...fused].sort((a, b) => rank(b) - rank(a)).slice(0, 18);
	const [scoredPins, grid] = await Promise.all([pool(pinTop, 4, (h) => scoreChip(h, args.date, args.compareDate)), sweepTiles({
		known,
		date: args.date,
		compareDate: args.compareDate
	})]);
	const pinOk = scoredPins.filter((h) => h.cloud !== "unknown").length;
	const byId = new Map(scoredPins.map((h) => [h.id, h]));
	const pinHits = fused.map((h) => byId.get(h.id) ?? h);
	return {
		hits: [...grid.hits, ...pinHits],
		ranAt: (/* @__PURE__ */ new Date()).toISOString(),
		opticalTried: pinTop.length + grid.tried,
		opticalOk: pinOk + grid.hits.filter((h) => h.cloud !== "unknown").length,
		gridTried: grid.tried,
		gridHits: grid.hits.length,
		note: `Imagery sweep (not Twitter): ${grid.tried} blank tiles this cycle, ${grid.hits.length} unknown morphology flags. ${pinOk}/${pinTop.length} known pins also chipped. 10–30 m public tiles — pads/yards/change cues, not IDs.`
	};
}
var UAE = {
	west: 51.35,
	south: 22.45,
	east: 56.65,
	north: 26.55
};
var AFRICA = {
	west: -18,
	south: -35,
	east: 51.55,
	north: 37.6
};
var UAE_ICAO = /\b(OMDB|OMAA|OMSJ|OMDW|OMFJ|OMAL|OMRK|OMAD|OMAM|OMDM|OMF J)\b/i;
var UAE_PLACE = /dubai|abu dhabi|sharjah|fujairah|al dhafra|minhad|jebel ali|al ain|ras al khaimah|al bateen|uae fir/i;
var UAE_OP = /\b(ETD|UAE|FDB|DUBAI|AUH|ADNOC|EMIRATES|FLYDUBAI|ETIHAD|WIZZ)\b/i;
var AFRICA_PLACE = /\b(HS[A-Z]{2}|HECA|HLLT|HSSS|HAAB|HCMM|HKJK|HTDA|FTTJ|port sudan|khartoum|nyala|asosa|kufra|ndjamena|asmara|djibouti|berbera|mogadishu|addis|cairo|tripoli|benghazi|nairobi|sudan|chad|ethiopia|somalia|eritrea|libya|egypt|kenya|horn)\b/i;
function inUae(lat, lon) {
	return lon >= UAE.west && lon <= UAE.east && lat >= UAE.south && lat <= UAE.north;
}
function inAfrica(lat, lon) {
	if (inUae(lat, lon)) return false;
	return lon >= AFRICA.west && lon <= AFRICA.east && lat >= AFRICA.south && lat <= AFRICA.north;
}
function headingOffUae(track) {
	if (track == null) return false;
	const t = (track % 360 + 360) % 360;
	return t >= 170 && t <= 310;
}
function uaeLinkedFlight(f) {
	const blob = `${f.origin} ${f.dest} ${f.operator} ${f.reg} ${f.nearestAirfield} ${f.notes}`;
	if (/^A6-/i.test(f.reg)) return `UAE registry ${f.reg}`;
	if (UAE_ICAO.test(blob) || UAE_PLACE.test(blob) || UAE_OP.test(blob)) return "UAE ICAO / operator / airfield";
	if (inUae(f.lat, f.lon)) return "position in UAE FIR";
	return null;
}
function africaBoundFlight(f, whyUae) {
	const blob = `${f.origin} ${f.dest} ${f.nearestAirfield} ${f.notes}`;
	if (AFRICA_PLACE.test(blob) || AFRICA_PLACE.test(f.dest)) return `Africa-named dest ${f.dest}`;
	if (inAfrica(f.lat, f.lon)) return "position over African airspace";
	if (whyUae && headingOffUae(f.track)) return `UAE FIR, track ${Math.round(f.track ?? 0)}° toward the west/southwest`;
	if (inUae(f.lat, f.lon) && headingOffUae(f.track)) return "departing UAE on a west/southwest heading";
	return null;
}
function uaeLinkedVessel(v) {
	const blob = `${v.name} ${v.destination} ${v.notes} ${v.flag}`;
	if (/jebel ali|fujairah|uae|aejal|aefjr|dubai/i.test(blob)) return "UAE port / lane";
	if (v.flag.toLowerCase() === "are" || /united arab|uae/i.test(v.flag)) return `flag ${v.flag}`;
	if (inUae(v.lat, v.lon)) return "position in UAE waters";
	if (v.id.includes("uae-africa")) return "documented UAE–Horn / Red Sea corridor marker";
	return null;
}
function africaBoundVessel(v) {
	const blob = `${v.name} ${v.destination} ${v.notes}`;
	if (AFRICA_PLACE.test(blob) || /red sea|aden|port sudan|suakin|assab|berbera|suez/i.test(blob)) return `dest ${v.destination}`;
	if (inAfrica(v.lat, v.lon)) return "position on African / Red Sea approaches";
	if (v.id.includes("uae-africa") || v.id.includes("lane-red-sea") || v.id.includes("lane-aden")) return "UAE–Africa documented lane";
	return null;
}
function scanFuae(flights, vessels, now = (/* @__PURE__ */ new Date()).toISOString()) {
	const out = [];
	for (const f of flights) {
		const whyUae = uaeLinkedFlight(f);
		if (!whyUae) continue;
		const whyAf = africaBoundFlight(f, whyUae);
		if (!whyAf) continue;
		const cat = f.category === "cargo" || f.category === "tanker" ? "cargo-typical airframe" : f.category;
		out.push({
			id: `fuae-air-${f.hex || f.id}`,
			kind: "air",
			title: `${f.operator !== "unknown" ? f.operator : f.hex} · ${f.typeCode}`,
			body: `${cat}. ${whyUae}. ${whyAf}. Public ADS-B state vector — not a cargo, payload, or transfer claim. Human review required.`,
			lat: f.lat,
			lon: f.lon,
			firstSeen: f.firstSeen,
			lastSeen: f.lastSeen || now,
			origin: f.origin,
			dest: f.dest,
			tag: cat,
			why: `${whyUae} · ${whyAf}`,
			live: !!f.live,
			hex: f.hex
		});
	}
	let laneOnce = false;
	for (const v of vessels) {
		if (v.kind === "lane") {
			if (laneOnce || !/uae-africa|red-sea|aden/.test(v.id)) continue;
			laneOnce = true;
		}
		const whyUae = uaeLinkedVessel(v);
		if (!whyUae) continue;
		const whyAf = africaBoundVessel(v);
		if (!whyAf) continue;
		out.push({
			id: `fuae-sea-${v.id}`,
			kind: "sea",
			title: v.name,
			body: `${v.kind === "lane" ? "Documented corridor marker — not live AIS." : "Port / AIS node."} ${whyUae}. ${whyAf}. Not a cargo claim.`,
			lat: v.lat,
			lon: v.lon,
			firstSeen: now,
			lastSeen: now,
			origin: whyUae,
			dest: v.destination,
			tag: v.kind,
			why: `${whyUae} · ${whyAf}`,
			live: v.live
		});
	}
	return out;
}
/** Archive contacts so the tab is not empty when live ADS-B is a coverage gap. */
function seedFuae() {
	return scanFuae(FLIGHTS, VESSEL_SEED);
}
var THEATERS = [
	{
		id: "sdn",
		iso: "SD",
		label: "Sudan",
		short: "SDN",
		west: 21.8,
		south: 9.4,
		east: 38.6,
		north: 22.8,
		zoom: 5.2,
		notes: "Primary wing. Bases, yards, camps, crossings, 2022–2026 archive.",
		jumps: [
			{
				id: "hsss",
				label: "Khartoum"
			},
			{
				id: "wad-madani",
				label: "Wad Madani"
			},
			{
				id: "hsfs",
				label: "El Fasher"
			},
			{
				id: "hspn",
				label: "Port Sudan"
			},
			{
				id: "hsnn",
				label: "Nyala"
			},
			{
				id: "hsgn",
				label: "Geneina"
			}
		]
	},
	{
		id: "egy",
		iso: "EG",
		label: "Egypt",
		short: "EGY",
		west: 29.6,
		south: 21.7,
		east: 36.2,
		north: 31.8,
		zoom: 5.4,
		notes: "Nile rear, Aswan, Berenice/Ras Banas, Suez approaches.",
		jumps: [
			{
				id: "heaw",
				label: "Aswan"
			},
			{
				id: "hebn",
				label: "Berenice"
			},
			{
				id: "hesz",
				label: "Suez"
			},
			{
				id: "heps",
				label: "Port Said"
			},
			{
				id: "argeen",
				label: "Argeen"
			}
		]
	},
	{
		id: "eth",
		iso: "ET",
		label: "Ethiopia",
		short: "ETH",
		west: 33,
		south: 8.6,
		east: 42.2,
		north: 14.9,
		zoom: 5.6,
		notes: "Blue Nile / Benishangul approaches, Asosa, Metema, Humera.",
		jumps: [
			{
				id: "haso",
				label: "Asosa"
			},
			{
				id: "menge",
				label: "Menge"
			},
			{
				id: "habd",
				label: "Bahir Dar"
			},
			{
				id: "hang",
				label: "Gondar"
			},
			{
				id: "metema",
				label: "Metema"
			},
			{
				id: "humera",
				label: "Humera"
			}
		]
	},
	{
		id: "som",
		iso: "SO",
		label: "Somalia",
		short: "SOM",
		west: 41,
		south: -1.6,
		east: 51.4,
		north: 12.2,
		zoom: 5.1,
		notes: "Berbera, Bosaso, Mogadishu, Kismayo — public port and airfield context.",
		jumps: [
			{
				id: "hcmh",
				label: "Mogadishu"
			},
			{
				id: "hcmb",
				label: "Berbera"
			},
			{
				id: "hcms",
				label: "Bosaso"
			},
			{
				id: "hcmk",
				label: "Kismayo"
			}
		]
	},
	{
		id: "tcd",
		iso: "TD",
		label: "Chad",
		short: "TCD",
		west: 13.4,
		south: 11.4,
		east: 24,
		north: 23,
		zoom: 5.3,
		notes: "Adré, Tine, Abéché, N'Djamena. Humanitarian traffic is the civilian baseline.",
		jumps: [
			{
				id: "fttj",
				label: "N'Djamena"
			},
			{
				id: "ftty",
				label: "Abéché"
			},
			{
				id: "adre",
				label: "Adré"
			},
			{
				id: "amdjarass",
				label: "Amdjarass"
			},
			{
				id: "tine",
				label: "Tine"
			},
			{
				id: "faya",
				label: "Faya"
			}
		]
	},
	{
		id: "lby",
		iso: "LY",
		label: "Libya",
		short: "LBY",
		west: 12.8,
		south: 19.6,
		east: 25.4,
		north: 33,
		zoom: 5,
		notes: "Kufra, Jufra, Benghazi, Tobruk. Desert tracks, not occupancy.",
		jumps: [
			{
				id: "kufra",
				label: "Kufra"
			},
			{
				id: "hlba",
				label: "Benghazi"
			},
			{
				id: "hltq",
				label: "Tobruk"
			},
			{
				id: "khadim",
				label: "Al Khadim"
			},
			{
				id: "brak",
				label: "Brak"
			}
		]
	},
	{
		id: "are",
		iso: "AE",
		label: "UAE",
		short: "ARE",
		west: 51.4,
		south: 22.4,
		east: 56.6,
		north: 26.5,
		zoom: 7.1,
		notes: "Al Dhafra, Minhad, Jebel Ali, Fujairah. Public air/port nodes only.",
		jumps: [
			{
				id: "omam",
				label: "Al Dhafra"
			},
			{
				id: "omdw",
				label: "Minhad"
			},
			{
				id: "jebel-ali",
				label: "Jebel Ali"
			},
			{
				id: "fujairah",
				label: "Fujairah"
			},
			{
				id: "omad",
				label: "Al Bateen"
			}
		]
	},
	{
		id: "eri",
		iso: "ER",
		label: "Eritrea",
		short: "ERI",
		west: 36.4,
		south: 12.3,
		east: 43.4,
		north: 18.1,
		zoom: 6.2,
		notes: "Assab / Massawa corridor. Included because it sits on the UAE–Red Sea chain.",
		jumps: [{
			id: "hhas",
			label: "Assab"
		}, {
			id: "hham",
			label: "Massawa"
		}]
	},
	{
		id: "red",
		iso: "RS",
		label: "Red Sea",
		short: "RED",
		west: 32,
		south: 10,
		east: 45.2,
		north: 32,
		zoom: 4.6,
		notes: "Suez–Port Sudan–Assab–Bab el-Mandeb maritime picture.",
		jumps: [
			{
				id: "hesz",
				label: "Suez"
			},
			{
				id: "hspn",
				label: "Port Sudan"
			},
			{
				id: "hhas",
				label: "Assab"
			},
			{
				id: "hddd",
				label: "Djibouti"
			}
		]
	},
	{
		id: "all",
		iso: "TH",
		label: "Full theater",
		short: "ALL",
		west: 9.5,
		south: -1.2,
		east: 57,
		north: 32.8,
		zoom: 3.7,
		notes: "Sudan wing plus adjacent states named in open reporting on this conflict.",
		jumps: []
	}
];
var THEATER_BY_ID = Object.fromEntries(THEATERS.map((t) => [t.id, t]));
var CORRIDORS = [
	{
		id: "red-sea",
		name: "Red Sea maritime",
		notes: "Approximate Suez–Port Sudan–Assab–Bab el-Mandeb lane. Not live AIS.",
		coordinates: [
			[32.31, 31.26],
			[32.55, 29.96],
			[37.22, 19.62],
			[42.65, 13.07],
			[43.33, 12.58],
			[44.94, 10.39]
		]
	},
	{
		id: "libya-darfur",
		name: "Kufra–Darfur desert",
		notes: "Publicly reported desert-track geometry. Absence of a pin is not absence of traffic.",
		coordinates: [
			[23.31, 24.18],
			[21.83, 21.7],
			[25.35, 16.5],
			[25.35, 13.63]
		]
	},
	{
		id: "chad-darfur",
		name: "Chad–West Darfur",
		notes: "N'Djamena–Abéché–Adré–Geneina. Humanitarian baseline on the Chadian side.",
		coordinates: [
			[15.03, 12.13],
			[20.84, 13.85],
			[22.2, 13.47],
			[22.45, 13.45]
		]
	},
	{
		id: "uae-horn",
		name: "UAE–Horn reporting",
		notes: "Jebel Ali / Dhafra to Assab / Port Sudan as reported in open sources. Not a cargo claim.",
		coordinates: [
			[54.65, 24.43],
			[55.06, 24.99],
			[42.65, 13.07],
			[37.22, 19.62]
		]
	},
	{
		id: "ethiopia-blue-nile",
		name: "Blue Nile–Asosa",
		notes: "Kurmuk / Asosa / Menge approaches.",
		coordinates: [
			[34.36, 11.79],
			[34.28, 10.55],
			[34.59, 10.02]
		]
	}
];
/** Yard-scale inspect zoom by morphology. z11 is theater — too wide to verify a chip. */
var INSPECT_ZOOM = {
	wreck_air: 17,
	wreck_bldg: 16.7,
	camp_buildup: 15.7,
	camp_grid: 15.5,
	irregular_pad: 16,
	vehicle_park: 16.4,
	cargo_yard: 16.1,
	earthwork: 15.6,
	pol_storage: 15.4,
	possible_damage: 16,
	burn_scar: 14.6,
	airfield_activity: 14.8,
	base_compound: 15.2,
	thermal_cluster: 12.8,
	unresolved_objects: 15.6,
	osm_gap: 14.2,
	crossing_cue: 15,
	maritime: 12.2,
	corridor_track: 11.2,
	reporting_cue: 13.6
};
function inspectZoomForKlass(klass, type) {
	if (klass && INSPECT_ZOOM[klass] != null) return INSPECT_ZOOM[klass];
	if (type === "damage") return 16;
	if (type === "convoy") return 16.2;
	if (type === "flight") return 13.8;
	return 15.4;
}
function padBbox(west, south, east, north, minDeg = .018) {
	const dlat = Math.max(minDeg, north - south);
	const dlon = Math.max(minDeg, east - west);
	const cy = (south + north) / 2;
	const cx = (west + east) / 2;
	return {
		west: cx - dlon / 2,
		south: cy - dlat / 2,
		east: cx + dlon / 2,
		north: cy + dlat / 2
	};
}
function inspectFromHit(hit) {
	const zoom = inspectZoomForKlass(hit.klass);
	const dlat = Math.abs(hit.north - hit.south);
	const dlon = Math.abs(hit.east - hit.west);
	if (!(dlat > 0 && dlon > 0 && dlat < .035 && dlon < .035)) return {
		lat: hit.lat,
		lon: hit.lon,
		zoom,
		label: hit.title,
		inspect: true
	};
	const box = padBbox(hit.west, hit.south, hit.east, hit.north);
	return {
		lat: hit.lat,
		lon: hit.lon,
		zoom,
		label: hit.title,
		...box,
		inspect: true
	};
}
function inspectFromFlag(f) {
	const zoom = inspectZoomForKlass(f.klass, f.type);
	const dlat = f.north != null && f.south != null ? Math.abs(f.north - f.south) : 99;
	const dlon = f.east != null && f.west != null ? Math.abs(f.east - f.west) : 99;
	if (!(dlat < .035 && dlon < .035)) return {
		lat: f.lat,
		lon: f.lon,
		zoom,
		label: f.title,
		inspect: true
	};
	const box = padBbox(f.west, f.south, f.east, f.north);
	return {
		lat: f.lat,
		lon: f.lon,
		zoom,
		label: f.title,
		...box,
		inspect: true
	};
}
function clamp01(n) {
	return Math.max(0, Math.min(1, n));
}
function signalCoincidence(args) {
	const cargo = args.flights.filter((f) => /il-76|a124|c-17|c-130|an-12|an-26|l-100|il76/i.test(`${f.typeCode} ${f.notes} ${f.category}`)).length;
	const airlift = clamp01(cargo / 6);
	const tankerish = args.flights.filter((f) => /kc-|tanker|a330|k35/i.test(`${f.typeCode} ${f.notes}`)).length;
	const tanker = clamp01(tankerish / 3);
	const hot = args.firms.filter((t) => (t.frp ?? 0) >= 15 && t.klass !== "agricultural").length;
	const thermal = clamp01(hot / 18);
	const gdelt = clamp01(args.gdelt.length / 40);
	const news = clamp01(args.news / 50);
	const fuaeAir = args.fuae.filter((r) => r.kind === "air").length;
	const fuaeSea = args.fuae.filter((r) => r.kind === "sea").length;
	const bridge = clamp01((fuaeAir + fuaeSea * .15) / 8);
	const live = clamp01(args.flights.filter((f) => f.live).length / 24);
	const parts = [
		{
			id: "airlift",
			label: "Cargo-typical ADS-B",
			value: airlift,
			note: `${cargo} cargo-typical airframes in the live slice`
		},
		{
			id: "tanker",
			label: "Tanker-typical ADS-B",
			value: tanker,
			note: `${tankerish} tanker-typical tracks`
		},
		{
			id: "thermal",
			label: "Hot FIRMS (non-ag)",
			value: thermal,
			note: `${hot} points FRP ≥ 15, agricultural excluded`
		},
		{
			id: "gdelt",
			label: "GDELT events",
			value: gdelt,
			note: `${args.gdelt.length} forwarded events`
		},
		{
			id: "news",
			label: "Headline volume",
			value: news,
			note: `${args.news} headlines this cycle`
		},
		{
			id: "fuae",
			label: "UAE→Africa tracks",
			value: bridge,
			note: `${fuaeAir} air / ${fuaeSea} sea in FUAE log`
		},
		{
			id: "live",
			label: "Live ADS-B density",
			value: live,
			note: `${args.flights.filter((f) => f.live).length} live contacts`
		}
	];
	const score = Math.round(100 * (.22 * airlift + .08 * tanker + .18 * thermal + .14 * gdelt + .12 * news + .18 * bridge + .08 * live));
	return {
		score,
		level: score >= 62 ? "clustered" : score >= 42 ? "busy" : score >= 22 ? "stir" : "quiet",
		parts,
		asOf: (/* @__PURE__ */ new Date()).toISOString()
	};
}
var VISTA = {
	type: "FeatureCollection",
	name: "Sudan control map (copied from Vista)",
	description: "Public Google My Map titled in Arabic “Sudan control map (copied from Vista)”. Source note: “Not my map — it is Ra'ad's map; I update it until he returns.” Third-party compiled control. Not a live frontline. Not occupancy. Not targeting.",
	attribution: "Copied Vista / Ra'ad Google My Map (public). English labels by this workbench. Original Arabic retained in nameAr.",
	url: "https://www.google.com/maps/d/viewer?mid=1UXXzhOzKQrp4agyVlCSP6MMhCCj9zvY",
	asOf: "unknown — source does not date the layer",
	features: [
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-01",
				"kind": "division",
				"layer": "divisions",
				"name": "1st Infantry Division HQ",
				"nameAr": "قيادة الفرقة الأولى مشاة",
				"place": "Wad Madani area",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [33.53217, 14.39881]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-02",
				"kind": "division",
				"layer": "divisions",
				"name": "2nd Infantry Division HQ",
				"nameAr": "قيادة الفرقة الثانية مشاة",
				"place": "Gedaref area",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [35.343, 13.95972]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-03",
				"kind": "division",
				"layer": "divisions",
				"name": "3rd Infantry Division HQ — Shendi",
				"nameAr": "قيادة الفرقة الثالثة مشاة-شندي",
				"place": "Shendi",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [33.4427, 16.70679]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-04",
				"kind": "division",
				"layer": "divisions",
				"name": "4th Infantry Division",
				"nameAr": "الفرقة الرابعة مشاة",
				"place": "Blue Nile / Damazine area",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [34.3609, 11.80483]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-05",
				"kind": "division",
				"layer": "divisions",
				"name": "5th Infantry Division HQ (Camel Corps) — El Obeid",
				"nameAr": "قيادة الفرقة الخامسة مشاة (الهجانة)-الابيض",
				"place": "El Obeid",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [30.22379, 13.17797]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-06",
				"kind": "division",
				"layer": "divisions",
				"name": "7th Infantry Division HQ",
				"nameAr": "قيادة الفرقة السابعة مشاة",
				"place": "Khartoum area",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [32.54628, 15.60861]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-07",
				"kind": "division",
				"layer": "divisions",
				"name": "9th Airborne Division HQ — approximate",
				"nameAr": "قيادة الفرقة التاسعة المحمولة جواً-موقع تقريبي.",
				"place": "Omdurman / Khartoum North area",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [32.48845, 15.83089]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-08",
				"kind": "division",
				"layer": "divisions",
				"name": "10th Infantry Division HQ — Abu Jubeiha",
				"nameAr": "قيادة الفرقة العاشرة مشاة-ابو جبيهة",
				"place": "Abu Jubeiha",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [31.24752, 11.44453]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-09",
				"kind": "division",
				"layer": "divisions",
				"name": "11th Infantry Division HQ — Khashm el Girba",
				"nameAr": "قيادة الفرقة 11 مشاة-خشم القربة",
				"place": "Khashm el Girba",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [35.90279, 14.95086]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-10",
				"kind": "division",
				"layer": "divisions",
				"name": "12th Infantry Division HQ — Sinkat",
				"nameAr": "قيادة الفرقة 12 مشاة-سنكات",
				"place": "Sinkat",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [36.78195, 18.9391]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-11",
				"kind": "division",
				"layer": "divisions",
				"name": "14th Infantry Division HQ — Kadugli",
				"nameAr": "قيادة الفرقة 14 مشاة-كادوقلي",
				"place": "Kadugli",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [29.72613, 10.98878]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-12",
				"kind": "division",
				"layer": "divisions",
				"name": "17th Infantry Division HQ — Singa",
				"nameAr": "قيادة الفرقة 17 مشاة-سنجة",
				"place": "Singa",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [33.92576, 13.15439]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-13",
				"kind": "division",
				"layer": "divisions",
				"name": "18th Infantry Division HQ — Kosti",
				"nameAr": "قيادة الفرقة 18 مشاة-كوستي",
				"place": "Kosti",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [32.59403, 13.14754]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-14",
				"kind": "division",
				"layer": "divisions",
				"name": "19th Infantry Division",
				"nameAr": "الفرقة 19 مشاة",
				"place": "Northern State / Dongola area",
				"party": "saf",
				"note": "Green pin on source map — treated as SAF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [31.87398, 18.506]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-15",
				"kind": "division",
				"layer": "divisions",
				"name": "6th Infantry Division",
				"nameAr": "الفرقة السادسة مشاة",
				"place": "El Fasher area",
				"party": "rsf",
				"note": "Amber pin on source map — treated as RSF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [25.34815, 13.62766]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-16",
				"kind": "division",
				"layer": "divisions",
				"name": "15th Infantry Division HQ — Geneina",
				"nameAr": "قيادة الفرقة 15 مشاة",
				"place": "Geneina",
				"party": "rsf",
				"note": "Source note: 15th Infantry Division HQ and all of Geneina reported fallen to RSF-labeled forces on 4 Nov 2023. Observation from the copied Vista map — not a confirmation of current occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [22.44142, 13.44774]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-17",
				"kind": "division",
				"layer": "divisions",
				"name": "16th Infantry Division HQ",
				"nameAr": "قيادة الفرقة 16 - مشاة",
				"place": "Nyala area",
				"party": "rsf",
				"note": "Amber pin on source map — treated as RSF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [24.873, 12.04896]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-18",
				"kind": "division",
				"layer": "divisions",
				"name": "20th Infantry Division",
				"nameAr": "الفرقة 20 مشاة",
				"place": "South Darfur / Reika area",
				"party": "rsf",
				"note": "Amber pin on source map — treated as RSF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [26.11042, 11.39902]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-19",
				"kind": "division",
				"layer": "divisions",
				"name": "21st Infantry Division HQ",
				"nameAr": "قيادة الفرقة 21 - مشاة",
				"place": "Zalingei / Central Darfur area",
				"party": "rsf",
				"note": "Amber pin on source map — treated as RSF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [23.4602, 12.89845]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-div-20",
				"kind": "division",
				"layer": "divisions",
				"name": "22nd Infantry Division HQ — Babanusa",
				"nameAr": "قيادة الفرقة 22 مشاة -بابنوسة",
				"place": "Babanusa",
				"party": "rsf",
				"note": "Amber pin on source map — treated as RSF-held in the Vista copy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)"
			},
			"geometry": {
				"type": "Point",
				"coordinates": [27.79772, 11.31521]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-01",
				"kind": "zone",
				"layer": "control",
				"name": "Disputed area — Halaib Triangle",
				"nameAr": "مناطق متنازع عليها",
				"faction": "disputed",
				"color": "#9aa0a6",
				"note": "Halaib / Shalateen triangle. Sudan cites 1902 colonial administration; Egypt cites the 1899 political boundary. Disputed — not a wartime control claim in this war.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 5
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[33.17245, 21.99478],
					[33.55971, 21.7233],
					[34.00329, 21.77177],
					[34.08625, 22.00898],
					[33.17245, 21.99478]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-02",
				"kind": "zone",
				"layer": "control",
				"name": "Disputed area — Abyei",
				"nameAr": "منطقة متنازع عليها",
				"faction": "disputed",
				"color": "#9aa0a6",
				"note": "Abyei: disputed between Sudan and South Sudan; oil and grazing. Not a SAF/RSF wartime front in this map.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 12
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[27.81826, 10.17219],
					[27.8222, 9.8007],
					[27.89748, 9.61592],
					[28.04146, 9.34772],
					[28.74733, 9.34501],
					[28.7336, 9.40192],
					[28.78579, 9.46424],
					[28.78579, 9.49404],
					[29.00277, 9.67549],
					[29.01849, 9.72911],
					[29.00294, 10.17823],
					[27.81826, 10.17219]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-03",
				"kind": "zone",
				"layer": "control",
				"name": "SPLM-N (Abdelaziz al-Hilu)",
				"nameAr": "قوات الحركة الشعبية-بقيادة عبد العزيز الحلو",
				"faction": "splm",
				"color": "#007276",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 15
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[31.48997, 10.48133],
					[31.55318, 10.51614],
					[31.58344, 10.57794],
					[31.53818, 10.65251],
					[31.47642, 10.68388],
					[31.39324, 10.65505],
					[31.29537, 10.60553],
					[31.1778, 10.54025],
					[31.11217, 10.50355],
					[31.07951, 10.43713],
					[31.09255, 10.36801],
					[31.14677, 10.3097],
					[31.24004, 10.34259],
					[31.35537, 10.40088],
					[31.48997, 10.48133]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-04",
				"kind": "zone",
				"layer": "control",
				"name": "SLM (Abdel Wahid al-Nur)",
				"nameAr": "حركة تحرير السودان - عبد الواحد نور",
				"faction": "slm",
				"color": "#7aa3d4",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 8
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[23.94145, 12.65166],
					[24.82928, 12.64496],
					[24.8569, 13.34367],
					[24.99186, 13.36844],
					[24.9982, 13.55448],
					[24.51755, 13.57184],
					[23.93802, 13.14963],
					[23.94145, 12.65166]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-05",
				"kind": "zone",
				"layer": "control",
				"name": "RSF (source label) — pocket 1",
				"nameAr": "RSF",
				"faction": "rsf",
				"color": "#c9a227",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 23
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[25.00136, 20.53123],
					[25.00016, 19.99964],
					[24.00006, 19.9998],
					[23.9995, 19.50071],
					[26.04553, 20.03929],
					[26.13879, 22.01324],
					[24.99926, 22.00072],
					[24.63163, 22.25999],
					[24.29494, 22.29234],
					[24.19974, 22.80338],
					[23.78341, 22.89725],
					[23.36309, 24.04722],
					[23.34433, 24.20424],
					[23.3186, 24.2097],
					[23.29099, 24.15053],
					[23.2827, 24.08366],
					[23.29848, 23.82948],
					[23.49046, 22.39902],
					[23.7846, 22.37386],
					[23.86245, 21.77523],
					[24.27505, 21.73363],
					[24.43407, 20.5729],
					[25.00136, 20.53123]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-06",
				"kind": "zone",
				"layer": "control",
				"name": "RSF (source label) — pocket 2",
				"nameAr": "RSF",
				"faction": "rsf",
				"color": "#c9a227",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 88
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[34.76294, 10.75598],
					[34.77707, 10.7562],
					[34.79208, 10.75607],
					[34.79481, 10.7537],
					[34.7935, 10.75069],
					[34.79093, 10.74803],
					[34.79035, 10.74422],
					[34.79153, 10.7435],
					[34.79177, 10.74119],
					[34.79115, 10.73958],
					[34.79018, 10.73994],
					[34.78922, 10.7403],
					[34.78885, 10.73971],
					[34.78941, 10.73592],
					[34.78945, 10.73303],
					[34.7905, 10.732],
					[34.79168, 10.73122],
					[34.79181, 10.73044],
					[34.79077, 10.72729],
					[34.79084, 10.72531],
					[34.79002, 10.72339],
					[34.78837, 10.72246],
					[34.78715, 10.72145],
					[34.7856, 10.72109],
					[34.78488, 10.72054],
					[34.78355, 10.71919],
					[34.78123, 10.71885],
					[34.78054, 10.71679],
					[34.7814, 10.71539],
					[34.7805, 10.71244],
					[34.7787, 10.71143],
					[34.77719, 10.70928],
					[34.78037, 10.70924],
					[34.78247, 10.71046],
					[34.78432, 10.70827],
					[34.78488, 10.70683],
					[34.78711, 10.70629],
					[34.79949, 10.72056],
					[34.80451, 10.72579],
					[34.80872, 10.72684],
					[34.81086, 10.72655],
					[34.81249, 10.72457],
					[34.81384, 10.72752],
					[34.81831, 10.74649],
					[34.81952, 10.75509],
					[34.81806, 10.77591],
					[34.81587, 10.78019],
					[34.80304, 10.79459],
					[34.79334, 10.82119],
					[34.83305, 10.8723],
					[34.88558, 10.9404],
					[34.88419, 10.94766],
					[34.8622, 10.97784],
					[34.85771, 10.97753],
					[34.84083, 10.98087],
					[34.82479, 10.98127],
					[34.79005, 10.98531],
					[34.78277, 10.99482],
					[34.76081, 11.01356],
					[34.73129, 11.23374],
					[34.71233, 11.25085],
					[34.69741, 11.25917],
					[34.68481, 11.26204],
					[34.66299, 11.25885],
					[34.64182, 11.25565],
					[34.61847, 11.25126],
					[34.59552, 11.22708],
					[34.59456, 11.22176],
					[34.62311, 11.14369],
					[34.62557, 11.13298],
					[34.66233, 10.98682],
					[34.66539, 10.97856],
					[34.67234, 10.96516],
					[34.67309, 10.9633],
					[34.67135, 10.96079],
					[34.67056, 10.95414],
					[34.66802, 10.95028],
					[34.66356, 10.94631],
					[34.65601, 10.94421],
					[34.64747, 10.93968],
					[34.64576, 10.93746],
					[34.6384, 10.92978],
					[34.63233, 10.9257],
					[34.62973, 10.92154],
					[34.61708, 10.91772],
					[34.60528, 10.90548],
					[34.70233, 10.82265],
					[34.76294, 10.75598]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-07",
				"kind": "zone",
				"layer": "control",
				"name": "RSF (source label) — pocket 3",
				"nameAr": "RSF",
				"faction": "rsf",
				"color": "#c9a227",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 68
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[34.30333, 10.38067],
					[34.29734, 10.39554],
					[34.30824, 10.45472],
					[34.29587, 10.48241],
					[34.28025, 10.53848],
					[34.28283, 10.53969],
					[34.28659, 10.5477],
					[34.29172, 10.55571],
					[34.2968, 10.5729],
					[34.29493, 10.57944],
					[34.28059, 10.57658],
					[34.26892, 10.57489],
					[34.25742, 10.57287],
					[34.23991, 10.5727],
					[34.21589, 10.57104],
					[34.2141, 10.57046],
					[34.19927, 10.56617],
					[34.17901, 10.57124],
					[34.13643, 10.6097],
					[34.11755, 10.66232],
					[34.11703, 10.7531],
					[34.11527, 10.75525],
					[34.06226, 10.77599],
					[33.98329, 10.85793],
					[33.95581, 10.93278],
					[33.93933, 10.95638],
					[33.89675, 10.97795],
					[33.82914, 11.04769],
					[33.80819, 11.12687],
					[33.76628, 11.14507],
					[33.71959, 11.14305],
					[33.6365, 11.14372],
					[33.60355, 11.14572],
					[33.55687, 11.14235],
					[33.52128, 11.07878],
					[33.41013, 11.02931],
					[33.23276, 11.05014],
					[33.2719, 10.831],
					[33.24511, 10.77909],
					[33.51544, 10.64559],
					[33.66869, 10.44601],
					[33.8065, 10.33319],
					[33.90182, 10.17362],
					[33.97155, 10.1518],
					[33.96545, 10.12437],
					[33.97248, 10.08845],
					[33.99751, 10.06529],
					[33.99053, 10.03358],
					[33.99855, 9.99991],
					[33.98849, 9.96778],
					[33.99217, 9.93025],
					[33.96575, 9.80987],
					[33.93764, 9.77205],
					[33.9144, 9.76678],
					[33.89264, 9.67765],
					[33.87639, 9.49917],
					[34.10807, 9.50407],
					[34.09904, 9.56205],
					[34.16456, 9.76976],
					[34.22346, 9.88581],
					[34.21313, 9.92965],
					[34.23576, 10.056],
					[34.33137, 10.11859],
					[34.32235, 10.13661],
					[34.33568, 10.17671],
					[34.34508, 10.2319],
					[34.33466, 10.29327],
					[34.30333, 10.38067]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-08",
				"kind": "zone",
				"layer": "control",
				"name": "SAF (source label)",
				"nameAr": "SAF",
				"faction": "saf",
				"color": "#3d8b3d",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 20
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[29.68073, 11.64282],
					[29.82587, 11.62707],
					[29.85541, 11.7344],
					[29.97515, 11.88249],
					[29.9405, 11.94514],
					[29.93182, 12.33536],
					[29.73972, 12.16198],
					[29.70814, 12.1683],
					[29.66558, 12.17427],
					[29.61957, 12.16883],
					[29.59282, 12.15279],
					[29.57294, 12.13071],
					[29.5634, 12.104],
					[29.56209, 12.07326],
					[29.56816, 12.02077],
					[29.58854, 11.96414],
					[29.66776, 11.90729],
					[29.71269, 11.84921],
					[29.71113, 11.74051],
					[29.68073, 11.64282]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-09",
				"kind": "zone",
				"layer": "control",
				"name": "New control area (source, unlabeled)",
				"nameAr": "منطقة سيطرة جديدة",
				"faction": "change",
				"color": "#5a5a5a",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 17
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[28.88074, 15.54217],
					[28.83211, 15.23572],
					[28.82845, 15.10495],
					[29.15987, 14.68601],
					[29.26149, 14.57971],
					[29.3036, 14.42504],
					[29.3563, 14.21042],
					[29.44082, 14.12071],
					[29.92158, 14.20049],
					[30.24477, 14.20771],
					[30.38143, 14.13265],
					[30.42399, 14.25381],
					[30.0541, 14.72845],
					[29.92043, 14.96562],
					[29.53042, 15.07969],
					[29.35017, 15.10554],
					[28.88074, 15.54217]
				]]
			}
		},
		{
			"type": "Feature",
			"properties": {
				"id": "vista-zone-10",
				"kind": "zone",
				"layer": "control",
				"name": "Control change (source, unlabeled)",
				"nameAr": "تغير سيطرة",
				"faction": "change",
				"color": "#5a5a5a",
				"note": "Polygon from the public Vista-copy My Map. Compiled control — not a live frontline and not occupancy.",
				"source": "Google My Map copy of Vista / Ra'ad (public)",
				"npts": 7
			},
			"geometry": {
				"type": "Polygon",
				"coordinates": [[
					[23.70234, 15.06285],
					[23.68584, 15.01244],
					[23.72065, 14.93656],
					[23.78477, 14.8046],
					[23.96733, 14.9744],
					[23.75726, 15.07515],
					[23.70234, 15.06285]
				]]
			}
		}
	]
};
var VISTA_DIVS = VISTA.features.filter((f) => f.properties.kind === "division");
var VISTA_ZONES = VISTA.features.filter((f) => f.properties.kind === "zone");
function vistaZonesFc() {
	return {
		type: "FeatureCollection",
		features: VISTA_ZONES
	};
}
function vistaDivFc() {
	return {
		type: "FeatureCollection",
		features: VISTA_DIVS
	};
}
var VISTA_LEGEND = [
	{
		faction: "saf",
		label: "SAF (source polygon)",
		color: "#3d8b3d"
	},
	{
		faction: "rsf",
		label: "RSF (source polygon)",
		color: "#c9a227"
	},
	{
		faction: "splm",
		label: "SPLM-N — al-Hilu",
		color: "#007276"
	},
	{
		faction: "slm",
		label: "SLM — Abdel Wahid",
		color: "#7aa3d4"
	},
	{
		faction: "disputed",
		label: "Disputed (Halaib / Abyei)",
		color: "#9aa0a6"
	},
	{
		faction: "change",
		label: "Unlabeled control change",
		color: "#5a5a5a"
	}
];
var useAnalysisArea = create((set) => ({
	center: [32.5, 15.6],
	overlay: null,
	setOverlay: (overlay) => set({ overlay }),
	setCenter: (center) => set({ center })
}));
createRequestCache(4);
var getHazards = createServerFn({ method: "GET" }).handler(createSsrRpc("eaccd0a304cf99205c3b88484fca90d76808d46605197be7e01296aa47138b8d"));
var useHazardState = create(() => ({
	feed: null,
	error: null,
	loading: false
}));
async function refreshHazards() {
	if (useHazardState.getState().loading) return;
	useHazardState.setState({ loading: true });
	try {
		const feed = await getHazards();
		useHazardState.setState({
			feed,
			error: null
		});
	} catch (e) {
		useHazardState.setState({ error: e instanceof Error ? e.message : "Hazard refresh failed" });
	} finally {
		useHazardState.setState({ loading: false });
	}
}
/** RSF-associated watchlist from public reporting + archive pins. Occupancy not claimed. */
var RSF_WATCH = [
	{
		id: "rw-hsnn",
		siteId: "hsnn",
		name: "Nyala Airport",
		lat: 12.0535,
		lon: 24.9562,
		place: "South Darfur",
		why: "airfield",
		note: "Open reporting treats Nyala as an RSF-associated air hub. Apron change and nearby published SAM reporting are the watch, not occupancy from this desk.",
		sourceLabel: "archive + @AfriMEOSINT",
		lastSeen: "2026-09-08",
		watch: "primary"
	},
	{
		id: "rw-nyala-sam",
		siteId: "nyala-sam",
		name: "Nyala Airport — published SAM site",
		lat: 12.061,
		lon: 24.962,
		place: "South Darfur",
		why: "sam-reporting",
		note: "@AfriMEOSINT (Apr 2025) described TELs and C2-typical vehicles near Nyala Airport, later named as FK-2000-typical SHORAD. Pin is the published location. Not a weapons identification from this desk.",
		sourceLabel: "@AfriMEOSINT (X)",
		sourceUrl: "https://x.com/AfriMEOSINT/status/1912460578028745036",
		lastSeen: "2025-04-16",
		watch: "primary"
	},
	{
		id: "rw-hsfs",
		siteId: "hsfs",
		name: "El Fasher Airport",
		lat: 13.6148,
		lon: 25.3246,
		place: "North Darfur",
		why: "control-reporting",
		note: "Late-2025 open reporting described a change of control in El Fasher. Watch the airfield, Saudi Hospital, and Zamzam as civilian-harm / logistics nodes.",
		sourceLabel: "archive",
		lastSeen: "2026-09-06",
		watch: "primary"
	},
	{
		id: "rw-hsgn",
		siteId: "hsgn",
		name: "El Geneina Airport",
		lat: 13.4817,
		lon: 22.4657,
		place: "West Darfur",
		why: "airfield",
		note: "West Darfur strip on the Adré corridor. Vehicle parks here are logged, not typed.",
		sourceLabel: "archive",
		lastSeen: "2026-09-03",
		watch: "primary"
	},
	{
		id: "rw-se-libya",
		siteId: "se-libya-camp",
		name: "SE Libya desert camp (approx.)",
		lat: 22.35,
		lon: 23.05,
		place: "Kufra approaches, Libya",
		why: "published-camp",
		note: "@AfriMEOSINT (Jun 2026 stills, posted 13 Sep): ~300 technicals, fuel/water trailers, container trucks described as staged before a Kordofan push. Coordinates approximate. RSF-linked in that reporting — movement into Sudan not shown here.",
		sourceLabel: "@AfriMEOSINT (X)",
		sourceUrl: "https://x.com/AfriMEOSINT/status/2098986948584980880",
		lastSeen: "2026-06-01",
		watch: "primary"
	},
	{
		id: "rw-subul",
		siteId: "subul-salam",
		name: "Subul al-Salam compound (Kufra)",
		lat: 24.22,
		lon: 23.28,
		place: "Kufra, Libya",
		why: "rear-logistics",
		note: "LNA-mapped battalion compound. @AfriMEOSINT logged technicals/trailers massing Aug–8 Sep plus two new structures. Not an RSF identification. Change is the observation on the Libya–Darfur approach.",
		sourceLabel: "@AfriMEOSINT (X)",
		sourceUrl: "https://x.com/AfriMEOSINT/status/2098588375158497766",
		lastSeen: "2026-09-08",
		watch: "approach"
	},
	{
		id: "rw-kufra",
		siteId: "kufra-afld",
		name: "Kufra / Al Jawf Airport",
		lat: 24.1787,
		lon: 23.314,
		place: "Libya",
		why: "rear-logistics",
		note: "8 Sep stills: ~3 IL-76TD-typical + ATR-72-typical on the apron. Cargo traffic is a watch, type ≠ payload.",
		sourceLabel: "@AfriMEOSINT (X)",
		sourceUrl: "https://x.com/AfriMEOSINT/status/2098546872570851768",
		lastSeen: "2026-09-08",
		watch: "approach"
	},
	{
		id: "rw-amdjarass",
		siteId: "amdjarass",
		name: "Amdjarass airstrip (Chad)",
		lat: 15.97096,
		lon: 22.77059,
		place: "Ennedi-Est, Chad",
		why: "rear-logistics",
		note: "Open reporting names Amdjarass in RSF-rear / UAE-linked logistics stories. Pin is the public strip.",
		sourceLabel: "archive",
		lastSeen: "2026-09-01",
		watch: "approach"
	},
	{
		id: "rw-adre",
		siteId: "adre",
		name: "Adré humanitarian hub (Chad)",
		lat: 13.526,
		lon: 22.198,
		place: "Ouaddaï, Chad",
		why: "border-node",
		note: "Humanitarian baseline first. Staging on the Geneina approach is logged separately from the camp.",
		sourceLabel: "archive",
		lastSeen: "2026-09-01",
		watch: "approach"
	},
	{
		id: "rw-haso",
		siteId: "haso",
		name: "Asosa Airport (HASO)",
		lat: 10.0186,
		lon: 34.586,
		place: "Benishangul-Gumuz, Ethiopia",
		why: "rear-logistics",
		note: "Blue Nile approach. Sentinel-2 sequence 20 Aug–7 Sep: ~4 IL-76TD-typical on the apron. Open reporting links some rotations to Al Ain. Airbridge is a hypothesis until a chain into Sudan is shown.",
		sourceLabel: "@AfriMEOSINT (X)",
		sourceUrl: "https://x.com/AfriMEOSINT/status/2098462642910220459",
		lastSeen: "2026-09-07",
		watch: "primary"
	},
	{
		id: "rw-asosa-endf",
		siteId: "asosa-endf",
		name: "Asosa outskirts compound",
		lat: 10.05,
		lon: 34.55,
		place: "Ethiopia / Blue Nile approach",
		why: "published-camp",
		note: "Planet/Airbus posts: technicals, car-carriers, tents, fuel tanks. Default actor undetermined Ethiopian or other local until a movement chain is shown.",
		sourceLabel: "archive OSINT",
		lastSeen: "2026-05-21",
		watch: "primary"
	},
	{
		id: "rw-menge",
		siteId: "menge",
		name: "Menge approaches",
		lat: 10.65,
		lon: 34.77,
		place: "Ethiopia / Blue Nile",
		why: "border-node",
		note: "Rural strip east of Asosa on the Kurmuk corridor. Berms/tents logged as change — not an army ID.",
		sourceLabel: "archive",
		lastSeen: "2026-08-20",
		watch: "approach"
	},
	{
		id: "rw-kurmuk",
		name: "Kurmuk approaches",
		lat: 10.55,
		lon: 34.28,
		place: "Blue Nile State",
		why: "border-node",
		note: "Eastern front town. Telegram control-map updates in 2026 described RSF/SPLM-N pressure. Watch pads on both sides of the line.",
		sourceLabel: "archive reporting",
		lastSeen: "2026-03-23",
		watch: "primary"
	}
];
var WHY_LABEL = {
	"control-reporting": "Control reporting",
	"rear-logistics": "Rear / logistics",
	"published-camp": "Published camp",
	"sam-reporting": "Published SAM cue",
	airfield: "Airfield",
	"border-node": "Border node"
};
function rsfWatchResolved() {
	return RSF_WATCH.map((w) => {
		const site = w.siteId ? SITES.find((s) => s.id === w.siteId) : void 0;
		return {
			...w,
			lat: site?.lat ?? w.lat,
			lon: site?.lon ?? w.lon
		};
	});
}
function spyEase(t) {
	return t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
function pitchForZoom(z) {
	if (z < 6.4) return 0;
	return Math.min(34, (z - 6.4) * 3.8);
}
function aglKm(lat, zoom) {
	return 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** zoom * 720 / 1e3;
}
function flyMs(fromZ, toZ, distDeg) {
	if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 180;
	return Math.min(3400, Math.max(1100, 720 + Math.abs(toZ - fromZ) * 280 + distDeg * 110));
}
function emitSlew(detail) {
	window.dispatchEvent(new CustomEvent("ahsr-slew", { detail }));
}
function cinematicFly(map, opts) {
	const from = map.getCenter();
	const dist = Math.hypot(opts.lat - from.lat, opts.lon - from.lng);
	const duration = flyMs(map.getZoom(), opts.zoom, dist);
	const inward = opts.zoom > map.getZoom() + .35;
	const bearing = map.getBearing() + (inward ? 16 + Math.min(18, dist * 5) : -8);
	emitSlew({
		phase: "slewing",
		label: opts.label,
		duration
	});
	const onEnd = () => {
		map.off("moveend", onEnd);
		emitSlew({
			phase: "lock",
			label: opts.label
		});
		window.setTimeout(() => emitSlew({ phase: "idle" }), 1600);
	};
	map.once("moveend", onEnd);
	map.flyTo({
		center: [opts.lon, opts.lat],
		zoom: opts.zoom,
		pitch: pitchForZoom(opts.zoom),
		bearing,
		duration,
		curve: 1.62,
		speed: .48,
		easing: spyEase,
		essential: true
	});
}
function cinematicFit(map, opts) {
	if (!map.fitBounds) {
		cinematicFly(map, {
			lon: (opts.west + opts.east) / 2,
			lat: (opts.south + opts.north) / 2,
			zoom: opts.zoom,
			label: opts.label
		});
		return;
	}
	const duration = flyMs(map.getZoom(), opts.zoom, .45);
	emitSlew({
		phase: "slewing",
		label: opts.label,
		duration
	});
	const onEnd = () => {
		map.off("moveend", onEnd);
		emitSlew({
			phase: "lock",
			label: opts.label
		});
		window.setTimeout(() => emitSlew({ phase: "idle" }), 1400);
	};
	map.once("moveend", onEnd);
	map.fitBounds([[opts.west, opts.south], [opts.east, opts.north]], {
		padding: 90,
		maxZoom: opts.zoom,
		duration,
		pitch: pitchForZoom(opts.zoom),
		bearing: map.getBearing() + 10,
		essential: true,
		easing: spyEase
	});
}
Object.fromEntries([
	{
		id: "none",
		short: "OPT",
		label: "Optical",
		key: "1",
		accent: "#9adbb8",
		fg: "#d5e4dc"
	},
	{
		id: "crt",
		short: "CRT",
		label: "CRT phosphor",
		key: "2",
		accent: "#ffaa00",
		fg: "#ffd080"
	},
	{
		id: "nvg",
		short: "NVG",
		label: "Night vision",
		key: "3",
		accent: "#33ff51",
		fg: "#b8ffc0"
	},
	{
		id: "flir",
		short: "FLIR",
		label: "Thermal / ironbow",
		key: "4",
		accent: "#f4f0ea",
		fg: "#f4f0ea"
	},
	{
		id: "noir",
		short: "NOIR",
		label: "Noir",
		key: "5",
		accent: "#d8d2c6",
		fg: "#e8e2d6"
	},
	{
		id: "snow",
		short: "SNOW",
		label: "Snow",
		key: "6",
		accent: "#c8e4f0",
		fg: "#e8f4fa"
	}
].map((l) => [l.id, l]));
var VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
var LOOK_FS = {
	crt: `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec2 uv = vUv;
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + r2 * 0.06;
  uv = c * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float lineY = floor(uv.y * uRes.y);
  float j = (hash(vec2(lineY, floor(uTime * 8.0))) - 0.5) * 0.003;
  vec2 juv = uv + vec2(j, 0.0);
  vec2 off = (juv - 0.5) * 0.004;
  float r = texture2D(uMap, juv + off).r;
  float g = texture2D(uMap, juv).g;
  float b = texture2D(uMap, juv - off).b;
  vec3 col = vec3(r, g, b);
  float scan = 0.82 + 0.18 * sin(uv.y * uRes.y * 3.14159);
  col *= scan;
  float flicker = 1.0 - 0.025 * (0.5 + 0.5 * sin(uTime * 48.0));
  col *= flicker;
  col *= vec3(1.05, 0.98, 0.78);
  vec2 vig = uv * (1.0 - uv);
  col *= pow(vig.x * vig.y * 16.0, 0.22);
  gl_FragColor = vec4(col, 1.0);
}
`,
	nvg: `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec2 uv = vUv;
  vec2 c = uv * 2.0 - 1.0;
  c.x *= uRes.x / uRes.y;
  float rad = length(c);
  float tube = pow(1.0 - smoothstep(0.72, 1.12, rad), 0.7);
  if (tube < 0.01) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 d = uv * 2.0 - 1.0;
  d *= 1.0 + dot(d, d) * 0.12;
  vec2 duv = d * 0.5 + 0.5;
  vec3 src = texture2D(uMap, duv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  luma = pow(clamp(luma * 1.55, 0.0, 1.0), 0.85);
  vec2 texel = 1.0 / uRes;
  float bloom = 0.0;
  bloom += texture2D(uMap, duv + vec2(texel.x * 4.0, 0.0)).g;
  bloom += texture2D(uMap, duv - vec2(texel.x * 4.0, 0.0)).g;
  bloom += texture2D(uMap, duv + vec2(0.0, texel.y * 4.0)).g;
  bloom += texture2D(uMap, duv - vec2(0.0, texel.y * 4.0)).g;
  luma += bloom * 0.08;
  float noise = (hash(duv * uRes + uTime) - 0.5) * 0.12;
  vec3 green = vec3(0.05, luma + noise, 0.08) * vec3(0.35, 1.35, 0.4);
  float scan = 0.88 + 0.12 * sin(uv.y * uRes.y * 1.2);
  green *= scan * tube * (1.0 - rad * rad * 0.18);
  gl_FragColor = vec4(green, 1.0);
}
`,
	flir: `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
vec3 ironbow(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.0, 0.0, 0.0);
  vec3 c1 = vec3(0.13, 0.0, 0.30);
  vec3 c2 = vec3(0.49, 0.0, 0.45);
  vec3 c3 = vec3(0.86, 0.10, 0.18);
  vec3 c4 = vec3(1.0, 0.55, 0.0);
  vec3 c5 = vec3(1.0, 0.91, 0.32);
  vec3 c6 = vec3(1.0, 1.0, 1.0);
  float s = t * 6.0;
  if (s < 1.0) return mix(c0, c1, s);
  if (s < 2.0) return mix(c1, c2, s - 1.0);
  if (s < 3.0) return mix(c2, c3, s - 2.0);
  if (s < 4.0) return mix(c3, c4, s - 3.0);
  if (s < 5.0) return mix(c4, c5, s - 4.0);
  return mix(c5, c6, s - 5.0);
}
void main() {
  vec2 uv = vUv;
  vec3 src = texture2D(uMap, uv).rgb;
  float t = dot(src, vec3(0.299, 0.587, 0.114));
  t = pow(clamp((t - 0.08) * 1.35, 0.0, 1.0), 0.82);
  vec3 col = ironbow(t);
  float scan = 0.9 + 0.1 * sin(uv.y * uRes.y * 0.8 + uTime);
  col *= scan;
  vec2 vig = uv * (1.0 - uv);
  col *= pow(vig.x * vig.y * 18.0, 0.18);
  gl_FragColor = vec4(col, 1.0);
}
`,
	noir: `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
void main() {
  vec2 uv = vUv;
  vec3 src = texture2D(uMap, uv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  luma = clamp((luma - 0.5) * 1.45 + 0.5, 0.0, 1.0);
  float grain = fract(sin(dot(uv * uRes, vec2(12.9898, 78.233))) * 43758.5453);
  luma += (grain - 0.5) * 0.06;
  vec3 sepia = vec3(luma * 1.02, luma * 0.96, luma * 0.82);
  vec2 vig = uv * (1.0 - uv);
  sepia *= pow(vig.x * vig.y * 15.0, 0.28);
  gl_FragColor = vec4(sepia, 1.0);
}
`,
	snow: `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec2 uv = vUv;
  vec3 src = texture2D(uMap, uv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  vec3 cold = mix(src, vec3(luma), 0.55) * vec3(0.82, 0.9, 1.05) + 0.12;
  float flakes = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    vec2 suv = uv * (3.0 + layer * 3.0);
    suv.y += uTime * (0.12 + layer * 0.08);
    suv.x += sin(uTime * 0.4 + layer) * 0.2;
    vec2 f = fract(suv);
    float n = hash(floor(suv) + layer * 17.0);
    flakes += step(0.92, n) * smoothstep(0.08, 0.0, length(f - 0.5));
  }
  gl_FragColor = vec4(cold + flakes * 0.85, 1.0);
}
`
};
var LOOK_VS = VS;
function gsdMeters(lat, zoom) {
	return 156543.03392 * Math.cos(lat * Math.PI / 180) / 2 ** zoom;
}
function niirsFromZoom(zoom) {
	const n = .4 * zoom - .6;
	return Math.max(1, Math.min(8.5, n));
}
/** Compact WGS84 → MGRS for HUD telemetry (not a survey product). */
var BANDS = "CDEFGHJKLMNPQRSTUVWX";
var COLS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
var ROWS = "ABCDEFGHJKLMNPQRSTUV";
function latLonToUtm(lat, lon) {
	const a = 6378137;
	const f = 1 / 298.257223563;
	const k0 = .9996;
	const e2 = f * 1.9966471893352524;
	const ep2 = e2 / .9933056200098587;
	let zone = Math.floor((lon + 180) / 6) + 1;
	if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
	const lonOrigin = (zone - 1) * 6 - 180 + 3;
	const latR = lat * Math.PI / 180;
	const lonR = lon * Math.PI / 180;
	const lon0 = lonOrigin * Math.PI / 180;
	const N = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2);
	const T = Math.tan(latR) ** 2;
	const C = ep2 * Math.cos(latR) ** 2;
	const A = Math.cos(latR) * (lonR - lon0);
	const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latR - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latR) + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latR) - 35 * e2 ** 3 / 3072 * Math.sin(6 * latR));
	const east = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120) + 5e5;
	let north = k0 * (M + N * Math.tan(latR) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720));
	if (lat < 0) north += 1e7;
	return {
		zone,
		east,
		north,
		northHemi: lat >= 0
	};
}
function toMgrs(lat, lon) {
	if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -80 || lat > 84) return "—";
	const { zone, east, north, northHemi } = latLonToUtm(lat, lon);
	const band = BANDS[Math.min(19, Math.max(0, Math.floor((lat + 80) / 8)))];
	const col = COLS[((zone % 3 === 1 ? 0 : zone % 3 === 2 ? 8 : 16) + Math.floor(east / 1e5) - 1 + 24) % 24];
	const rowOff = zone % 2 === 0 ? 5 : 0;
	return `${zone}${band} ${col}${ROWS[(Math.floor(north / 1e5) + rowOff) % 20]} ${Math.floor(east % 1e5).toString().padStart(5, "0").slice(0, 4)} ${Math.floor(north % 1e5).toString().padStart(5, "0").slice(0, 4)}${northHemi ? "" : ""}`;
}
var FILTERS = {
	none: "",
	crt: "contrast(1.18) saturate(1.25) sepia(0.28)",
	nvg: "grayscale(1) sepia(1) hue-rotate(70deg) saturate(7) brightness(1.2) contrast(1.35)",
	flir: "grayscale(1) contrast(1.7) brightness(1.12)",
	noir: "grayscale(1) contrast(1.45) brightness(0.92)",
	snow: "grayscale(0.35) brightness(1.22) saturate(0.55) hue-rotate(190deg)"
};
function compile(gl, type, src) {
	const sh = gl.createShader(type);
	if (!sh) return null;
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		gl.deleteShader(sh);
		return null;
	}
	return sh;
}
function makeProgram(gl, fsSrc) {
	const vs = compile(gl, gl.VERTEX_SHADER, LOOK_VS);
	const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
	if (!vs || !fs) return null;
	const p = gl.createProgram();
	if (!p) return null;
	gl.attachShader(p, vs);
	gl.attachShader(p, fs);
	gl.bindAttribLocation(p, 0, "aPos");
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
	return p;
}
function LookFx({ mapRef, flights, detections }) {
	const canvasRef = (0, import_react.useRef)(null);
	const look = useAppStore((s) => s.look);
	const hudOn = useAppStore((s) => s.hudOn);
	const detectOn = useAppStore((s) => s.detectOn);
	const [telem, setTelem] = (0, import_react.useState)({
		lat: 0,
		lon: 0,
		z: 0,
		mgrs: "—",
		gsd: "—",
		niirs: "—",
		agl: "—"
	});
	const [boxes, setBoxes] = (0, import_react.useState)([]);
	const glRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const gl = canvas.getContext("webgl", {
			alpha: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: false
		});
		if (!gl) return;
		const buf = gl.createBuffer();
		if (!buf) return;
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			1,
			-1,
			-1,
			1,
			-1,
			1,
			1,
			-1,
			1,
			1
		]), gl.STATIC_DRAW);
		const tex = gl.createTexture();
		if (!tex) return;
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const programs = {};
		Object.keys(LOOK_FS).forEach((id) => {
			const p = makeProgram(gl, LOOK_FS[id]);
			if (p) programs[id] = p;
		});
		glRef.current = {
			gl,
			programs,
			buf,
			tex
		};
		return () => {
			glRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		const canvas = canvasRef.current;
		const pack = glRef.current;
		if (!map || !canvas) return;
		const tick = () => {
			const c = map.getCenter();
			const z = map.getZoom();
			const gsd = gsdMeters(c.lat, z);
			const agl = aglKm(c.lat, z);
			setTelem({
				lat: c.lat,
				lon: c.lng,
				z,
				mgrs: toMgrs(c.lat, c.lng),
				gsd: gsd >= 10 ? `${gsd.toFixed(0)} m` : `${gsd.toFixed(1)} m`,
				niirs: niirsFromZoom(z).toFixed(1),
				agl: agl >= 10 ? `${agl.toFixed(0)} km` : `${agl.toFixed(1)} km`
			});
			if (hudOn && (detectOn || look !== "none")) {
				const next = [];
				const src = detectOn ? detections.slice(0, 10) : [];
				for (const h of src) {
					const p = map.project([h.lon, h.lat]);
					if (p.x < 8 || p.y < 8 || p.x > canvas.clientWidth - 8 || p.y > canvas.clientHeight - 8) continue;
					next.push({
						x: p.x,
						y: p.y,
						w: 46,
						h: 36,
						id: h.id,
						label: h.title.slice(0, 18)
					});
				}
				let n = 0;
				for (const f of flights) {
					if (n >= 8) break;
					const p = map.project([f.lon, f.lat]);
					if (p.x < 8 || p.y < 8 || p.x > canvas.clientWidth - 8 || p.y > canvas.clientHeight - 8) continue;
					next.push({
						x: p.x,
						y: p.y,
						w: 42,
						h: 28,
						id: f.id,
						label: f.hex || f.typeCode || "ADS-B"
					});
					n += 1;
				}
				setBoxes(next);
			} else setBoxes([]);
			const srcCanvas = map.getCanvas();
			const lookId = useAppStore.getState().look;
			if (lookId === "none") {
				canvas.style.opacity = "0";
				srcCanvas.style.filter = "";
				return;
			}
			const prog = pack?.programs[lookId];
			if (!pack || !prog) {
				canvas.style.opacity = "0";
				srcCanvas.style.filter = FILTERS[lookId];
				return;
			}
			const { gl, buf, tex } = pack;
			const w = srcCanvas.width;
			const h = srcCanvas.height;
			if (w < 8 || h < 8) return;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}
			gl.viewport(0, 0, w, h);
			gl.useProgram(prog);
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			try {
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
			} catch {
				canvas.style.opacity = "0";
				srcCanvas.style.filter = FILTERS[lookId];
				return;
			}
			gl.uniform1i(gl.getUniformLocation(prog, "uMap"), 0);
			gl.uniform2f(gl.getUniformLocation(prog, "uRes"), w, h);
			gl.uniform1f(gl.getUniformLocation(prog, "uTime"), performance.now() / 1e3);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			canvas.style.opacity = "1";
			srcCanvas.style.filter = "";
		};
		map.on("render", tick);
		tick();
		return () => {
			map.off("render", tick);
		};
	}, [
		mapRef,
		flights,
		detections,
		look,
		hudOn,
		detectOn
	]);
	const showHud = hudOn;
	const military = look === "crt" || look === "nvg" || look === "flir";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "pointer-events-none absolute inset-0 z-[8] h-full w-full",
		style: { opacity: 0 },
		"aria-hidden": true
	}), showHud ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-x-0 bottom-0 z-[15] flex justify-center bg-bg/70 py-0.5 font-mono text-[9px] tracking-[0.28em] text-accent",
			children: "DOCUMENTATION ONLY · NO TARGETING"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute left-3 top-[4.6rem] z-[16] hidden font-mono text-[10px] leading-relaxed tracking-wide text-accent/90 sm:block",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["LAT ", telem.lat.toFixed(4)] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["LON ", telem.lon.toFixed(4)] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["MGRS ", telem.mgrs] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["GSD ", telem.gsd] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["AGL ", telem.agl] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["NIIRS ", telem.niirs] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Z ", telem.z.toFixed(1)] }),
				military ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex items-center gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-1.5 rounded-full bg-damage live-pulse" }), "REC"]
				}) : null
			]
		}),
		boxes.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "detect-box",
			style: {
				left: b.x - b.w / 2,
				top: b.y - b.h / 2,
				width: b.w,
				height: b.h
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: b.label })
		}, b.id))
	] }) : null] });
}
function LookTray() {
	const look = useAppStore((s) => s.look);
	const setLook = useAppStore((s) => s.setLook);
	const hudOn = useAppStore((s) => s.hudOn);
	const setHudOn = useAppStore((s) => s.setHudOn);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			const hit = [
				"none",
				"crt",
				"nvg",
				"flir",
				"noir",
				"snow"
			][Number(e.key) - 1];
			if (!hit) return;
			e.preventDefault();
			setLook(hit);
			if (hit !== "none") setHudOn(true);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [setLook, setHudOn]);
	if (!hudOn) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hud-panel pointer-events-auto flex items-center gap-0.5 p-1",
		children: [
			"none",
			"crt",
			"nvg",
			"flir",
			"noir",
			"snow"
		].map((id, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			title: `${id.toUpperCase()} · key ${i + 1}`,
			onClick: () => setLook(id),
			className: cn("h-8 min-w-9 rounded-sm px-1.5 font-mono text-[10px] tracking-wider", look === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
			children: id === "none" ? "OPT" : id.toUpperCase()
		}, id))
	});
}
var PARTY_COLOR = {
	saf: "#7b93a6",
	rsf: "#b38862",
	mixed: "#9aa08a",
	other_armed: "#8b7d9a",
	civilian: "#7d9a7a",
	unknown: "#8a857c"
};
var CLOSE_KINDS = /* @__PURE__ */ new Set([
	"logistics",
	"airfield",
	"port",
	"compound",
	"hospital",
	"market"
]);
/** Esri Dark Gray Canvas — public ArcGIS tiles, no API key. Not CARTO. */
var DARK_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
var DARK_REF_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
var S2_CLOUDLESS = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg";
function gibsUrl(layer, date, level, ext = "jpg") {
	return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${ext}`;
}
function hlsUrl(date) {
	return gibsUrl("HLS_S30_Nadir_BRDF_Adjusted_Reflectance", date, 12, "png");
}
function viirsUrl(date) {
	return gibsUrl("VIIRS_NOAA20_CorrectedReflectance_TrueColor", date, 9, "jpg");
}
function thermalUrl(date) {
	return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_Thermal_Anomalies_375m_All/default/${date}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`;
}
function vis(imagery, id) {
	if (id === "dark") return imagery === "dark" ? "visible" : "none";
	if (id === "gmaps") return imagery === "gmaps" ? "visible" : "none";
	if (id === "esri") return imagery === "hires" || imagery === "s2" || imagery === "viirs" ? "visible" : "none";
	if (id === "hls") return imagery === "s2" ? "visible" : "none";
	if (id === "viirs") return imagery === "viirs" ? "visible" : "none";
	return imagery === "s2cloudless" ? "visible" : "none";
}
function hudPad(panelOpen) {
	return {
		top: 132,
		right: panelOpen ? 420 : 16,
		bottom: 88,
		left: 16
	};
}
function canvasIcon(draw, size = 64) {
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	const ctx = c.getContext("2d");
	draw(ctx, size);
	return ctx.getImageData(0, 0, size, size);
}
function addContactIcons(map) {
	const plane = (fill) => canvasIcon((ctx, s) => {
		ctx.translate(s / 2, s / 2);
		ctx.beginPath();
		ctx.moveTo(0, -18);
		ctx.lineTo(12, 16);
		ctx.lineTo(0, 8);
		ctx.lineTo(-12, 16);
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.strokeStyle = "#07090b";
		ctx.lineWidth = 2.4;
		ctx.stroke();
	});
	if (!map.hasImage("plane-icon")) map.addImage("plane-icon", plane("#f4fff8"), { pixelRatio: 2 });
	if (!map.hasImage("plane-cargo")) map.addImage("plane-cargo", plane("#e2a15a"), { pixelRatio: 2 });
	if (!map.hasImage("ship-icon")) map.addImage("ship-icon", canvasIcon((ctx, s) => {
		ctx.translate(s / 2, s / 2);
		ctx.beginPath();
		ctx.moveTo(0, -16);
		ctx.lineTo(11, -5);
		ctx.lineTo(13, 12);
		ctx.lineTo(-13, 12);
		ctx.lineTo(-11, -5);
		ctx.closePath();
		ctx.fillStyle = "#9adbb8";
		ctx.fill();
		ctx.strokeStyle = "#07090b";
		ctx.lineWidth = 2.4;
		ctx.stroke();
	}), { pixelRatio: 2 });
}
function baseStyle(date, imagery) {
	return {
		version: 8,
		glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
		sources: {
			esri: {
				type: "raster",
				tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
				tileSize: 256,
				attribution: "Esri World Imagery",
				maxzoom: 19
			},
			gmaps: {
				type: "raster",
				tiles: ["https://mt1.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}"],
				tileSize: 256,
				attribution: "Google satellite",
				maxzoom: 20
			},
			dark: {
				type: "raster",
				tiles: [DARK_TILES],
				tileSize: 256,
				maxzoom: 16,
				attribution: "Esri Dark Gray Canvas"
			},
			"dark-ref": {
				type: "raster",
				tiles: [DARK_REF_TILES],
				tileSize: 256,
				maxzoom: 16,
				attribution: "Esri"
			},
			viirs: {
				type: "raster",
				tiles: [viirsUrl(date)],
				tileSize: 256,
				maxzoom: 9,
				attribution: "NASA GIBS / VIIRS NOAA-20"
			},
			hls: {
				type: "raster",
				tiles: [hlsUrl(date)],
				tileSize: 256,
				maxzoom: 12,
				attribution: "NASA HLS / Sentinel-2 MSI"
			},
			s2cloudless: {
				type: "raster",
				tiles: [S2_CLOUDLESS],
				tileSize: 256,
				maxzoom: 16,
				attribution: "Sentinel-2 cloudless 2024 © EOX / Copernicus"
			}
		},
		layers: [
			{
				id: "esri",
				type: "raster",
				source: "esri",
				layout: { visibility: vis(imagery, "esri") }
			},
			{
				id: "gmaps",
				type: "raster",
				source: "gmaps",
				layout: { visibility: vis(imagery, "gmaps") }
			},
			{
				id: "dark",
				type: "raster",
				source: "dark",
				layout: { visibility: vis(imagery, "dark") },
				paint: {
					"raster-saturation": .85,
					"raster-hue-rotate": 102,
					"raster-contrast": .28,
					"raster-brightness-min": .04
				}
			},
			{
				id: "dark-ref",
				type: "raster",
				source: "dark-ref",
				layout: { visibility: vis(imagery, "dark") },
				paint: {
					"raster-saturation": .7,
					"raster-hue-rotate": 102,
					"raster-contrast": .2
				}
			},
			{
				id: "viirs",
				type: "raster",
				source: "viirs",
				maxzoom: 9.4,
				layout: { visibility: vis(imagery, "viirs") },
				paint: {
					"raster-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						3,
						.72,
						6,
						.92,
						9.4,
						0
					],
					"raster-brightness-min": .18,
					"raster-contrast": .22,
					"raster-fade-duration": 0
				}
			},
			{
				id: "hls",
				type: "raster",
				source: "hls",
				maxzoom: 12.8,
				layout: { visibility: vis(imagery, "hls") },
				paint: {
					"raster-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						4,
						1,
						12,
						1,
						12.8,
						0
					],
					"raster-brightness-min": .08,
					"raster-contrast": .12,
					"raster-fade-duration": 0
				}
			},
			{
				id: "s2cloudless",
				type: "raster",
				source: "s2cloudless",
				layout: { visibility: vis(imagery, "s2cloudless") },
				paint: {
					"raster-opacity": 1,
					"raster-brightness-min": .06,
					"raster-contrast": .1,
					"raster-fade-duration": 0
				}
			}
		]
	};
}
function controlFc(theater = "sdn") {
	return {
		type: "FeatureCollection",
		features: controlZonesFor(theater).map((z) => {
			const ring = z.polygon.map(([lat, lon]) => [lon, lat]);
			const first = ring[0];
			if (first) ring.push(first);
			return {
				type: "Feature",
				properties: {
					id: z.id,
					faction: z.faction,
					label: z.label,
					note: z.note
				},
				geometry: {
					type: "Polygon",
					coordinates: [ring]
				}
			};
		})
	};
}
function controlLabelFc(theater = "sdn") {
	return {
		type: "FeatureCollection",
		features: controlZonesFor(theater).map((z) => {
			let lat = 0;
			let lon = 0;
			for (const [la, lo] of z.polygon) {
				lat += la;
				lon += lo;
			}
			const n = Math.max(z.polygon.length, 1);
			return {
				type: "Feature",
				properties: {
					label: z.label,
					faction: z.faction
				},
				geometry: {
					type: "Point",
					coordinates: [lon / n, lat / n]
				}
			};
		})
	};
}
function boxFc(boxes) {
	return {
		type: "FeatureCollection",
		features: boxes.map((b) => ({
			type: "Feature",
			properties: {
				id: b.id,
				name: b.name,
				priority: b.priority
			},
			geometry: {
				type: "Polygon",
				coordinates: [[
					[b.west, b.south],
					[b.east, b.south],
					[b.east, b.north],
					[b.west, b.north],
					[b.west, b.south]
				]]
			}
		}))
	};
}
function detectFc(hits) {
	return {
		type: "FeatureCollection",
		features: hits.flatMap((h) => {
			const color = DETECT_KLASS[h.klass].color;
			const ring = [
				[h.west, h.south],
				[h.east, h.south],
				[h.east, h.north],
				[h.west, h.north],
				[h.west, h.south]
			];
			return [{
				type: "Feature",
				properties: {
					id: h.id,
					title: h.title,
					klass: DETECT_KLASS[h.klass].short,
					body: h.body,
					color,
					siteId: h.siteId ?? ""
				},
				geometry: {
					type: "Polygon",
					coordinates: [ring]
				}
			}, {
				type: "Feature",
				properties: {
					id: h.id,
					title: h.title,
					klass: DETECT_KLASS[h.klass].short,
					body: h.body,
					color,
					siteId: h.siteId ?? ""
				},
				geometry: {
					type: "Point",
					coordinates: [h.lon, h.lat]
				}
			}];
		})
	};
}
function siteFc(partyOf, kindFilter = "all") {
	return {
		type: "FeatureCollection",
		features: SITES.filter((s) => siteInKindGroup(s.kind, kindFilter)).map((s) => ({
			type: "Feature",
			properties: {
				id: s.id,
				name: s.name,
				kind: s.kind,
				party: partyOf(s.id),
				status: s.status
			},
			geometry: {
				type: "Point",
				coordinates: [s.lon, s.lat]
			}
		}))
	};
}
function pointFc(rows, extra) {
	return {
		type: "FeatureCollection",
		features: rows.map((r) => ({
			type: "Feature",
			properties: {
				id: r.id,
				...extra(r)
			},
			geometry: {
				type: "Point",
				coordinates: [r.lon, r.lat]
			}
		}))
	};
}
function annoFc(rows) {
	return {
		type: "FeatureCollection",
		features: rows.flatMap((a) => [{
			type: "Feature",
			properties: {
				id: a.id,
				title: a.title,
				paragraph: a.paragraph,
				confidence: a.confidence,
				claim: a.claim,
				sources: a.sources,
				color: a.color
			},
			geometry: {
				type: "Polygon",
				coordinates: [circlePoly(a.lat, a.lon, a.radiusKm)]
			}
		}, {
			type: "Feature",
			properties: {
				id: a.id,
				title: a.title,
				paragraph: a.paragraph,
				confidence: a.confidence,
				claim: a.claim,
				sources: a.sources,
				color: a.color
			},
			geometry: {
				type: "Point",
				coordinates: [a.lon, a.lat]
			}
		}])
	};
}
function flightData(rows) {
	return pointFc(rows, (r) => ({
		category: r.category,
		hex: r.hex,
		military: !!r.military,
		track: r.track ?? 0,
		label: `${r.typeCode} ${r.reg === "unknown" ? r.hex.slice(0, 6) : r.reg}`
	}));
}
function vesselData(rows) {
	return pointFc(rows, (r) => ({
		name: r.name,
		kind: r.kind,
		live: r.live,
		cog: r.cog ?? 0
	}));
}
function pct(lat, lon) {
	return {
		left: `${(lon - AOI.west) / (AOI.east - AOI.west) * 100}%`,
		top: `${(AOI.north - lat) / (AOI.north - AOI.south) * 100}%`
	};
}
function StaticSatellite({ date, boxes, firms, flights, onPick }) {
	const [src, setSrc] = (0, import_react.useState)(snapshotUrl(date, AOI));
	(0, import_react.useEffect)(() => {
		setSrc(snapshotUrl(date, AOI));
	}, [date]);
	const partyOf = useAppStore((s) => s.partyOverrides);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 overflow-hidden bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt: "NASA VIIRS mosaic",
				className: "h-full w-full object-cover",
				onError: () => setSrc("/sudan-viirs.jpg")
			}),
			firms.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-thermal",
				style: pct(f.lat, f.lon)
			}, f.id)),
			flights.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-bg bg-fg",
				style: pct(f.lat, f.lon)
			}, f.id)),
			SITES.map((s) => {
				const party = partyOf[s.id]?.party ?? s.party;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					title: s.name,
					onClick: () => onPick(s.id),
					className: "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg",
					style: {
						...pct(s.lat, s.lon),
						background: PARTY_COLOR[party] ?? PARTY_COLOR.unknown
					}
				}, s.id);
			})
		]
	});
}
function MapCanvas({ boxes, firms, flights, panelOpen = false, reports = [], newsPoints = [], aiEvents = [], gdelt = [], osm = [], vessels = [], briefingOn = false, annotations = [], detections = [], fuae = [] }) {
	const host = (0, import_react.useRef)(null);
	const wrap = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const analysisOverlay = useAnalysisArea((s) => s.overlay);
	const hazardFeed = useHazardState((s) => s.feed);
	const ready = (0, import_react.useRef)(false);
	const hoverPopup = (0, import_react.useRef)(null);
	const flightSnap = (0, import_react.useRef)({
		rows: flights,
		at: Date.now()
	});
	const [engine, setEngine] = (0, import_react.useState)("static");
	const [cursor, setCursor] = (0, import_react.useState)("—");
	const [mapReady, setMapReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		refreshHazards();
		const timer = window.setInterval(() => void refreshHazards(), 3e5);
		return () => window.clearInterval(timer);
	}, []);
	const layers = useAppStore((s) => s.layers);
	const imagery = useAppStore((s) => s.imagery);
	const date = useAppStore((s) => s.date);
	const selectedSiteId = useAppStore((s) => s.selectedSiteId);
	const setSelectedSite = useAppStore((s) => s.setSelectedSite);
	const setSelectedReport = useAppStore((s) => s.setSelectedReport);
	const partyOverrides = useAppStore((s) => s.partyOverrides);
	const partyFilter = useAppStore((s) => s.partyFilter);
	const kindFilter = useAppStore((s) => s.kindFilter);
	const focusedBoxId = useAppStore((s) => s.focusedBoxId);
	const yardsZoom = useAppStore((s) => s.yardsZoom);
	const clearYardsZoom = useAppStore((s) => s.clearYardsZoom);
	const theaterId = useAppStore((s) => s.theaterId);
	const flyTarget = useAppStore((s) => s.flyTarget);
	const setFlyTarget = useAppStore((s) => s.setFlyTarget);
	const controlUpdates = useAppStore((s) => s.controlUpdates);
	const detectOn = useAppStore((s) => s.detectOn);
	const orbitOn = useAppStore((s) => s.orbitOn);
	const setOrbitOn = useAppStore((s) => s.setOrbitOn);
	(0, import_react.useEffect)(() => {
		if (!host.current) return;
		let cancelled = false;
		let map = null;
		let ro = null;
		let onCmd = null;
		let onFit = null;
		let onMeasure = null;
		let onNudge = null;
		import("../_libs/maplibre-gl.mjs").then((n) => n.t).then((maplibregl) => {
			if (cancelled || !host.current) return;
			const { Map, NavigationControl, ScaleControl, Popup } = maplibregl;
			try {
				maplibregl.setWorkerCount?.(1);
			} catch {}
			const state = useAppStore.getState();
			map = new Map({
				container: host.current,
				style: baseStyle(state.date, state.imagery),
				center: AOI.center,
				zoom: 5.05,
				minZoom: 2.6,
				maxZoom: 18.5,
				attributionControl: { compact: true },
				maxPitch: 55,
				pitchWithRotate: true,
				dragRotate: true,
				canvasContextAttributes: { preserveDrawingBuffer: true }
			});
			map.addControl(new NavigationControl({ showCompass: false }), "bottom-left");
			map.addControl(new ScaleControl({
				maxWidth: 110,
				unit: "metric"
			}), "bottom-left");
			map.setPadding(hudPad(false));
			mapRef.current = map;
			const updateAnalysisCenter = () => {
				if (map) {
					const c = map.getCenter();
					useAnalysisArea.getState().setCenter([c.lng, c.lat]);
				}
			};
			map.on("moveend", updateAnalysisCenter);
			updateAnalysisCenter();
			try {
				map.scrollZoom.setWheelZoomRate(1 / 620);
				map.scrollZoom.setZoomRate(1 / 220);
			} catch {}
			const boxesNow = boxes;
			const firmsNow = firms;
			const flightsNow = flightSnap.current.rows.length ? flightSnap.current.rows : flights;
			const overridesNow = state.partyOverrides;
			const kindNow = state.kindFilter;
			map.on("load", () => {
				if (!map || cancelled) return;
				map.resize();
				addContactIcons(map);
				map.addSource("thermal-raster", {
					type: "raster",
					tiles: [thermalUrl(state.date)],
					tileSize: 256,
					maxzoom: 8,
					attribution: "NASA GIBS thermal"
				});
				map.addLayer({
					id: "thermal-raster",
					type: "raster",
					source: "thermal-raster",
					maxzoom: 8.5,
					layout: { visibility: state.layers.thermalRaster ? "visible" : "none" },
					paint: { "raster-opacity": .85 }
				});
				map.addSource("boxes", {
					type: "geojson",
					data: boxFc(boxesNow)
				});
				map.addLayer({
					id: "boxes-fill",
					type: "fill",
					source: "boxes",
					paint: {
						"fill-color": "#d8d2c6",
						"fill-opacity": [
							"match",
							["get", "priority"],
							"border",
							.04,
							.07
						]
					}
				});
				map.addLayer({
					id: "boxes-line",
					type: "line",
					source: "boxes",
					paint: {
						"line-color": "#d8d2c6",
						"line-opacity": .5,
						"line-width": 1.4,
						"line-dasharray": [2, 2]
					}
				});
				map.addSource("firms", {
					type: "geojson",
					data: pointFc(firmsNow, (r) => ({
						klass: r.klass,
						frp: r.frp,
						live: !!r.live
					}))
				});
				map.addLayer({
					id: "firms-glow",
					type: "circle",
					source: "firms",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["get", "frp"],
							0,
							6,
							40,
							14
						],
						"circle-color": "#c4894a",
						"circle-opacity": .28,
						"circle-blur": .5
					}
				});
				map.addLayer({
					id: "firms-core",
					type: "circle",
					source: "firms",
					paint: {
						"circle-radius": 3.5,
						"circle-color": "#c4894a",
						"circle-stroke-width": 1,
						"circle-stroke-color": "#12110f"
					}
				});
				map.addSource("flights", {
					type: "geojson",
					data: flightData(flightsNow)
				});
				map.addLayer({
					id: "flights",
					type: "circle",
					source: "flights",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							3,
							5,
							8,
							8
						],
						"circle-color": [
							"case",
							[
								"==",
								["get", "military"],
								true
							],
							"#c4894a",
							"#d5e4dc"
						],
						"circle-opacity": .85,
						"circle-stroke-width": 1.2,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addLayer({
					id: "flights-icon",
					type: "symbol",
					source: "flights",
					layout: {
						"icon-image": [
							"case",
							[
								"==",
								["get", "military"],
								true
							],
							"plane-cargo",
							"plane-icon"
						],
						"icon-size": [
							"interpolate",
							["linear"],
							["zoom"],
							3,
							.85,
							6,
							1.25,
							10,
							1.55
						],
						"icon-rotate": ["to-number", ["get", "track"]],
						"icon-rotation-alignment": "map",
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
						"text-field": [
							"step",
							["zoom"],
							"",
							6.2,
							["get", "label"]
						],
						"text-size": 11,
						"text-offset": [0, 1.35]
					},
					paint: {
						"text-color": "#e8f6ee",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.2
					}
				});
				map.addSource("vessels", {
					type: "geojson",
					data: vesselData(allVessels())
				});
				map.addLayer({
					id: "vessels",
					type: "circle",
					source: "vessels",
					paint: {
						"circle-radius": 4,
						"circle-color": "#7ec8b3",
						"circle-opacity": .55
					}
				});
				map.addLayer({
					id: "vessels-icon",
					type: "symbol",
					source: "vessels",
					layout: {
						"icon-image": "ship-icon",
						"icon-size": [
							"interpolate",
							["linear"],
							["zoom"],
							3,
							.7,
							7,
							1.15
						],
						"icon-rotate": ["to-number", ["get", "cog"]],
						"icon-rotation-alignment": "map",
						"icon-allow-overlap": true,
						"text-field": [
							"step",
							["zoom"],
							"",
							5.6,
							["get", "name"]
						],
						"text-size": 10,
						"text-offset": [0, 1.3]
					},
					paint: {
						"text-color": "#9adbb8",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.1
					}
				});
				map.addSource("sea-lanes", {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: SEA_LANES.map((l) => ({
							type: "Feature",
							properties: { name: l.name },
							geometry: {
								type: "LineString",
								coordinates: l.coords
							}
						}))
					}
				});
				map.addLayer({
					id: "sea-lanes",
					type: "line",
					source: "sea-lanes",
					paint: {
						"line-color": "#7ec8b3",
						"line-width": 1.2,
						"line-opacity": .4,
						"line-dasharray": [4, 3]
					}
				});
				map.addSource("corridors", {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: CORRIDORS.map((c) => ({
							type: "Feature",
							properties: { name: c.name },
							geometry: {
								type: "LineString",
								coordinates: c.coordinates
							}
						}))
					}
				});
				map.addLayer({
					id: "corridors",
					type: "line",
					source: "corridors",
					paint: {
						"line-color": "#7ec8b3",
						"line-width": 1.4,
						"line-opacity": .45,
						"line-dasharray": [2, 2]
					}
				});
				const partyOf = (id) => overridesNow[id]?.party ?? SITES.find((s) => s.id === id)?.party ?? "unknown";
				map.addSource("sites", {
					type: "geojson",
					data: siteFc(partyOf, kindNow)
				});
				map.addLayer({
					id: "sites",
					type: "circle",
					source: "sites",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							4,
							3.2,
							8,
							7.5,
							16,
							12
						],
						"circle-color": [
							"match",
							["get", "party"],
							"saf",
							PARTY_COLOR.saf ?? "#8a857c",
							"rsf",
							PARTY_COLOR.rsf ?? "#8a857c",
							"mixed",
							PARTY_COLOR.mixed ?? "#8a857c",
							"other_armed",
							PARTY_COLOR.other_armed ?? "#8a857c",
							"civilian",
							PARTY_COLOR.civilian ?? "#8a857c",
							PARTY_COLOR.unknown ?? "#8a857c"
						],
						"circle-stroke-width": 1.8,
						"circle-stroke-color": "#12110f"
					}
				});
				map.addSource("control", {
					type: "geojson",
					data: controlFc(state.theaterId)
				});
				map.addLayer({
					id: "control-fill",
					type: "fill",
					source: "control",
					paint: {
						"fill-color": [
							"match",
							["get", "faction"],
							"saf",
							FACTION_META.saf.color,
							"rsf",
							FACTION_META.rsf.color,
							"splm-n",
							FACTION_META["splm-n"].color,
							FACTION_META.contested.color
						],
						"fill-opacity": .22
					}
				}, "sites");
				map.addLayer({
					id: "control-line",
					type: "line",
					source: "control",
					filter: [
						"!=",
						["get", "faction"],
						"contested"
					],
					paint: {
						"line-color": [
							"match",
							["get", "faction"],
							"saf",
							FACTION_META.saf.color,
							"rsf",
							FACTION_META.rsf.color,
							"splm-n",
							FACTION_META["splm-n"].color,
							FACTION_META.contested.color
						],
						"line-width": 2.8,
						"line-opacity": .95
					}
				}, "sites");
				map.addLayer({
					id: "control-line-dash",
					type: "line",
					source: "control",
					filter: [
						"==",
						["get", "faction"],
						"contested"
					],
					paint: {
						"line-color": FACTION_META.contested.color,
						"line-width": 2.8,
						"line-opacity": .95,
						"line-dasharray": [2.4, 1.6]
					}
				}, "sites");
				const cities = mergedControlCities(state.controlUpdates);
				map.addSource("control-cities", {
					type: "geojson",
					data: pointFc(cities, (c) => ({
						name: c.name,
						faction: c.faction
					}))
				});
				map.addLayer({
					id: "control-cities",
					type: "circle",
					source: "control-cities",
					paint: {
						"circle-radius": 4.5,
						"circle-color": [
							"match",
							["get", "faction"],
							"saf",
							FACTION_META.saf.color,
							"rsf",
							FACTION_META.rsf.color,
							FACTION_META.contested.color
						],
						"circle-stroke-width": 1.5,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addSource("control-labels", {
					type: "geojson",
					data: controlLabelFc(state.theaterId)
				});
				map.addLayer({
					id: "control-labels",
					type: "symbol",
					source: "control-labels",
					layout: {
						"text-field": ["get", "label"],
						"text-size": 11,
						"text-allow-overlap": false
					},
					paint: {
						"text-color": "#e8f6ee",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.4
					}
				});
				map.addSource("vista-zones", {
					type: "geojson",
					data: vistaZonesFc()
				});
				map.addLayer({
					id: "vista-fill",
					type: "fill",
					source: "vista-zones",
					paint: {
						"fill-color": ["get", "color"],
						"fill-opacity": .32
					}
				}, "sites");
				map.addLayer({
					id: "vista-line",
					type: "line",
					source: "vista-zones",
					paint: {
						"line-color": ["get", "color"],
						"line-width": 1.8,
						"line-opacity": .95
					}
				}, "sites");
				map.addSource("vista-div", {
					type: "geojson",
					data: vistaDivFc()
				});
				map.addLayer({
					id: "vista-div",
					type: "circle",
					source: "vista-div",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							4,
							4.2,
							10,
							8
						],
						"circle-color": [
							"match",
							["get", "party"],
							"saf",
							"#3d8b3d",
							"rsf",
							"#c9a227",
							"#8a857c"
						],
						"circle-stroke-width": 1.6,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addLayer({
					id: "vista-div-label",
					type: "symbol",
					source: "vista-div",
					minzoom: 5.6,
					layout: {
						"text-field": ["get", "name"],
						"text-size": 10,
						"text-offset": [0, 1.15],
						"text-anchor": "top",
						"text-allow-overlap": false
					},
					paint: {
						"text-color": "#e8f6ee",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.3
					}
				});
				map.addSource("osint-reports", {
					type: "geojson",
					data: pointFc(reports, (r) => ({
						name: r.title,
						category: r.category
					}))
				});
				map.addLayer({
					id: "osint-reports",
					type: "circle",
					source: "osint-reports",
					paint: {
						"circle-radius": 6,
						"circle-color": "#ece8e1",
						"circle-stroke-width": 2,
						"circle-stroke-color": "#b45a3c"
					}
				});
				map.addSource("news-pts", {
					type: "geojson",
					data: pointFc(newsPoints, (r) => ({
						name: r.name,
						count: r.count
					}))
				});
				map.addLayer({
					id: "news-pts",
					type: "circle",
					source: "news-pts",
					paint: {
						"circle-radius": [
							"interpolate",
							["linear"],
							["get", "count"],
							1,
							5,
							8,
							11
						],
						"circle-color": "#8ec8ff",
						"circle-opacity": .8,
						"circle-stroke-width": 1.2,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addSource("ai-pts", {
					type: "geojson",
					data: pointFc(aiEvents.filter((e) => e.lat != null && e.lon != null), (r) => ({
						name: r.headline,
						confidence: r.confidence
					}))
				});
				map.addLayer({
					id: "ai-pts",
					type: "circle",
					source: "ai-pts",
					paint: {
						"circle-radius": 6,
						"circle-color": [
							"match",
							["get", "confidence"],
							"corroborated",
							"#7d9a7a",
							"reported",
							"#c4894a",
							"#b45a3c"
						],
						"circle-stroke-width": 1.5,
						"circle-stroke-color": "#12110f"
					}
				});
				map.addSource("gdelt", {
					type: "geojson",
					data: pointFc(gdelt, (r) => ({
						name: r.name,
						subtype: r.subtype
					}))
				});
				map.addLayer({
					id: "gdelt-glow",
					type: "circle",
					source: "gdelt",
					paint: {
						"circle-radius": 10,
						"circle-color": "#b45a3c",
						"circle-opacity": .2,
						"circle-blur": .6
					}
				});
				map.addLayer({
					id: "gdelt",
					type: "circle",
					source: "gdelt",
					paint: {
						"circle-radius": 4,
						"circle-color": "#b45a3c",
						"circle-stroke-width": 1.2,
						"circle-stroke-color": "#ece8e1"
					}
				});
				map.addSource("osm", {
					type: "geojson",
					data: pointFc(osm.filter(isUsefulOsm), (r) => ({
						name: r.name,
						kind: r.kind
					}))
				});
				map.addLayer({
					id: "osm",
					type: "circle",
					source: "osm",
					paint: {
						"circle-radius": 3.2,
						"circle-color": "#7b93a6",
						"circle-stroke-width": 1,
						"circle-stroke-color": "#12110f"
					}
				});
				map.addSource("brief-anno", {
					type: "geojson",
					data: annoFc([])
				});
				map.addLayer({
					id: "brief-fill",
					type: "fill",
					source: "brief-anno",
					filter: [
						"==",
						["geometry-type"],
						"Polygon"
					],
					layout: { visibility: "none" },
					paint: {
						"fill-color": [
							"coalesce",
							["get", "color"],
							"#d4a017"
						],
						"fill-opacity": .18
					}
				});
				map.addLayer({
					id: "brief-line",
					type: "line",
					source: "brief-anno",
					filter: [
						"==",
						["geometry-type"],
						"Polygon"
					],
					layout: { visibility: "none" },
					paint: {
						"line-color": [
							"coalesce",
							["get", "color"],
							"#d4a017"
						],
						"line-width": 1.6,
						"line-dasharray": [2, 1.4]
					}
				});
				map.addLayer({
					id: "brief-pts",
					type: "circle",
					source: "brief-anno",
					filter: [
						"==",
						["geometry-type"],
						"Point"
					],
					layout: { visibility: "none" },
					paint: {
						"circle-radius": 5.5,
						"circle-color": [
							"coalesce",
							["get", "color"],
							"#d4a017"
						],
						"circle-stroke-width": 1.5,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addSource("rsf-watch", {
					type: "geojson",
					data: pointFc(rsfWatchResolved(), (r) => ({
						id: r.siteId ?? r.id,
						name: r.name,
						why: r.why,
						watch: r.watch,
						note: r.note
					}))
				});
				map.addLayer({
					id: "rsf-watch-glow",
					type: "circle",
					source: "rsf-watch",
					paint: {
						"circle-radius": [
							"match",
							["get", "watch"],
							"primary",
							14,
							10
						],
						"circle-color": "#b38862",
						"circle-opacity": .22,
						"circle-blur": .4
					}
				});
				map.addLayer({
					id: "rsf-watch",
					type: "circle",
					source: "rsf-watch",
					paint: {
						"circle-radius": [
							"match",
							["get", "watch"],
							"primary",
							6.5,
							4.5
						],
						"circle-color": "#b38862",
						"circle-stroke-width": 1.6,
						"circle-stroke-color": "#12110f"
					}
				});
				map.addSource("detections", {
					type: "geojson",
					data: detectFc(detections)
				});
				map.addLayer({
					id: "detect-fill",
					type: "fill",
					source: "detections",
					filter: [
						"==",
						["geometry-type"],
						"Polygon"
					],
					layout: { visibility: "none" },
					paint: {
						"fill-color": [
							"coalesce",
							["get", "color"],
							"#d4a017"
						],
						"fill-opacity": .16
					}
				});
				map.addLayer({
					id: "detect-line",
					type: "line",
					source: "detections",
					filter: [
						"==",
						["geometry-type"],
						"Polygon"
					],
					layout: { visibility: "none" },
					paint: {
						"line-color": [
							"coalesce",
							["get", "color"],
							"#d4a017"
						],
						"line-width": 1.8,
						"line-dasharray": [2, 1.2]
					}
				});
				map.addLayer({
					id: "detect-pts",
					type: "circle",
					source: "detections",
					filter: [
						"==",
						["geometry-type"],
						"Point"
					],
					layout: { visibility: "none" },
					paint: {
						"circle-radius": 5,
						"circle-color": [
							"coalesce",
							["get", "color"],
							"#d4a017"
						],
						"circle-stroke-width": 1.4,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addSource("fuae", {
					type: "geojson",
					data: pointFc([], (r) => ({
						title: r.title,
						kind: r.kind,
						why: r.why,
						dest: r.dest
					}))
				});
				map.addLayer({
					id: "fuae-glow",
					type: "circle",
					source: "fuae",
					paint: {
						"circle-radius": 11,
						"circle-color": [
							"match",
							["get", "kind"],
							"air",
							"#e2a15a",
							"#7ec8b3"
						],
						"circle-opacity": .28,
						"circle-blur": .45
					}
				});
				map.addLayer({
					id: "fuae-pts",
					type: "circle",
					source: "fuae",
					paint: {
						"circle-radius": 5.5,
						"circle-color": [
							"match",
							["get", "kind"],
							"air",
							"#e2a15a",
							"#7ec8b3"
						],
						"circle-stroke-width": 1.6,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addSource("hazards", {
					type: "geojson",
					data: pointFc(useHazardState.getState().feed?.events ?? [], (r) => ({ ...r }))
				});
				map.addLayer({
					id: "hazards",
					type: "circle",
					source: "hazards",
					paint: {
						"circle-radius": 6,
						"circle-color": "#79c6df",
						"circle-stroke-color": "#13202b",
						"circle-stroke-width": 2
					}
				});
				map.addSource("measure", {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				});
				map.addLayer({
					id: "measure-line",
					type: "line",
					source: "measure",
					paint: {
						"line-color": "#d8d2c6",
						"line-width": 2,
						"line-dasharray": [2, 1]
					}
				});
				ready.current = true;
				setMapReady(true);
				setEngine("gl");
			});
			const bindPopup = (layer, html) => {
				map.on("click", layer, (e) => {
					const feat = e.features?.[0];
					if (!feat || feat.geometry.type !== "Point") return;
					const [lon, lat] = feat.geometry.coordinates;
					hoverPopup.current?.remove();
					hoverPopup.current = new Popup({
						closeButton: true,
						offset: 14,
						className: "sr-popup"
					}).setLngLat([lon, lat]).setHTML(html(feat.properties)).addTo(map);
				});
				map.on("mouseenter", layer, () => {
					if (map) map.getCanvas().style.cursor = "pointer";
				});
				map.on("mouseleave", layer, () => {
					if (map) map.getCanvas().style.cursor = "";
				});
			};
			map.on("click", "sites", (e) => {
				const id = e.features?.[0]?.properties?.id;
				if (id) setSelectedSite(id);
			});
			map.on("click", "hazards", (e) => {
				const f = e.features?.[0];
				if (!f || f.geometry.type !== "Point") return;
				const p = f.properties ?? {}, body = document.createElement("div");
				body.style.cssText = "font:12px/1.5 system-ui;max-width:260px";
				const title = document.createElement("strong");
				title.textContent = String(p.title ?? "Natural event");
				body.append(title);
				const detail = document.createElement("p");
				detail.textContent = `${p.provider} · ${p.at} · ${p.severity}`;
				body.append(detail);
				const link = document.createElement("a");
				link.textContent = "Published source";
				link.href = String(p.url);
				link.target = "_blank";
				link.rel = "noopener noreferrer";
				body.append(link);
				hoverPopup.current?.remove();
				hoverPopup.current = new Popup({
					closeButton: true,
					offset: 14
				}).setLngLat(f.geometry.coordinates).setDOMContent(body).addTo(map);
			});
			bindPopup("sites", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name ?? ""}</div>`);
			bindPopup("flights-icon", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.label ?? p.hex}<div style="opacity:.7;font-size:11px">ADS-B · not a cargo claim</div></div>`);
			bindPopup("vessels-icon", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name}<div style="opacity:.7;font-size:11px">${p.kind === "lane" ? "Documented lane marker — not live AIS" : "Port node — not live AIS"}</div></div>`);
			bindPopup("news-pts", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name} · ${p.count} headlines<div style="opacity:.7;font-size:11px">Named-place centroid</div></div>`);
			bindPopup("brief-pts", (p) => `<div style="max-width:260px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.title}</div><div style="opacity:.75;font-size:11px;margin-top:4px">${p.claim} · ${p.confidence}</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.paragraph ?? ""}</div><div style="opacity:.65;font-size:10px;margin-top:6px">${p.sources ?? ""}</div></div>`);
			bindPopup("rsf-watch", (p) => `<div style="max-width:260px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.name}</div><div style="opacity:.75;font-size:11px;margin-top:4px">RSF watch · ${p.why} · observation</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.note ?? ""}</div></div>`);
			bindPopup("vista-div", (p) => `<div style="max-width:280px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.name}</div><div style="opacity:.7;font-size:11px;margin-top:4px">${p.place ?? ""} · ${p.party === "rsf" ? "Amber pin on source map (RSF-held in copy)" : "Green pin on source map (SAF-held in copy)"}</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.note ?? ""}</div><div style="opacity:.65;font-size:10px;margin-top:6px">Vista copy · ${p.nameAr ?? ""} · not occupancy</div></div>`);
			map.on("click", "vista-fill", (e) => {
				const p = e.features?.[0]?.properties;
				if (!p || !map) return;
				hoverPopup.current?.remove();
				hoverPopup.current = new Popup({
					closeButton: true,
					offset: 10,
					className: "sr-popup"
				}).setLngLat(e.lngLat).setHTML(`<div style="max-width:280px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.name}</div><div style="opacity:.75;font-size:11px;margin-top:4px">Vista copy control polygon</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.note ?? ""}</div><div style="opacity:.65;font-size:10px;margin-top:6px">Compiled control — not a live frontline.</div></div>`).addTo(map);
			});
			map.on("click", "vista-div", (e) => {
				const feat = e.features?.[0];
				if (!feat || feat.geometry.type !== "Point") return;
				const [lon, lat] = feat.geometry.coordinates;
				const name = feat.properties?.name;
				setFlyTarget({
					lat,
					lon,
					zoom: 12.4,
					label: name
				});
			});
			map.on("click", "rsf-watch", (e) => {
				const id = e.features?.[0]?.properties?.id;
				if (id) setSelectedSite(id);
			});
			bindPopup("fuae-pts", (p) => `<div style="max-width:260px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.title}</div><div style="opacity:.75;font-size:11px;margin-top:4px">FUAE · ${p.kind} · ${p.dest}</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.why ?? ""}</div><div style="opacity:.65;font-size:10px;margin-top:6px">Public track — not a cargo claim.</div></div>`);
			map.on("click", "detect-fill", (e) => {
				const id = e.features?.[0]?.properties?.siteId;
				if (id) setSelectedSite(id);
			});
			map.on("click", "osint-reports", (e) => {
				const id = e.features?.[0]?.properties?.id;
				if (id) setSelectedReport(id);
			});
			map.on("click", "control-fill", (e) => {
				const p = e.features?.[0]?.properties;
				if (!p || !map) return;
				hoverPopup.current?.remove();
				hoverPopup.current = new Popup({
					closeButton: true,
					offset: 10,
					className: "sr-popup"
				}).setLngLat(e.lngLat).setHTML(`<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.label}<div style="opacity:.7;font-size:11px;font-weight:400">${p.note}<br/>Compiled control — not a live frontline.</div></div>`).addTo(map);
			});
			map.on("mousemove", (e) => {
				const z = map?.getZoom() ?? 0;
				setCursor(`${e.lngLat.lat.toFixed(4)}°  ${e.lngLat.lng.toFixed(4)}°  z${z.toFixed(1)}`);
			});
			onCmd = (ev) => {
				const cmd = ev.detail;
				if (!map) return;
				const z = map.getZoom() + (cmd === "in" ? 1.4 : -1.4);
				map.easeTo({
					zoom: z,
					pitch: pitchForZoom(z),
					duration: 780,
					easing: spyEase,
					essential: true
				});
			};
			onFit = (ev) => {
				const b = ev.detail;
				map?.fitBounds([[b.west, b.south], [b.east, b.north]], {
					padding: 48,
					duration: 1400,
					maxZoom: b.maxZoom ?? 11.5,
					pitch: b.pitch ?? 8,
					essential: true
				});
			};
			const measurePts = [];
			onMeasure = () => {
				measurePts.length = 0;
				const src = map?.getSource("measure");
				src?.setData({
					type: "FeatureCollection",
					features: []
				});
				const click = (e) => {
					measurePts.push([e.lngLat.lng, e.lngLat.lat]);
					if (measurePts.length >= 2) {
						src?.setData({
							type: "FeatureCollection",
							features: [{
								type: "Feature",
								properties: {},
								geometry: {
									type: "LineString",
									coordinates: measurePts
								}
							}]
						});
						map?.off("click", click);
					}
				};
				map?.on("click", click);
			};
			window.addEventListener("sahel-map", onCmd);
			window.addEventListener("sahel-map-fit", onFit);
			window.addEventListener("sahel-map-measure", onMeasure);
			onNudge = (ev) => {
				const d = ev.detail;
				if (!map) return;
				if (d.reset) {
					map.easeTo({
						bearing: 0,
						pitch: 0,
						duration: 700,
						easing: spyEase
					});
					return;
				}
				if (d.bearing) map.easeTo({
					bearing: map.getBearing() + d.bearing,
					duration: 650,
					easing: spyEase
				});
			};
			window.addEventListener("sahel-map-nudge", onNudge);
			map.doubleClickZoom.disable();
			map.on("dblclick", (e) => {
				if (!map) return;
				cinematicFly(map, {
					lon: e.lngLat.lng,
					lat: e.lngLat.lat,
					zoom: Math.min(17.4, map.getZoom() + 2.7),
					label: "DESCEND"
				});
			});
			if (wrap.current && typeof ResizeObserver !== "undefined") {
				ro = new ResizeObserver(() => map?.resize());
				ro.observe(wrap.current);
			}
			requestAnimationFrame(() => map?.resize());
		}).catch((err) => {
			console.warn("[map] MapLibre failed, keeping static satellite", err);
			setEngine("static");
		});
		const failSafe = window.setTimeout(() => {
			if (!ready.current) setEngine("static");
		}, 12e3);
		return () => {
			cancelled = true;
			ready.current = false;
			window.clearTimeout(failSafe);
			if (onCmd) window.removeEventListener("sahel-map", onCmd);
			if (onFit) window.removeEventListener("sahel-map-fit", onFit);
			if (onMeasure) window.removeEventListener("sahel-map-measure", onMeasure);
			if (onNudge) window.removeEventListener("sahel-map-nudge", onNudge);
			hoverPopup.current?.remove();
			ro?.disconnect();
			map?.remove();
			mapRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !mapReady) return;
		for (const id of [
			"civilian-change-labels",
			"civilian-change-lines",
			"civilian-scene-layer"
		]) if (map.getLayer(id)) map.removeLayer(id);
		for (const id of ["civilian-changes", "civilian-scene"]) if (map.getSource(id)) map.removeSource(id);
		if (!analysisOverlay) return;
		map.addSource("civilian-scene", {
			type: "image",
			url: analysisOverlay.image,
			coordinates: analysisOverlay.corners
		});
		map.addLayer({
			id: "civilian-scene-layer",
			type: "raster",
			source: "civilian-scene",
			paint: {
				"raster-opacity": 1,
				"raster-fade-duration": 0
			}
		});
		map.addSource("civilian-changes", {
			type: "geojson",
			data: analysisOverlay.features
		});
		map.addLayer({
			id: "civilian-change-lines",
			type: "line",
			source: "civilian-changes",
			paint: {
				"line-color": "#ffbf69",
				"line-width": 2
			}
		});
		map.addLayer({
			id: "civilian-change-labels",
			type: "symbol",
			source: "civilian-changes",
			layout: {
				"text-field": ["get", "label"],
				"text-size": 12,
				"text-allow-overlap": true
			},
			paint: {
				"text-color": "#ffddaa",
				"text-halo-color": "#102022",
				"text-halo-width": 2
			}
		});
		const onCandidate = (e) => {
			const id = e.features?.[0]?.properties?.reviewMarkId;
			if (id) window.dispatchEvent(new CustomEvent("civilian-candidate-select", { detail: id }));
		};
		map.on("click", "civilian-change-lines", onCandidate);
		map.on("click", "civilian-change-labels", onCandidate);
		return () => {
			map.off("click", "civilian-change-lines", onCandidate);
			map.off("click", "civilian-change-labels", onCandidate);
		};
	}, [analysisOverlay, mapReady]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		map.setPadding(hudPad(panelOpen));
		map.resize();
	}, [panelOpen]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const visOn = (on) => on ? "visible" : "none";
		const setVis = (id, on) => {
			if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visOn(on));
		};
		setVis("esri", imagery === "hires" || imagery === "s2" || imagery === "viirs");
		setVis("gmaps", imagery === "gmaps");
		setVis("dark", imagery === "dark");
		setVis("dark-ref", imagery === "dark");
		setVis("viirs", imagery === "viirs");
		setVis("hls", imagery === "s2");
		setVis("s2cloudless", imagery === "s2cloudless");
		setVis("thermal-raster", layers.thermalRaster);
		setVis("boxes-fill", layers.boxes);
		setVis("boxes-line", layers.boxes);
		setVis("firms-glow", layers.firms);
		setVis("firms-core", layers.firms);
		setVis("flights", layers.flights);
		setVis("flights-icon", layers.flights);
		setVis("vessels", layers.vessels);
		setVis("vessels-icon", layers.vessels);
		setVis("sea-lanes", layers.vessels);
		setVis("corridors", layers.corridors);
		setVis("rsf-watch", layers.rsfWatch);
		setVis("rsf-watch-glow", layers.rsfWatch);
		const controlOn = layers.control && imagery === "dark";
		setVis("control-fill", controlOn);
		setVis("control-line", controlOn);
		setVis("control-line-dash", controlOn);
		setVis("control-cities", controlOn);
		setVis("control-labels", controlOn);
		if (map.getLayer("control-fill")) map.setPaintProperty("control-fill", "fill-opacity", .22);
		const vistaOn = layers.vista !== false;
		setVis("vista-fill", vistaOn && imagery === "dark");
		setVis("vista-line", vistaOn);
		setVis("vista-div", vistaOn);
		setVis("vista-div-label", vistaOn);
		setVis("osint-reports", layers.reports);
		setVis("news-pts", layers.news);
		setVis("hazards", layers.hazards);
		setVis("ai-pts", layers.ai);
		setVis("gdelt", layers.gdelt);
		setVis("gdelt-glow", layers.gdelt);
		setVis("osm", layers.osm);
		setVis("brief-fill", briefingOn);
		setVis("brief-line", briefingOn);
		setVis("brief-pts", briefingOn);
		setVis("detect-fill", detectOn);
		setVis("detect-line", detectOn);
		setVis("detect-pts", detectOn);
	}, [
		layers,
		imagery,
		briefingOn,
		detectOn,
		mapReady
	]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		map.getSource("viirs")?.setTiles?.([viirsUrl(date)]);
		map.getSource("hls")?.setTiles?.([hlsUrl(date)]);
		map.getSource("thermal-raster")?.setTiles?.([thermalUrl(date)]);
	}, [date]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("boxes");
		if (src && "setData" in src) src.setData(boxFc(boxes));
	}, [boxes]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("firms");
		if (src && "setData" in src) src.setData(pointFc(firms, (r) => ({
			klass: r.klass,
			frp: r.frp,
			live: !!r.live
		})));
	}, [firms]);
	(0, import_react.useEffect)(() => {
		flightSnap.current = {
			rows: flights,
			at: Date.now()
		};
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("flights");
		if (src && "setData" in src) src.setData(flightData(flights));
	}, [flights]);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			const map = mapRef.current;
			if (!map || !ready.current) return;
			const { rows, at } = flightSnap.current;
			const dt = (Date.now() - at) / 1e3;
			const fs = map.getSource("flights");
			if (fs && "setData" in fs) fs.setData(flightData(rows.map((f) => deadReckon(f, dt))));
			const vs = map.getSource("vessels");
			if (vs && "setData" in vs) vs.setData(vesselData(allVessels(Date.now())));
		}, 700);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("control");
		if (src && "setData" in src) src.setData(controlFc(theaterId));
		const ls = map.getSource("control-labels");
		if (ls && "setData" in ls) ls.setData(controlLabelFc(theaterId));
		const cities = mergedControlCities(controlUpdates);
		const cs = map.getSource("control-cities");
		if (cs && "setData" in cs) cs.setData(pointFc(cities, (c) => ({
			name: c.name,
			faction: c.faction
		})));
	}, [theaterId, controlUpdates]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("brief-anno");
		if (src && "setData" in src) src.setData(annoFc(annotations));
	}, [annotations]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("detections");
		if (src && "setData" in src) src.setData(detectFc(detections));
	}, [detections, mapReady]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("fuae");
		if (src && "setData" in src) src.setData(pointFc(fuae, (r) => ({
			title: r.title,
			kind: r.kind,
			why: r.why,
			dest: r.dest
		})));
	}, [fuae]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("news-pts");
		if (src && "setData" in src) src.setData(pointFc(newsPoints, (r) => ({
			name: r.name,
			count: r.count
		})));
	}, [newsPoints]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !mapReady) return;
		const source = map.getSource("hazards");
		if (source && "setData" in source) source.setData({
			type: "FeatureCollection",
			features: (hazardFeed?.events ?? []).map((e) => ({
				type: "Feature",
				properties: { ...e },
				geometry: {
					type: "Point",
					coordinates: [e.lon, e.lat]
				}
			}))
		});
	}, [hazardFeed, mapReady]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const partyOf = (id) => partyOverrides[id]?.party ?? SITES.find((s) => s.id === id)?.party ?? "unknown";
		const data = siteFc(partyOf, kindFilter);
		if (partyFilter !== "all") data.features = data.features.filter((f) => f.properties.party === partyFilter);
		const src = map.getSource("sites");
		if (src && "setData" in src) src.setData(data);
	}, [
		partyOverrides,
		partyFilter,
		kindFilter
	]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !selectedSiteId) return;
		const site = SITES.find((s) => s.id === selectedSiteId);
		if (!site) return;
		const close = yardsZoom || CLOSE_KINDS.has(site.kind);
		cinematicFly(map, {
			lon: site.lon,
			lat: site.lat,
			zoom: yardsZoom ? 17.2 : close ? 16.2 : 14.8,
			label: site.name
		});
		if (yardsZoom) clearYardsZoom();
	}, [
		selectedSiteId,
		yardsZoom,
		clearYardsZoom
	]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !focusedBoxId) return;
		const box = boxes.find((b) => b.id === focusedBoxId);
		if (!box) return;
		map.fitBounds([[box.west, box.south], [box.east, box.north]], {
			padding: 48,
			duration: 1400,
			maxZoom: 11.8,
			pitch: 12,
			essential: true
		});
	}, [focusedBoxId, boxes]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !flyTarget) return;
		if (flyTarget.west != null && flyTarget.south != null && flyTarget.east != null && flyTarget.north != null) cinematicFit(map, {
			west: flyTarget.west,
			south: flyTarget.south,
			east: flyTarget.east,
			north: flyTarget.north,
			zoom: flyTarget.zoom,
			label: flyTarget.label
		});
		else cinematicFly(map, {
			lon: flyTarget.lon,
			lat: flyTarget.lat,
			zoom: flyTarget.zoom,
			label: flyTarget.label
		});
		setFlyTarget(null);
	}, [flyTarget, setFlyTarget]);
	(0, import_react.useEffect)(() => {
		const t = THEATER_BY_ID[theaterId];
		const map = mapRef.current;
		if (!map || !ready.current || !t) return;
		map.fitBounds([[t.west, t.south], [t.east, t.north]], {
			padding: 40,
			duration: 1600,
			maxZoom: t.zoom,
			pitch: 6,
			essential: true
		});
	}, [theaterId]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !mapReady || !orbitOn) return;
		let raf = 0;
		let last = performance.now();
		const tick = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			map.setBearing(map.getBearing() + dt * 5.5);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		const stop = () => setOrbitOn(false);
		map.on("mousedown", stop);
		map.on("wheel", stop);
		return () => {
			cancelAnimationFrame(raf);
			map.off("mousedown", stop);
			map.off("wheel", stop);
		};
	}, [
		orbitOn,
		mapReady,
		setOrbitOn
	]);
	const grain = imagery === "s2" ? `S2 HLS ${date}` : imagery === "viirs" ? `VIIRS ${date}` : imagery === "s2cloudless" ? "S2 mosaic 2024" : imagery === "gmaps" ? "Google satellite" : imagery === "dark" ? "Dark context" : "High-res Esri";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrap,
		className: "absolute inset-0 z-0 bg-bg",
		children: [
			engine !== "gl" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaticSatellite, {
				date,
				boxes,
				firms,
				flights,
				onPick: setSelectedSite
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: host,
				className: cn("h-full w-full", engine !== "gl" && "pointer-events-none opacity-0")
			}),
			engine === "gl" && mapReady && imagery === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookFx, {
				mapRef,
				flights,
				detections
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute bottom-28 left-3 hidden rounded-full border border-border bg-bg/80 px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted md:block",
				children: [
					cursor,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mx-1.5 text-subtle",
						children: "·"
					}),
					grain
				]
			})
		]
	});
}
var CAVEAT = `LIMITATIONS — Abu Hureirah Situation Room (Sudan Wing) is a documentation archive, not a targeting system.
- Sentinel-2 10 m cannot distinguish pickup vs technical vs civilian 4x4.
- NASA FIRMS is a thermal-anomaly feed (375 m), not a strike feed. Agricultural burning, flares, and brick kilns are common false combat cues.
- ADS-B coverage in Sudan and adjacent desert corridors is sparse. Absence of a track is not absence of a flight. Never infer cargo contents.
- Party labels and control shading are assessments. They are not confirmed occupancy. Default new detections to confidence 1–2.
- Control polygons are regional and time-bounded. Confirmed analyst clicks shift city markers — they do not draw a new frontline.
- Nothing is “confirmed” without a human review click.
- Forbidden: targeting, fire control, strike planning, kill-chain language.`;
function day() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function geojsonBody() {
	const overrides = useAppStore.getState().partyOverrides;
	const updates = useAppStore.getState().controlUpdates;
	const cities = mergedControlCities(updates);
	const fc = {
		type: "FeatureCollection",
		metadata: {
			generated: (/* @__PURE__ */ new Date()).toISOString(),
			caveat: CAVEAT
		},
		features: [
			...SITES.map((s) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [s.lon, s.lat]
				},
				properties: {
					layer: "site",
					site_id: s.id,
					name: s.name,
					kind: s.kind,
					party: overrides[s.id]?.party ?? s.party,
					party_label: PARTY_LABEL[overrides[s.id]?.party ?? s.party],
					confidence: s.confidence,
					status: s.status,
					admin1: s.admin1,
					civilian_baseline: s.civilianBaseline,
					notes: s.notes
				}
			})),
			...CONTROL_ZONES.map((z) => {
				const ring = z.polygon.map(([lat, lon]) => [lon, lat]);
				const first = ring[0];
				if (first) ring.push(first);
				return {
					type: "Feature",
					geometry: {
						type: "Polygon",
						coordinates: [ring]
					},
					properties: {
						layer: "control-zone",
						id: z.id,
						faction: z.faction,
						label: z.label,
						note: z.note,
						confidence: z.confidence
					}
				};
			}),
			...cities.map((c) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [c.lon, c.lat]
				},
				properties: {
					layer: "control-city",
					id: c.id,
					name: c.name,
					faction: c.faction,
					as_of: c.asOf,
					confidence: c.confidence,
					note: c.note,
					source: c.source
				}
			})),
			...WATCH_BOXES.map((b) => ({
				type: "Feature",
				geometry: {
					type: "Polygon",
					coordinates: [[
						[b.west, b.south],
						[b.east, b.south],
						[b.east, b.north],
						[b.west, b.north],
						[b.west, b.south]
					]]
				},
				properties: {
					layer: "watch-box",
					id: b.id,
					name: b.name,
					notes: b.notes
				}
			}))
		]
	};
	return JSON.stringify(fc, null, 2);
}
function csvBody() {
	const overrides = useAppStore.getState().partyOverrides;
	const reviews = useAppStore.getState().reviews;
	const log = useAppStore.getState().changeLog;
	const cities = mergedControlCities(useAppStore.getState().controlUpdates);
	const siteLines = ["site_id,name,lat,lon,kind,party,confidence,status,admin1", ...SITES.map((s) => {
		const party = overrides[s.id]?.party ?? s.party;
		return `${s.id},"${s.name.replace(/"/g, "'")}",${s.lat},${s.lon},${s.kind},${party},${s.confidence},${s.status},"${s.admin1.replace(/"/g, "'")}"`;
	})];
	const alertLines = ["alert_id,type,confidence,review,lat,lon,title", ...ALERTS.map((a) => {
		const rev = reviews[a.id]?.state ?? a.review;
		return `${a.id},${a.type},${reviews[a.id]?.confidence ?? a.confidence},${rev},${a.lat},${a.lon},"${a.title.replace(/"/g, "'")}"`;
	})];
	const cityLines = ["city,lat,lon,faction,as_of,confidence,note", ...cities.map((c) => `"${c.name}",${c.lat},${c.lon},${c.faction},${c.asOf},${c.confidence},"${c.note.replace(/"/g, "'")}"`)];
	const logLines = ["id,first_seen,title,lat,lon,source,confidence", ...log.slice(0, 400).map((e) => `${e.id},${e.firstSeen.slice(0, 10)},"${e.title.replace(/"/g, "'")}",${e.lat},${e.lon},${e.source},${e.confidence}`)];
	return `# ${CAVEAT.replace(/\n/g, "\n# ")}\n\n# SITES\n${siteLines.join("\n")}\n\n# ALERTS\n${alertLines.join("\n")}\n\n# CONTROL CITIES\n${cityLines.join("\n")}\n\n# CHANGE LOG (first 400)\n${logLines.join("\n")}\n`;
}
function briefingHtml(flights, firms, log) {
	const reviews = useAppStore.getState().reviews;
	const cities = mergedControlCities(useAppStore.getState().controlUpdates);
	const open = ALERTS.filter((a) => (reviews[a.id]?.state ?? a.review) === "unreviewed");
	const recent = [...log].sort((a, b) => b.firstSeen.localeCompare(a.firstSeen)).slice(0, 24);
	const sit = compileSitrep({
		log,
		live: {
			firms,
			firmsMeta: {
				fetchedAt: null,
				recordCount: firms.length,
				status: "ok",
				source: "export",
				note: ""
			},
			flights,
			flightsMeta: {
				fetchedAt: null,
				recordCount: flights.length,
				status: "ok",
				source: "export",
				note: ""
			},
			reports: [],
			reportsMeta: {
				fetchedAt: null,
				recordCount: 0,
				status: "empty",
				source: "export",
				note: ""
			},
			news: [],
			newsPoints: [],
			newsMeta: {
				fetchedAt: null,
				recordCount: 0,
				status: "empty",
				source: "export",
				note: ""
			},
			gdelt: [],
			gdeltMeta: {
				fetchedAt: null,
				recordCount: 0,
				status: "empty",
				source: "export",
				note: ""
			},
			osm: [],
			osmMeta: {
				fetchedAt: null,
				recordCount: 0,
				status: "empty",
				source: "export",
				note: ""
			},
			feeds: [],
			feedsMeta: {
				fetchedAt: null,
				recordCount: 0,
				status: "empty",
				source: "export",
				note: ""
			},
			ticker: [],
			vessels: [],
			vesselsMeta: {
				fetchedAt: null,
				recordCount: 0,
				status: "empty",
				source: "export",
				note: ""
			}
		},
		lastSweepAt: useAppStore.getState().lastSweepAt
	});
	return `<!doctype html>
<html><head><meta charset="utf-8"><title>Abu Hureirah Situation Room briefing</title>
<style>
  body{font:14px/1.5 "IBM Plex Sans",system-ui;color:#1a1916;background:#f6f1e8;margin:32px auto;max-width:720px}
  h1{font:600 28px/1.2 Georgia,serif;margin:0 0 8px}
  .kicker{letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:#6a645a}
  .caveat{border:1px solid #c9c1b2;padding:12px 14px;margin:18px 0;font-size:12px;white-space:pre-wrap}
  h2{font-size:16px;margin:28px 0 8px}
  li{margin:6px 0}
  .meta{font:12px/1.4 ui-monospace,monospace;color:#6a645a}
  footer{margin-top:32px;font-size:11px;color:#6a645a}
  @media print { body{margin:12px} }
</style></head><body>
<p class="kicker">Abu Hureirah Situation Room · Sudan Wing · six-hour documentation brief</p>
<h1>Commander one-pager</h1>
<p>${sit.windowStart.slice(0, 16).replace("T", " ")}–${sit.windowEnd.slice(11, 16)}Z · overall ${sit.overallConfidence} · public data only · no targeting</p>
<div class="caveat">${CAVEAT}</div>
<h2>Bottom line</h2>
<p>${sit.bottomLine}</p>
<h2>Key developments</h2>
<ol>${sit.developments.map((d) => `<li><strong>${d.title}</strong> — ${d.claim} / ${d.confidence} / ${d.significance}. ${d.observed} Assessment: ${d.assessment}</li>`).join("")}</ol>
<h2>Operational picture</h2>
<ul>
<li>Initiative — ${sit.picture.initiative}</li>
<li>Ground — ${sit.picture.ground}</li>
<li>Air — ${sit.picture.air}</li>
<li>Fires — ${sit.picture.fires}</li>
<li>Logistics — ${sit.picture.logistics}</li>
<li>C2 — ${sit.picture.c2}</li>
</ul>
<h2>What it means</h2>
<p>${sit.meaning}</p>
<h2>Political / strategic</h2>
<p>${sit.political}</p>
<h2>Next 24–72 hours</h2>
<p>${sit.forecast.mostLikely}</p>
<ul>${sit.forecast.watch.map((w) => `<li>${w}</li>`).join("")}</ul>
<h2>Control picture (compiled, not live)</h2>
<ul>${cities.map((c) => `<li><strong>${c.name}</strong> — ${c.faction.toUpperCase()} as of ${c.asOf} (${c.confidence}). ${c.note}</li>`).join("")}</ul>
<h2>Unreviewed alerts (${open.length})</h2>
<ol>${open.map((a) => `<li><strong>${a.title}</strong> — ${a.body} Confidence ${a.confidence}/5.</li>`).join("")}</ol>
<h2>Recent log (newest 24)</h2>
<ol>${recent.map((e) => `<li><span class="meta">${e.firstSeen.slice(0, 10)}</span> <strong>${e.title}</strong> — ${e.body.slice(0, 220)}</li>`).join("")}</ol>
<h2>Live ingest snapshot</h2>
<p>FIRMS points in AOI this cycle: ${firms.length}. Live flights: ${flights.filter((f) => f.live).length}. Observations in archive: ${OBSERVATIONS.length}. Sites: ${SITES.length}.</p>
<h2>Methods appendix</h2>
<p>Optical browse via NASA GIBS (VIIRS / HLS). Thermal from NASA FIRMS VIIRS 375 m. Flights from public ADS-B aggregators (adsb.lol, adsb.fi) with OpenSky fallback. Humanitarian corroboration via ReliefWeb. Control shading from compiled open-source maps plus analyst-confirmed city markers. Human review required. Default new detections to confidence 1–2. Analytical language: observation / identification / assessment / judgment. Confidence is not probability.</p>
<footer>Abu Hureirah Situation Room · civilian archive · every page carries this caveat.</footer>
</body></html>`;
}
function filesForExport(flights, firms, log) {
	const d = day();
	return {
		geojson: {
			filename: `ahsr-sites-${d}.geojson`,
			mime: "application/geo+json",
			body: geojsonBody()
		},
		csv: {
			filename: `ahsr-export-${d}.csv`,
			mime: "text/csv",
			body: csvBody()
		},
		briefing: {
			filename: `ahsr-briefing-${d}.html`,
			mime: "text/html",
			body: briefingHtml(flights, firms, log)
		}
	};
}
async function saveExport(file) {
	const blob = new Blob([file.body], { type: file.mime });
	try {
		const nav = navigator;
		const asFile = new File([blob], file.filename, { type: file.mime });
		if (typeof nav.canShare === "function" && nav.canShare({ files: [asFile] }) && nav.share) {
			await nav.share({
				files: [asFile],
				title: file.filename
			});
			return "shared";
		}
	} catch {}
	downloadBlob(file.filename, file.mime, file.body);
	return "downloaded";
}
function exportGeoJSON() {
	const file = filesForExport([], [], []).geojson;
	saveExport(file);
}
function exportCsv() {
	const file = filesForExport([], [], []).csv;
	saveExport(file);
}
function exportBriefing(flights, firms) {
	const file = filesForExport(flights, firms, useAppStore.getState().changeLog).briefing;
	saveExport(file);
}
function catType(cat) {
	if (cat === "strike-damage") return "damage";
	if (cat === "vehicle-buildup") return "convoy";
	if (cat === "air-activity") return "flight";
	if (cat === "control-change") return "change";
	return "report";
}
function reportsToFlags(reports) {
	return reports.map((r) => ({
		id: `flag-rep-${r.id}`,
		title: r.title,
		body: `${r.summary} ${r.sourceLabel}. Observation for review — not an identification.`,
		lat: r.lat,
		lon: r.lon,
		date: `${r.date}T12:00:00Z`,
		type: catType(r.category),
		kind: "published",
		sourceLabel: r.sourceLabel,
		url: r.sourceUrl,
		confidence: r.confidence,
		families: r.category === "strike-damage" ? ["damage", "reporting"] : r.category === "vehicle-buildup" ? ["vehicles", "reporting"] : r.category === "air-activity" ? ["flight", "reporting"] : ["reporting"],
		review: "unreviewed"
	}));
}
function alertsToFlags(alerts) {
	return alerts.map((a) => ({
		id: a.id,
		title: a.title,
		body: a.body,
		lat: a.lat,
		lon: a.lon,
		date: a.datetime,
		type: a.type,
		kind: "archive",
		sourceLabel: "archive",
		confidence: a.confidence,
		families: a.families,
		siteId: a.siteIds[0],
		review: a.review
	}));
}
function detectToFlags(hits) {
	const out = [];
	for (const h of hits) {
		if (h.id.startsWith("det-rep-")) continue;
		const scan = h.id.startsWith("det-scan-");
		if (!(scan || h.hunts.includes("irreg") || h.hunts.includes("rsf") || h.hunts.includes("chain") || h.hunts.includes("fx") || h.hunts.includes("veh") || h.confidence >= 2 && (h.klass === "cargo_yard" || h.klass === "vehicle_park" || h.klass === "maritime" || h.klass === "irregular_pad" || h.klass === "possible_damage" || h.klass === "airfield_activity" || h.klass === "camp_buildup" || h.klass === "burn_scar" || h.klass === "wreck_air" || h.klass === "wreck_bldg"))) continue;
		out.push({
			id: `flag-${h.id}`,
			title: h.title,
			body: h.body,
			lat: h.lat,
			lon: h.lon,
			date: h.date,
			type: h.klass === "possible_damage" || h.klass === "burn_scar" || h.klass === "wreck_air" || h.klass === "wreck_bldg" ? "damage" : h.klass === "airfield_activity" || h.klass === "maritime" ? "flight" : h.klass === "vehicle_park" || h.klass === "cargo_yard" || h.klass === "camp_buildup" ? "convoy" : "change",
			kind: "auto",
			sourceLabel: scan ? "imagery tile sweep" : "auto-find chip",
			confidence: h.confidence,
			families: h.families,
			siteId: h.siteId,
			review: "unreviewed",
			features: h.features,
			klass: h.klass,
			west: h.west,
			south: h.south,
			east: h.east,
			north: h.north,
			modelKlass: h.klass === "camp_buildup" ? "camp" : h.klass === "burn_scar" ? "burn" : h.klass === "wreck_air" ? "wreck_air" : h.klass === "wreck_bldg" ? "wreck_bldg" : h.klass === "vehicle_park" ? "veh" : h.klass === "earthwork" ? "berm" : h.klass === "cargo_yard" ? "cargo" : void 0
		});
	}
	return out.slice(0, 40);
}
function mergeFlags(parts, order = "newest") {
	const map = /* @__PURE__ */ new Map();
	for (const part of parts) for (const f of part) {
		const prev = map.get(f.id);
		if (!prev || f.date > prev.date) map.set(f.id, f);
	}
	const weight = (f) => f.kind === "published" ? 2 : f.kind === "auto" ? 1 : 0;
	return [...map.values()].sort((a, b) => {
		if (order === "newest") {
			const w = weight(b) - weight(a);
			if (w !== 0) return w;
			return b.date.localeCompare(a.date);
		}
		return a.date.localeCompare(b.date);
	});
}
function HazardFeedRows() {
	const { feed, error, loading } = useHazardState();
	const fly = useAppStore((s) => s.setFlyTarget);
	const theaterId = useAppStore((s) => s.theaterId);
	const [global, setGlobal] = (0, import_react.useState)(false);
	const region = THEATER_BY_ID[theaterId];
	const rows = (feed?.events ?? []).filter((e) => global || e.lon >= region.west && e.lon <= region.east && e.lat >= region.south && e.lat <= region.north);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3 border-b border-border p-3",
		"aria-label": "Natural hazards",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-semibold",
					children: "Natural hazards"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => void refreshHazards(),
					disabled: loading,
					className: "text-xs underline",
					children: loading ? "Refreshing…" : "Refresh hazards"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "OSIRIS feed integration · published event locations, not damage findings. Newest first."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: global,
					onChange: (e) => setGlobal(e.target.checked)
				}), "Show worldwide events"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					rows.length,
					" events ",
					global ? "worldwide" : `in the ${region.label} map region`
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				role: "alert",
				className: "text-xs",
				children: [error, ". Previous results may be stale."]
			}),
			feed?.sources.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					s.name,
					": ",
					s.status === "ok" ? `${s.count} events` : s.note
				]
			}, s.name)),
			rows.slice(0, 100).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded border border-border p-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "text-left font-medium hover:underline",
						onClick: () => fly({
							lon: e.lon,
							lat: e.lat,
							zoom: 9,
							label: e.title
						}),
						children: e.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-muted",
						children: [
							e.provider,
							" · ",
							new Date(e.at).toLocaleString(),
							" · ",
							e.severity
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: e.url,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "underline",
						children: "Published source"
					})
				]
			}, e.id)),
			feed && !rows.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs",
				children: "No events returned for this region. This does not establish absence of hazards. Check provider status above."
			})
		]
	});
}
function relative(iso) {
	if (!iso) return "—";
	const mins = Math.round((Date.now() - Date.parse(iso)) / 6e4);
	if (!Number.isFinite(mins)) return "—";
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
	return `${Math.round(mins / 1440)}d ago`;
}
function NewsPanel({ data, loading }) {
	const items = data?.items ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xs font-medium uppercase tracking-wider text-subtle",
					children: "News updates"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[11px] tabular-nums text-muted",
					children: loading && items.length === 0 ? "fetching" : `${items.length} headlines`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] leading-snug text-subtle",
				children: ["Google News wire for Sudan — last 7 days, not conflict-filtered. Headline pins are named-place centroids, not incident coordinates.", data?.meta.fetchedAt ? ` Fetched ${data.meta.fetchedAt.slice(11, 16)}Z.` : ""]
			}),
			loading && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-sm text-muted",
				children: "Loading live news…"
			}) : null,
			!loading && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-sm text-muted",
				children: "No headlines this cycle. Sweep again in a few minutes."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-1.5",
				children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: item.url,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "flex flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 hover:bg-raised",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center justify-between gap-2 text-[11px] text-subtle",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-saf",
							children: item.source
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 font-mono",
							children: relative(item.date)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-start gap-1.5 text-sm leading-snug",
						children: [item.title, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "mt-0.5 size-3 shrink-0 text-subtle" })]
					})]
				}) }, item.id))
			})
		]
	});
}
function FuaePanel({ rows, onOpen }) {
	const air = rows.filter((r) => r.kind === "air");
	const sea = rows.filter((r) => r.kind === "sea");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xs font-medium uppercase tracking-wider text-subtle",
					children: "FUAE"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-[11px] tabular-nums text-muted",
					children: [
						air.length,
						" air · ",
						sea.length,
						" sea"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] leading-snug text-subtle",
				children: "UAE-linked ADS-B and documented UAE–Horn / Red Sea contacts. Route observation from public tracking — not a cargo, weapons, or transfer claim."
			}),
			rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-sm text-muted",
				children: "No UAE→Africa contacts this cycle. ADS-B over the desert is a coverage gap, not a negative."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-1.5",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpen(r),
					className: "flex w-full flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center justify-between gap-2 text-[11px] text-subtle",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: r.kind === "air" ? "text-thermal" : "text-accent",
								children: [r.kind === "air" ? "AIR" : "SEA", r.live ? " · LIVE" : " · archive"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono",
								children: [r.lastSeen.slice(11, 16), "Z"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm leading-snug",
							children: r.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-muted",
							children: [
								r.origin,
								" → ",
								r.dest
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] leading-snug text-subtle",
							children: r.why
						})
					]
				}) }, r.id))
			})
		]
	});
}
function RsfWatchPanel({ onOpen }) {
	const primary = RSF_WATCH.filter((w) => w.watch === "primary");
	const approach = RSF_WATCH.filter((w) => w.watch === "approach");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xs font-medium uppercase tracking-wider text-subtle",
					children: "RSF watchlist"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-[11px] tabular-nums text-muted",
					children: [RSF_WATCH.length, " sites"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] leading-snug text-subtle",
				children: "Public pins associated with RSF in open reporting or as rear/approach nodes (Libya, Chad, Ethiopia / Blue Nile, Darfur). Watch ≠ occupancy. Confirm on Esri / Google. Not a targeting list."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-[10px] font-medium uppercase tracking-wider text-subtle",
				children: "Primary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-1 space-y-1.5",
				children: primary.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpen(w),
					className: "flex w-full flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center justify-between gap-2 text-[11px] text-subtle",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: WHY_LABEL[w.why] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono",
								children: w.lastSeen
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm leading-snug",
							children: w.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-muted",
							children: w.place
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "line-clamp-2 text-[11px] leading-snug text-subtle",
							children: w.note
						})
					]
				}) }, w.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-[10px] font-medium uppercase tracking-wider text-subtle",
				children: "Approach / rear"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-1 space-y-1.5",
				children: approach.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpen(w),
					className: "flex w-full flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center justify-between gap-2 text-[11px] text-subtle",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: WHY_LABEL[w.why] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono",
								children: w.lastSeen
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm leading-snug",
							children: w.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "line-clamp-2 text-[11px] leading-snug text-subtle",
							children: w.note
						})
					]
				}) }, w.id))
			})
		]
	});
}
var TONE_DOT = {
	civilian: "bg-civilian",
	saf: "bg-saf",
	damage: "bg-damage",
	other: "bg-other",
	rsf: "bg-rsf",
	thermal: "bg-thermal"
};
function FeedsPanel({ items, meta }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HazardFeedRows, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] leading-snug text-subtle",
				children: ["Public Telegram web previews (t.me/s). Not a login, not a targeting feed.", meta?.fetchedAt ? ` Fetched ${meta.fetchedAt.slice(11, 16)}Z · ${meta.recordCount} notes.` : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1",
				children: FEED_CHANNELS.map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", TONE_DOT[ch.tone] ?? "bg-muted") }), ch.label]
				}, ch.id))
			}),
			items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-sm text-muted",
				children: "No public previews this cycle. Channels rate-limit; sweep again or read the log."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-1.5",
				children: items.map((item) => {
					const tone = CHANNEL_TONE[item.channel] ?? "other";
					const label = FEED_CHANNELS.find((c) => c.id === item.channel)?.label ?? item.channel;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: item.url,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "flex flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 hover:bg-raised",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center justify-between gap-2 text-[11px] text-subtle",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", TONE_DOT[tone] ?? "bg-muted") }), label]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 font-mono",
									children: relative(item.timestamp)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm leading-snug",
								children: item.text.slice(0, 280)
							}),
							item.place ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[11px] text-muted",
								children: ["Named place · ", item.place]
							}) : null
						]
					}) }, item.id);
				})
			})
		]
	});
}
function BriefPanel({ data, loading, onRun, sitrep, doc, onOpenAnno }) {
	const [view, setView] = (0, import_react.useState)("doc");
	const s = sitrep;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex flex-wrap items-center gap-1",
				children: [[
					["doc", "Assessment"],
					["one", "One-pager"],
					["leads", "AI leads"],
					["actors", "Actors"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setView(id),
					className: cn("h-7 rounded-md px-2 font-mono text-[10px] tracking-wide uppercase", view === id ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised"),
					children: label
				}, id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					className: "ml-auto",
					onClick: onRun,
					disabled: loading,
					children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), loading ? "Searching" : "AI 48h"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-3 text-[11px] leading-snug text-subtle",
				children: [
					"Auto-generated military-intelligence assessment from the sweep. Observation ≠ assessment. Documentation only — no targeting.",
					s ? ` Window ${s.windowStart.slice(11, 16)}–${s.windowEnd.slice(11, 16)}Z.` : "",
					doc ? ` ${doc.sections.length} sections · ${doc.annotations.length} map annotations.` : ""
				]
			}),
			view === "doc" && doc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssessmentDoc, {
				doc,
				onOpenAnno
			}) : null,
			view === "one" && s ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommanderBrief, {
				s,
				ai: data
			}) : null,
			view === "leads" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Leads, {
				data,
				loading
			}) : null,
			view === "actors" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActorsPanel, {}) : null,
			view === "doc" && !doc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl border border-border bg-raised p-3 text-sm text-muted",
				children: "Sweep once. The fourteen-section assessment compiles from public ingest — it does not wait on the AI button."
			}) : null,
			view === "one" && !s ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl border border-border bg-raised p-3 text-sm text-muted",
				children: "Sweep once. The six-hour SITREP compiles from public ingest — it does not wait on the AI button."
			}) : null
		]
	});
}
function AssessmentDoc({ doc, onOpenAnno }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "rounded-xl border border-accent/40 bg-surface/70 p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[10px] tracking-[0.22em] text-accent",
					children: "MILITARY INTELLIGENCE ASSESSMENT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted",
					children: [
						"Sudan Wing · ",
						doc.window.replace("T", " ").slice(0, 48),
						" · overall ",
						doc.overall
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[11px] leading-snug text-subtle",
					children: "Auto-compiled from verified reporting, claims, local sources, FIRMS, ADS-B, and dated optical browse. Every map annotation is tied to a paragraph. Click a section to fly the overlay."
				})
			]
		}), doc.sections.map((sec) => {
			const cards = (sec.annoIds ?? []).map((id) => doc.annotations.find((a) => a.id === id)).filter((a) => Boolean(a && a.imagery));
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl border border-border bg-surface/50 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "w-full text-left",
						onClick: () => {
							const first = sec.annoIds?.[0];
							if (first) onOpenAnno?.(first);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[10px] tracking-[0.18em] text-accent",
							children: sec.kicker
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-0.5 text-sm font-medium",
							children: sec.title
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: sec.body
					}),
					sec.bullets && sec.bullets.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1.5",
						children: sec.bullets.map((b, i) => {
							const aid = sec.annoIds?.[i];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									if (aid) onOpenAnno?.(aid);
								},
								className: "w-full rounded-lg border border-border/80 bg-bg/40 px-2.5 py-2 text-left text-xs leading-relaxed text-muted hover:border-accent/40 hover:text-fg",
								children: b
							}) }, i);
						})
					}) : null,
					cards.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: cards.slice(0, 4).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onOpenAnno?.(a.id),
							className: "overflow-hidden rounded-lg border border-border text-left hover:border-accent/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: a.imagery.before,
									alt: "",
									className: "aspect-[4/3] w-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: a.imagery.after,
									alt: "",
									className: "aspect-[4/3] w-full object-cover"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "px-2 py-1 text-[10px] leading-snug text-subtle",
								children: ["HLS before / after · ", a.title]
							})]
						}, a.id))
					}) : null
				]
			}, sec.id);
		})]
	});
}
function CommanderBrief({ s, ai }) {
	const bottom = ai?.commander || s.bottomLine;
	const meaning = ai?.meaning || s.meaning;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "rounded-xl border border-accent/40 bg-surface/70 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[10px] tracking-[0.22em] text-accent",
						children: "SIX-HOUR MILITARY INTELLIGENCE BRIEF"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted",
						children: [
							s.theater,
							" · ",
							s.windowStart.slice(0, 16).replace("T", " "),
							"–",
							s.windowEnd.slice(11, 16),
							"Z · overall ",
							s.overallConfidence
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-[11px] text-subtle",
						children: [
							s.counts.log6h,
							" log / ",
							s.counts.news,
							" wire / ",
							s.counts.firms,
							" FIRMS / ",
							s.counts.cargo,
							" cargo-typical · source ",
							s.source,
							ai?.commander ? " · AI overlay on bottom line" : ""
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-mono text-[10px] tracking-widest text-subtle",
				children: "BOTTOM LINE"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed",
				children: bottom
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-mono text-[10px] tracking-widest text-subtle",
				children: "KEY DEVELOPMENTS"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-1 space-y-2",
				children: s.developments.slice(0, 5).map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg border border-border bg-surface/50 p-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] uppercase tracking-wide text-subtle",
							children: [
								d.claim,
								" · ",
								d.confidence,
								" · ",
								d.significance,
								d.location ? ` · ${d.location}` : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-snug",
							children: d.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: d.observed
						})
					]
				}, i))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-mono text-[10px] tracking-widest text-subtle",
					children: "BATTLEFIELD / OPERATIONAL PICTURE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted",
					children: ["Initiative: ", s.picture.initiative]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-1 space-y-1 text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Ground — ", s.picture.ground] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Air — ", s.picture.air] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Fires — ", s.picture.fires] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Logistics — ", s.picture.logistics] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["C2 / Intel — ", s.picture.c2] })
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-mono text-[10px] tracking-widest text-subtle",
				children: "WHAT IT MEANS"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-muted",
				children: meaning
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-mono text-[10px] tracking-widest text-subtle",
					children: "NEXT 24–72 HOURS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm",
					children: s.forecast.mostLikely
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 list-disc space-y-1 pl-4 text-xs text-muted",
					children: s.forecast.watch.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: w }, w))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-mono text-[10px] tracking-widest text-subtle",
				children: "KEY UNCERTAINTIES"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-1 list-disc space-y-1 pl-4 text-xs text-muted",
				children: s.gaps.slice(0, 3).map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: g }, g))
			})] })
		]
	});
}
function Leads({ data, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] leading-snug text-subtle",
			children: "Optional Grok pass over 48 hours of public reporting. Leads, not confirmation. Does not fire on page load."
		}),
		!data && !loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-xl border border-border bg-raised p-3 text-sm text-muted",
			children: "Press AI 48h. The one-pager above already compiled from the sweep without spending quota."
		}) : null,
		data && !data.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-xl border border-damage/40 bg-damage/10 p-3 text-sm text-damage",
			children: data.error
		}) : null,
		data?.commander ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 rounded-xl border border-accent/30 bg-surface/60 p-3 text-sm leading-relaxed",
			children: data.commander
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-3 space-y-2",
			children: (data?.items ?? []).map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl border border-border bg-surface/60 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-subtle",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: it.category }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: it.confidence }),
							it.location ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", it.location] }) : null,
							it.geoPrecise === false && it.lat != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-thermal",
								children: "verify geo"
							}) : null,
							it.date ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto font-mono",
								children: it.date
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-snug",
						children: it.headline
					}),
					it.summary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs leading-relaxed text-muted",
						children: it.summary
					}) : null
				]
			}, it.id))
		})
	] });
}
function ActorsPanel() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-[11px] leading-snug text-subtle",
			children: [
				"Persistent actor profiles. Updated when public evidence changes — not every six hours. ",
				CLAIM_CLASS.assessed,
				"."
			]
		}), ACTORS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "rounded-xl border border-border bg-surface/60 p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-[10px] tracking-widest text-accent",
					children: [
						a.id.toUpperCase(),
						" · ",
						a.confidence
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "text-sm font-medium",
					children: a.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: a.short
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-2 space-y-1 text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: "Political."
							}),
							" ",
							a.political
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: "Military."
							}),
							" ",
							a.military
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: "Logistics."
							}),
							" ",
							a.logistics
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: "External."
							}),
							" ",
							a.external
						] })
					]
				})
			]
		}, a.id))]
	});
}
function ReportsList({ reports, onSelect, onAdd }) {
	const sorted = [...reports].sort((a, b) => a.date < b.date ? 1 : -1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-subtle",
				children: [sorted.length, " published OSINT posts · aggregation, not original assessments"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: onAdd,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), " Log"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1.5",
			children: sorted.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelect(r.id),
				className: "flex w-full flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center justify-between gap-2 text-[11px] text-subtle",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: CATEGORY_META[r.category].label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: r.date
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm leading-snug",
						children: r.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-subtle",
						children: [
							r.place,
							", ",
							r.country,
							" · ",
							r.sourceLabel
						]
					})
				]
			}) }, r.id))
		})]
	});
}
function ReportDetail({ report, onBack }) {
	const links = imageryLinks(report.lat, report.lon);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col overflow-y-auto p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mb-2 self-start text-xs text-muted hover:text-fg",
				onClick: onBack,
				children: "← Reports"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] uppercase tracking-wide text-subtle",
				children: [
					CATEGORY_META[report.category].label,
					" · ",
					PARTY_LABEL[report.party],
					" · c",
					report.confidence
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-2xl font-medium leading-snug tracking-tight",
				children: report.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-subtle",
				children: [
					report.place,
					", ",
					report.country,
					" · ",
					report.date,
					" · ",
					report.lat.toFixed(4),
					", ",
					report.lon.toFixed(4)
				]
			}),
			report.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: report.imageUrl,
				alt: "",
				className: "mt-3 w-full rounded-lg border border-border object-cover"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: report.summary
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 rounded-lg border border-border bg-raised p-2 text-xs leading-relaxed text-subtle",
				children: [
					CONFIDENCE_RUBRIC[report.confidence],
					" Source:",
					" ",
					report.sourceUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: report.sourceUrl,
						target: "_blank",
						rel: "noreferrer",
						className: "text-fg underline-offset-2 hover:underline",
						children: report.sourceLabel
					}) : report.sourceLabel
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Inspect this location"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 grid grid-cols-1 gap-1.5",
				children: links.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: l.href,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "flex h-11 items-center justify-between rounded-lg border border-border px-3 text-sm hover:bg-raised",
					children: [l.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5 text-subtle" })]
				}, l.label))
			})
		]
	});
}
var FIELD = "h-10 w-full rounded-lg border border-border bg-raised px-3 text-sm text-fg placeholder:text-subtle";
function AddReportForm({ onAdd, onCancel }) {
	const [title, setTitle] = (0, import_react.useState)("");
	const [place, setPlace] = (0, import_react.useState)("");
	const [country, setCountry] = (0, import_react.useState)("Sudan");
	const [coords, setCoords] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [category, setCategory] = (0, import_react.useState)("vehicle-buildup");
	const [party, setParty] = (0, import_react.useState)("unknown");
	const [confidence, setConfidence] = (0, import_react.useState)(1);
	const [summary, setSummary] = (0, import_react.useState)("");
	const [sourceLabel, setSourceLabel] = (0, import_react.useState)("");
	const [sourceUrl, setSourceUrl] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	function submit(e) {
		e.preventDefault();
		const parts = coords.split(",").map((s) => Number(s.trim()));
		if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) {
			setError("Coordinates must be lat, lon — e.g. 15.9625, 32.5525");
			return;
		}
		if (!title.trim() || !sourceLabel.trim()) {
			setError("Title and source are required.");
			return;
		}
		onAdd({
			id: `user-${Date.now()}`,
			title: title.trim(),
			place: place.trim() || "Unspecified",
			country: country.trim() || "Sudan",
			lat: parts[0],
			lon: parts[1],
			date,
			category,
			party,
			confidence,
			summary: summary.trim(),
			sourceLabel: sourceLabel.trim(),
			sourceUrl: sourceUrl.trim() || void 0
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: submit,
		className: "flex h-full flex-col gap-3 overflow-y-auto p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-medium",
				children: "Log a published report"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-subtle",
				children: "Record what a source published. It is a lead until corroborated. No targeting language."
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-damage/40 bg-damage/10 px-3 py-2 text-xs text-damage",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: FIELD,
				placeholder: "Title / what was observed",
				value: title,
				onChange: (e) => setTitle(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: FIELD,
					placeholder: "Place",
					value: place,
					onChange: (e) => setPlace(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: FIELD,
					placeholder: "Country",
					value: country,
					onChange: (e) => setCountry(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: FIELD,
				placeholder: "Coordinates: lat, lon",
				value: coords,
				onChange: (e) => setCoords(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					className: FIELD,
					value: date,
					onChange: (e) => setDate(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: FIELD,
					value: category,
					onChange: (e) => setCategory(e.target.value),
					children: Object.entries(CATEGORY_META).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: k,
						children: v.label
					}, k))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: FIELD,
					value: party,
					onChange: (e) => setParty(e.target.value),
					children: Object.keys(PARTY_LABEL).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: k,
						children: PARTY_LABEL[k]
					}, k))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: FIELD,
					value: confidence,
					onChange: (e) => setConfidence(Number(e.target.value)),
					children: [
						1,
						2,
						3,
						4,
						5
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: n,
						children: [
							n,
							" — ",
							CONFIDENCE_RUBRIC[n].slice(0, 28)
						]
					}, n))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "min-h-20 w-full rounded-lg border border-border bg-raised p-3 text-sm",
				placeholder: "Summary of the claim",
				value: summary,
				onChange: (e) => setSummary(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: FIELD,
					placeholder: "Source (e.g. @account)",
					value: sourceLabel,
					onChange: (e) => setSourceLabel(e.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: FIELD,
					placeholder: "Source URL",
					value: sourceUrl,
					onChange: (e) => setSourceUrl(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "flex-1",
					children: "Add to map"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					onClick: onCancel,
					children: "Cancel"
				})]
			})
		]
	});
}
function ControlLegend({ open, onToggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel pointer-events-auto w-60 max-w-[78vw] p-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onToggle,
			className: "flex w-full items-center justify-between text-xs font-medium",
			children: ["Areas of control", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-subtle",
				children: open ? "–" : "+"
			})]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1",
				children: Object.keys(FACTION_META).map((f) => {
					const m = FACTION_META[f];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("h-2.5 w-4 shrink-0 rounded-sm border"),
							style: {
								backgroundColor: `${m.color}40`,
								borderColor: m.color,
								borderStyle: m.dashed ? "dashed" : "solid"
							}
						}), m.label]
					}, f);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 border-t border-border pt-2 text-[10px] leading-tight text-subtle",
				children: [
					"As of ",
					CONTROL_AS_OF,
					". ",
					CONTROL_SOURCE
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[10px] font-medium uppercase tracking-wider text-subtle",
				children: "Vista copy (English)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-1 space-y-1",
				children: [
					VISTA_LEGEND.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-2.5 w-4 shrink-0 rounded-sm border",
							style: {
								backgroundColor: `${m.color}55`,
								borderColor: m.color
							}
						}), m.label]
					}, m.faction)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-2.5 rounded-full",
							style: { backgroundColor: "#3d8b3d" }
						}), "SAF-held division HQ (green pin)"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-2.5 rounded-full",
							style: { backgroundColor: "#c9a227" }
						}), "RSF-held division HQ (amber pin)"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[10px] leading-tight text-subtle",
				children: "Translated from the public Google My Map “Sudan control map (copied from Vista)”. Third-party compiled control — not a live frontline."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-2 space-y-1 border-t border-border pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-accent" }), "Archive sites"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-saf" }), "OSM / OurAirports"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-damage" }), "GDELT event pulses"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-thermal" }), "FIRMS thermal"]
					})
				]
			})
		] }) : null]
	});
}
function DetectPanel({ report, loading, onOpen, coincidence }) {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const fileRef = (0, import_react.useRef)(null);
	const modelWeights = useAppStore((s) => s.modelWeights);
	const setModelWeights = useAppStore((s) => s.setModelWeights);
	const chipSamples = useAppStore((s) => s.chipSamples);
	const hits = report?.hits ?? [];
	const counts = Object.fromEntries(HUNTS.map((h) => [h.id, hits.filter((x) => x.hunts?.includes(h.id)).length]));
	const shown = hits.filter((h) => filter === "all" || h.hunts?.includes(filter));
	const ranked = [...shown].sort((a, b) => {
		const w = (h) => (h.id.startsWith("det-scan-") ? 8 : 0) + (h.hunts?.includes("bda") ? 4 : 0) + (h.hunts?.includes("irreg") ? 3 : 0) + (h.hunts?.includes("cargo") || h.hunts?.includes("sea") ? 2 : 0) + h.confidence;
		return w(b) - w(a);
	});
	const scanN = hits.filter((h) => h.id.startsWith("det-scan-")).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel pointer-events-auto mt-2 w-72 max-w-[86vw] overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-2.5 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium",
					children: "Imagery sweep"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[11px] tabular-nums text-subtle",
					children: loading ? "scanning tiles…" : `${scanN} finds · ${shown.length}/${hits.length}`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "border-t border-border px-2.5 py-1.5 text-[10px] leading-snug text-subtle",
				children: [
					report?.note ?? "GEOINT desk — BDA, cargo, air, sea, vehicles, pads, berms, POL, camps, crossings. Candidates, not IDs.",
					" ",
					"Click a row to slew to high-res at yard scale."
				]
			}),
			coincidence ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border px-2.5 py-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between font-mono text-[10px] tracking-wide",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "COINCIDENCE"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-accent",
							children: [
								coincidence.score,
								" · ",
								coincidence.level
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 h-1 overflow-hidden rounded-full bg-raised",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-accent",
							style: { width: `${coincidence.score}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] leading-tight text-subtle",
						children: "War-Probability-OSINT fusion idea, public signals only — not a forecast."
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-0.5 px-2 pb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFilter("all"),
					className: cn("rounded-sm px-1 py-0.5 font-mono text-[9px] tracking-wide", filter === "all" ? "bg-raised text-fg" : "text-muted hover:text-fg"),
					children: "ALL"
				}), HUNTS.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					title: h.look,
					onClick: () => setFilter(filter === h.id ? "all" : h.id),
					className: cn("rounded-sm px-1 py-0.5 font-mono text-[9px] tracking-wide", filter === h.id ? "bg-raised text-fg" : "text-muted hover:text-fg"),
					children: [h.short, counts[h.id] ? ` ${counts[h.id]}` : ""]
				}, h.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-64 overflow-y-auto border-t border-border",
				children: shown.length === 0 && !loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-2.5 py-2 text-[11px] text-muted",
					children: "No candidates this cycle."
				}) : ranked.slice(0, 24).map((h) => {
					const meta = DETECT_KLASS[h.klass];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onOpen(h),
						className: "flex w-full items-start gap-2 px-2.5 py-1.5 text-left hover:bg-raised",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm",
							style: { background: meta.color }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-[11px] text-fg",
								children: h.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-[10px] text-subtle",
								children: [
									h.id.startsWith("det-scan-") ? "SCAN · " : "",
									meta.short,
									" · c",
									h.confidence,
									h.change != null ? ` · Δ${h.change}` : "",
									h.cloud !== "unknown" ? ` · ${h.cloud}` : ""
								]
							})]
						})]
					}) }, h.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1 border-t border-border px-2 py-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-sm px-1.5 py-0.5 font-mono text-[9px] text-muted hover:text-fg",
						onClick: () => downloadBlob("ahsr-chip-weights.json", "application/json", serializeWeights(modelWeights)),
						children: "Export weights"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "rounded-sm px-1.5 py-0.5 font-mono text-[9px] text-muted hover:text-fg",
						onClick: () => downloadBlob("ahsr-chip-samples.json", "application/json", JSON.stringify({
							version: 1,
							kind: "ahsr-chip-samples",
							samples: chipSamples
						}, null, 2)),
						children: ["Export labels ", chipSamples.length ? `(${chipSamples.length})` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-sm px-1.5 py-0.5 font-mono text-[9px] text-muted hover:text-fg",
						onClick: () => fileRef.current?.click(),
						children: "Import Colab JSON"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/sudan-chip-train.ipynb",
						download: true,
						className: "rounded-sm px-1.5 py-0.5 font-mono text-[9px] text-muted hover:text-fg",
						children: "Colab notebook"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "application/json",
						className: "hidden",
						onChange: (e) => {
							const file = e.target.files?.[0];
							if (!file) return;
							file.text().then((t) => {
								const w = parseWeights(t);
								if (w) setModelWeights(w);
							});
							e.target.value = "";
						}
					})
				]
			})
		]
	});
}
function Badge({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted", className),
		...props
	});
}
function BrowseFrame({ date, bbox, alt }) {
	const imagery = useAppStore((s) => s.imagery);
	const [bad, setBad] = (0, import_react.useState)(false);
	const layer = imagery === "s2" ? "HLS_S30_Nadir_BRDF_Adjusted_Reflectance" : "VIIRS_NOAA20_CorrectedReflectance_TrueColor";
	(0, import_react.useEffect)(() => {
		setBad(false);
	}, [date, layer]);
	if (bad) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex aspect-[4/3] items-center justify-center rounded-lg border border-border bg-raised px-2 text-center text-xs text-subtle",
		children: [
			"No ",
			imagery === "s2" ? "Sentinel-2 HLS" : "VIIRS",
			" browse for ",
			date,
			". Cloudy or a coverage gap — do not invent vehicles."
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: snapshotUrl(date, bbox, layer),
		alt,
		className: "aspect-[4/3] w-full rounded-lg object-cover outline outline-1 -outline-offset-1 outline-fg/10",
		onError: () => setBad(true)
	});
}
function ConfidencePips({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-0.5",
		title: CONFIDENCE_RUBRIC[value],
		children: [[
			1,
			2,
			3,
			4,
			5
		].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1.5 w-2.5 rounded-sm", n <= value ? "bg-accent" : "bg-border") }, n)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "ml-1 font-mono text-xs tabular-nums text-muted",
			children: ["c", value]
		})]
	});
}
function LeftRail(props) {
	const { overlay, date, compareDate, setDate, setCompareDate, swipeOn, setSwipeOn, layers, toggleLayer, imagery, setImagery, partyFilter, setPartyFilter, query, setQuery, boxes, boxOpen, setBoxOpen, boxForm, setBoxForm, addBox, removeBox, hideDefaultBox, flights, firms } = props;
	const setFocusedBox = useAppStore((s) => s.setFocusedBox);
	const kindFilter = useAppStore((s) => s.kindFilter);
	const setKindFilter = useAppStore((s) => s.setKindFilter);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col gap-4 overflow-y-auto p-3",
		children: [
			overlay ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2.5 top-2.5 size-4 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search sites, alerts",
					className: "h-10 w-full rounded-lg border border-border bg-raised pl-8 pr-3 text-sm text-fg placeholder:text-subtle"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Party"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				children: [
					"all",
					"saf",
					"rsf",
					"mixed",
					"other_armed",
					"civilian",
					"unknown"
				].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setPartyFilter(p),
					className: cn("h-8 rounded-full border px-2.5 text-xs", partyFilter === p ? "border-accent bg-accent text-accent-fg" : "border-border text-muted hover:bg-raised"),
					children: p === "all" ? "All" : PARTY_LABEL[p]
				}, p))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "What to show"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				children: Object.entries(KIND_GROUP_LABEL).map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setKindFilter(id),
					className: cn("h-8 rounded-full border px-2.5 text-xs", kindFilter === id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted hover:bg-raised"),
					children: label
				}, id))
			})] }),
			overlay ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
					children: "Imagery"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: [
						"hires",
						"gmaps",
						"s2cloudless",
						"viirs",
						"dark",
						"s2"
					].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setImagery(id),
						className: cn("h-8 rounded-full border px-2.5 text-xs", imagery === id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted hover:bg-raised"),
						children: IMAGERY[id].label
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs leading-snug text-subtle",
					children: IMAGERY[imagery].note
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Live contacts"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-1",
				children: [flights.slice(0, 8).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between rounded-sm border border-border px-2 py-1.5 font-mono text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn(f.military || f.category === "cargo" ? "text-thermal" : "text-fg"),
						children: f.operator !== "unknown" ? f.operator : f.hex
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-subtle",
						children: [f.typeCode, f.altFt ? ` · ${Math.round(f.altFt / 100) * 100}ft` : ""]
					})]
				}, f.id)), flights.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-[11px] leading-snug text-subtle",
					children: "No live ADS-B this cycle. Coverage gaps are normal. Absence of a track is not absence of a flight."
				}) : null]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Layers"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-0.5",
				children: [
					[
						"sites",
						"Sites",
						Shield
					],
					[
						"boxes",
						"Watch boxes",
						Eye
					],
					[
						"control",
						"Control areas",
						Shield
					],
					[
						"vista",
						"Vista control map",
						Shield
					],
					[
						"reports",
						"OSINT reports",
						FileText
					],
					[
						"news",
						"News pins",
						Search
					],
					[
						"hazards",
						"Natural hazards · OSIRIS",
						Search
					],
					[
						"ai",
						"AI brief pins",
						FileText
					],
					[
						"gdelt",
						"GDELT events",
						TriangleAlert
					],
					[
						"osm",
						"OSM / airfields",
						Shield
					],
					[
						"vessels",
						"Maritime nodes",
						Ship
					],
					[
						"corridors",
						"Reported corridors",
						Eye
					],
					[
						"rsfWatch",
						"RSF watchlist",
						Shield
					],
					[
						"firms",
						"FIRMS thermal",
						Flame
					],
					[
						"flights",
						"Flights",
						Plane
					],
					[
						"thermalRaster",
						"GIBS thermal raster",
						Flame
					]
				].map(([k, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => toggleLayer(k),
					className: "flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-raised",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", layers[k] ? "bg-accent" : "bg-border") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 text-muted" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })
					]
				}, k))
			})] }),
			overlay ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
					children: "Browse date"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: date,
					onChange: (e) => setDate(e.target.value),
					className: "h-10 w-full rounded-lg border border-border bg-raised px-2 text-sm"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-2 flex items-center gap-2 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: swipeOn,
						onChange: (e) => setSwipeOn(e.target.checked)
					}), "Before / after on selected site"]
				}),
				swipeOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: compareDate,
					onChange: (e) => setCompareDate(e.target.value),
					className: "mt-2 h-10 w-full rounded-lg border border-border bg-raised px-2 text-sm"
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xs font-medium uppercase tracking-wider text-subtle",
						children: "Watch boxes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setBoxOpen(!boxOpen),
						className: "text-muted hover:text-fg",
						"aria-label": "Add watch box",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					})]
				}),
				boxOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mb-2 space-y-1.5 rounded-xl border border-border bg-raised p-2",
					onSubmit: (e) => {
						e.preventDefault();
						addBox({
							id: `custom-${Date.now()}`,
							name: boxForm.name || "Custom box",
							region: "Custom",
							west: Number(boxForm.west),
							south: Number(boxForm.south),
							east: Number(boxForm.east),
							north: Number(boxForm.north),
							priority: "primary",
							notes: "Analyst-drawn watch box."
						});
						setBoxOpen(false);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							required: true,
							placeholder: "Name",
							value: boxForm.name,
							onChange: (e) => setBoxForm({
								...boxForm,
								name: e.target.value
							}),
							className: "h-9 w-full rounded-md border border-border bg-bg px-2 text-xs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-1",
							children: [
								"west",
								"south",
								"east",
								"north"
							].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: boxForm[k],
								onChange: (e) => setBoxForm({
									...boxForm,
									[k]: e.target.value
								}),
								className: "h-8 rounded-md border border-border bg-bg px-2 font-mono text-xs",
								"aria-label": k
							}, k))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "w-full",
							type: "submit",
							children: "Add box"
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-0.5",
					children: boxes.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-1 rounded-lg pr-1 hover:bg-raised",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setFocusedBox(b.id),
							className: "min-w-0 flex-1 rounded-lg px-2 py-2 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm text-fg",
								children: b.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-subtle",
								children: b.priority === "border" ? "Cross-border" : "Primary"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "relative size-8 text-subtle hover:text-damage after:absolute after:left-1/2 after:top-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2",
							onClick: () => b.id.startsWith("custom-") ? removeBox(b.id) : hideDefaultBox(b.id),
							"aria-label": `Hide ${b.name}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mx-auto size-3.5" })
						})]
					}, b.id))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-auto space-y-1.5 pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "sm",
						className: "w-full",
						onClick: () => exportGeoJSON(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), " GeoJSON"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "sm",
						className: "w-full",
						onClick: () => exportCsv(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), " CSV"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "sm",
						className: "w-full",
						onClick: () => exportBriefing(flights, firms),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5" }), " PDF briefing"]
					})
				]
			})
		]
	});
}
function RightRail(props) {
	const { alerts, sites, selectedAlert, selectedSite, siteParty, siteObs, reviews, note, setNote, applyReview, setSelectedAlert, setSelectedSite, reviewFilter, setReviewFilter, overrideParty, flights, live, liveError, audit, force, news, newsLoading, brief, briefLoading, onRunBrief, sitrep, feeds, feedsMeta, briefingDoc, onOpenAnno, fuae, onOpenFuae } = props;
	const detections = props.detections ?? [];
	const onOpenFlag = props.onOpenFlag;
	const selectedReportId = useAppStore((s) => s.selectedReportId);
	const addingReport = useAppStore((s) => s.addingReport);
	const customReports = useAppStore((s) => s.customReports);
	const addReport = useAppStore((s) => s.addReport);
	const setSelectedReport = useAppStore((s) => s.setSelectedReport);
	const setAddingReport = useAppStore((s) => s.setAddingReport);
	const allReports = [...customReports, ...SEED_REPORTS];
	const selectedReport = allReports.find((r) => r.id === selectedReportId) ?? null;
	if (force === "news") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewsPanel, {
		data: news,
		loading: newsLoading
	});
	if (force === "sites") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 text-xs font-medium uppercase tracking-wider text-subtle",
			children: "Sites"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1",
			children: sites.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setSelectedSite(s.id),
				className: "w-full rounded-lg px-2 py-2 text-left hover:bg-raised",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm",
						children: s.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						className: PARTY_TONE[s.party],
						children: PARTY_LABEL[s.party]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-subtle",
					children: [
						s.kind,
						" · ",
						s.admin1
					]
				})]
			}) }, s.id))
		})]
	});
	if (force === "log") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeLogList, { onOpenSite: setSelectedSite });
	if (force === "brief") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefPanel, {
		data: brief,
		loading: briefLoading,
		onRun: onRunBrief,
		sitrep,
		doc: briefingDoc ?? null,
		onOpenAnno
	});
	if (force === "fuae") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FuaePanel, {
		rows: fuae ?? [],
		onOpen: onOpenFuae ?? (() => {})
	});
	if (addingReport) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddReportForm, {
		onAdd: addReport,
		onCancel: () => setAddingReport(false)
	});
	if (selectedReport) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportDetail, {
		report: selectedReport,
		onBack: () => setSelectedReport(null)
	});
	if (selectedAlert) {
		const state = reviews[selectedAlert.id]?.state ?? selectedAlert.review;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-full flex-col overflow-y-auto p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-xs text-muted hover:text-fg",
						onClick: () => setSelectedAlert(null),
						children: "Queue"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidencePips, { value: reviews[selectedAlert.id]?.confidence ?? selectedAlert.confidence })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					className: "w-fit capitalize",
					children: selectedAlert.type.replace("_", " ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-2xl font-medium leading-snug tracking-tight",
					children: selectedAlert.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-mono text-xs tabular-nums text-subtle",
					children: formatUtc(selectedAlert.datetime)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted",
					children: selectedAlert.body
				}),
				selectedAlert.negativeEvidence ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 rounded-lg border border-civilian/30 bg-civilian/10 p-2 text-xs text-civilian",
					children: ["Negative evidence: ", selectedAlert.negativeEvidence]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-wrap gap-1",
					children: selectedAlert.families.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: f }, f))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs leading-relaxed text-subtle",
					children: CONFIDENCE_RUBRIC[selectedAlert.confidence]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-1",
					children: selectedAlert.siteIds.map((id) => {
						const s = SITES.find((x) => x.id === id);
						if (!s) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setSelectedAlert(null);
								setSelectedSite(id);
							},
							className: "block w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:bg-raised",
							children: ["Open ", s.name]
						}, id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-xs text-subtle",
					children: [
						"Review state: ",
						state,
						". Nothing is confirmed without a human click."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: note,
					onChange: (e) => setNote(e.target.value),
					placeholder: "Observational note. No perpetrator. No cargo claim.",
					className: "mt-2 min-h-20 w-full rounded-lg border border-border bg-raised p-2 text-sm"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 grid grid-cols-2 gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => applyReview("confirmed"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }), " Confirm"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => applyReview("rejected"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), " Reject"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "col-span-2",
							onClick: () => applyReview("needs_imagery"),
							children: "Needs imagery"
						})
					]
				})
			]
		});
	}
	if (selectedSite) {
		const token = (selectedSite.name.split(" ")[0] ?? "___").toLowerCase();
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteDetail, {
			site: selectedSite,
			party: siteParty,
			obs: siteObs,
			flights: flights.filter((f) => f.nearestAirfield.toLowerCase().includes(token)),
			onClose: () => setSelectedSite(null),
			overrideParty
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueOrLog, {
		alerts,
		reviews,
		reviewFilter,
		setReviewFilter,
		setSelectedAlert,
		setSelectedSite,
		news,
		newsLoading,
		brief,
		briefLoading,
		onRunBrief,
		sitrep,
		reports: allReports,
		onSelectReport: setSelectedReport,
		onAddReport: () => setAddingReport(true),
		feeds: feeds ?? live?.feeds ?? [],
		feedsMeta: feedsMeta ?? live?.feedsMeta ?? null,
		briefingDoc: briefingDoc ?? null,
		onOpenAnno,
		fuae: fuae ?? [],
		onOpenFuae,
		detections,
		onOpenFlag
	});
}
function QueueOrLog({ alerts, reviews, reviewFilter, setReviewFilter, setSelectedAlert, setSelectedSite, news, newsLoading, brief, briefLoading, onRunBrief, sitrep, reports, onSelectReport, onAddReport, feeds, feedsMeta, briefingDoc, onOpenAnno, fuae, onOpenFuae, detections, onOpenFlag }) {
	const rightTab = useAppStore((s) => s.rightTab);
	const setRightTab = useAppStore((s) => s.setRightTab);
	const listOrder = useAppStore((s) => s.listOrder);
	const setListOrder = useAppStore((s) => s.setListOrder);
	const reviewAlert = useAppStore((s) => s.reviewAlert);
	const trainModel = useAppStore((s) => s.trainModel);
	const setImagery = useAppStore((s) => s.setImagery);
	const [kind, setKind] = (0, import_react.useState)("all");
	const flags = mergeFlags([
		reportsToFlags(reports),
		detectToFlags(detections),
		alertsToFlags(alerts)
	], listOrder).filter((f) => {
		if (kind !== "all" && f.kind !== kind) return false;
		if (reviewFilter === "all") return true;
		return (reviews[f.id]?.state ?? f.review) === reviewFilter;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap items-center gap-1 px-3 pt-3",
			children: [
				["news", "News"],
				["fuae", "FUAE"],
				["rsf", "RSF"],
				["log", "Log"],
				["queue", "Flags"],
				["brief", "Brief"],
				["reports", "Reports"],
				["feeds", "Feeds"]
			].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					setRightTab(id);
					if (id === "brief") {
						setSelectedAlert(null);
						setSelectedSite(null);
					}
				},
				className: cn("h-8 rounded-lg px-2.5 text-xs", rightTab === id ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised"),
				children: [
					label,
					id === "news" && news?.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-1 font-mono tabular-nums text-[10px] opacity-80",
						children: news.items.length
					}) : null,
					id === "rsf" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-1 font-mono tabular-nums text-[10px] opacity-80",
						children: RSF_WATCH.length
					}) : null,
					id === "queue" && flags.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-1 font-mono tabular-nums text-[10px] opacity-80",
						children: flags.length
					}) : null
				]
			}, id))
		}), rightTab === "log" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangeLogList, { onOpenSite: setSelectedSite }) : rightTab === "news" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewsPanel, {
			data: news,
			loading: newsLoading
		}) : rightTab === "brief" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefPanel, {
			data: brief,
			loading: briefLoading,
			onRun: onRunBrief,
			sitrep,
			doc: briefingDoc,
			onOpenAnno
		}) : rightTab === "reports" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportsList, {
			reports,
			onSelect: onSelectReport,
			onAdd: onAddReport
		}) : rightTab === "feeds" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedsPanel, {
			items: feeds,
			meta: feedsMeta
		}) : rightTab === "fuae" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FuaePanel, {
			rows: fuae,
			onOpen: onOpenFuae ?? (() => {})
		}) : rightTab === "rsf" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RsfWatchPanel, { onOpen: (w) => {
			onOpenFlag?.({
				id: w.id,
				title: w.name,
				body: w.note,
				lat: w.lat,
				lon: w.lon,
				date: `${w.lastSeen}T00:00:00Z`,
				type: "change",
				kind: "published",
				sourceLabel: w.sourceLabel,
				url: w.sourceUrl,
				confidence: 2,
				families: ["reporting"],
				siteId: w.siteId,
				review: "unreviewed"
			});
			if (w.siteId) setSelectedSite(w.siteId);
		} }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1 flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-3 pt-2 text-[11px] leading-snug text-subtle",
					children: "Searcher flags: published OSINT first (@AfriMEOSINT and archive posts), then auto chips. Newest on top. Observation, not identification."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-1 px-3 pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderToggle, {
							order: listOrder,
							onChange: setListOrder
						}),
						[
							"all",
							"published",
							"auto",
							"archive"
						].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setKind(id),
							className: cn("h-7 rounded-full border px-2 text-[11px]", kind === id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
							children: id === "all" ? "All" : id === "published" ? "Published" : id === "auto" ? "Auto chips" : "Archive"
						}, id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: reviewFilter,
							onChange: (e) => setReviewFilter(e.target.value),
							className: "ml-auto h-7 rounded-md border border-border bg-raised px-2 text-[11px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "All review"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "unreviewed",
									children: "Unreviewed"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "confirmed",
									children: "Confirmed"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "rejected",
									children: "Rejected"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "needs_imagery",
									children: "Needs imagery"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex-1 overflow-y-auto px-3 py-2",
					children: flags.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "p-3 text-sm text-muted",
						children: "Nothing in this filter."
					}) : flags.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							onOpenFlag?.(f);
							if (ALERTS.some((a) => a.id === f.id)) {
								setSelectedAlert(f.id);
								if (f.siteId) setSelectedSite(f.siteId);
							}
						},
						className: "mb-1.5 w-full rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium leading-snug",
									children: f.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-wide", f.kind === "published" ? "bg-accent text-accent-fg" : f.kind === "auto" ? "bg-raised text-fg" : "text-subtle"),
									children: f.kind === "published" ? "PUB" : f.kind === "auto" ? "AUTO" : "ARC"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted",
								children: f.body
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1.5 flex items-center gap-2 text-xs text-subtle",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono tabular-nums",
										children: f.date.slice(0, 10)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f.sourceLabel }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "capitalize",
										children: String(f.type).replace("_", " ")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-2 flex flex-wrap gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										role: "button",
										tabIndex: 0,
										onClick: (e) => {
											e.stopPropagation();
											reviewAlert(f.id, "confirmed", "human verify", f.confidence);
											if (f.features && f.modelKlass) trainModel(f.features, f.modelKlass, true);
										},
										className: "rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-fg hover:bg-raised",
										children: "Confirm"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										role: "button",
										tabIndex: 0,
										onClick: (e) => {
											e.stopPropagation();
											reviewAlert(f.id, "rejected", "human reject", f.confidence);
											if (f.features && f.modelKlass) trainModel(f.features, f.modelKlass, false);
										},
										className: "rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted hover:bg-raised",
										children: "Reject"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										role: "button",
										tabIndex: 0,
										onClick: (e) => {
											e.stopPropagation();
											onOpenFlag?.(f);
											setImagery("hires");
										},
										className: "rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted hover:bg-raised",
										children: "Esri"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										role: "button",
										tabIndex: 0,
										onClick: (e) => {
											e.stopPropagation();
											onOpenFlag?.(f);
											setImagery("gmaps");
										},
										className: "rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted hover:bg-raised",
										children: "Google"
									})
								]
							})
						]
					}) }, f.id))
				})
			]
		})]
	});
}
function OrderToggle({ order, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => onChange(order === "newest" ? "oldest" : "newest"),
		className: "h-7 rounded-full border border-border px-2.5 font-mono text-[11px] text-fg",
		title: "Toggle newest / oldest",
		children: order === "newest" ? "Newest first" : "Oldest first"
	});
}
function ChangeLogList({ onOpenSite }) {
	const rows = useAppStore((s) => s.changeLog);
	const lastSweepAt = useAppStore((s) => s.lastSweepAt);
	const listOrder = useAppStore((s) => s.listOrder);
	const setListOrder = useAppStore((s) => s.setListOrder);
	const [fam, setFam] = (0, import_react.useState)("all");
	const filtered = fam === "all" ? rows : rows.filter((e) => e.families.includes(fam));
	const shown = listOrder === "newest" ? filtered : [...filtered].reverse();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-4 pt-2 text-[11px] leading-snug text-subtle",
				children: [
					shown.length,
					" records · ",
					listOrder === "newest" ? "newest" : "oldest",
					" first. Public archive, not live occupancy.",
					lastSweepAt ? ` Sweep ${lastSweepAt.slice(0, 16).replace("T", " ")}Z.` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1 px-3 pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderToggle, {
					order: listOrder,
					onChange: setListOrder
				}), [
					"all",
					"vehicles",
					"flight",
					"corridor",
					"morphology",
					"damage",
					"thermal",
					"reporting"
				].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFam(id),
					className: cn("h-7 rounded-full border px-2 text-[11px]", fam === id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted"),
					children: id === "all" ? "All" : id === "flight" ? "Air / cargo" : id === "vehicles" ? "Vehicles" : id === "corridor" ? "Movement" : id === "reporting" ? "News / OSINT" : id
				}, id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex-1 overflow-y-auto px-3 py-2",
				children: shown.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						if (e.siteId) onOpenSite(e.siteId);
					},
					className: "mb-1.5 w-full rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[10px] tabular-nums text-subtle",
							children: e.firstSeen.slice(0, 10)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block font-medium leading-snug",
							children: e.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted",
							children: e.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1.5 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: e.source }),
								e.negative ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-civilian",
									children: "negative"
								}) : null,
								e.families.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f }, f)),
								e.siteName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: e.siteName }) : null
							]
						})
					]
				}) }, e.id))
			})
		]
	});
}
function SiteDetail({ site, party, obs, flights, onClose, overrideParty }) {
	const date = useAppStore((s) => s.date);
	const compareDate = useAppStore((s) => s.compareDate);
	const swipeOn = useAppStore((s) => s.swipeOn);
	const setSwipeOn = useAppStore((s) => s.setSwipeOn);
	const requestYardsZoom = useAppStore((s) => s.requestYardsZoom);
	const bbox = padBbox$1(site.lat, site.lon, .08);
	const [reason, setReason] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const coords = `${site.lat.toFixed(5)}, ${site.lon.toFixed(5)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col overflow-y-auto p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted hover:text-fg",
					onClick: onClose,
					children: "Close"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidencePips, { value: site.confidence })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-medium leading-snug tracking-tight",
				children: site.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-subtle",
				children: [
					site.kind,
					" · ",
					site.admin1,
					" / ",
					site.admin2,
					" · ",
					site.status
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					className: PARTY_TONE[party],
					children: PARTY_LABEL[party]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "inline-flex items-center gap-1 font-mono text-xs tabular-nums text-muted hover:text-fg",
					onClick: async () => {
						if (await copyText(coords)) {
							setCopied(true);
							window.setTimeout(() => setCopied(false), 1200);
						}
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3" }), copied ? "Copied" : coords]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1",
				children: imageryLinks(site.lat, site.lon).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: l.href,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "h-8 rounded-full border border-border px-2.5 text-[11px] leading-8 text-muted hover:text-fg",
					children: l.label
				}, l.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => requestYardsZoom(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Focus, { className: "size-3.5" }), " Zoom to yards"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => setSwipeOn(!swipeOn),
					children: swipeOn ? "Hide compare" : "Before / after"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: swipeOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwipeCompare, {
					date,
					compareDate,
					lat: site.lat,
					lon: site.lon,
					name: site.name
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowseFrame, {
						date: compareDate,
						bbox,
						alt: `${site.name} on ${compareDate}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
						className: "mt-1 font-mono text-xs text-subtle",
						children: compareDate
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowseFrame, {
						date,
						bbox,
						alt: `${site.name} on ${date}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
						className: "mt-1 font-mono text-xs text-subtle",
						children: date
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: site.notes
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 rounded-lg border border-border bg-raised p-2 text-xs leading-relaxed text-muted",
				children: ["Civilian baseline: ", site.civilianBaseline]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Party assessment"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-subtle",
				children: "Changing a party label writes an audit row. Reason required."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1",
				children: [
					"saf",
					"rsf",
					"mixed",
					"other_armed",
					"civilian",
					"unknown"
				].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("h-8 rounded-full border px-2.5 text-xs", party === p ? "border-accent bg-accent text-accent-fg" : "border-border"),
					onClick: () => {
						const r = reason.trim();
						if (!r || r.startsWith("State why")) {
							setReason("");
							return;
						}
						overrideParty(site.id, p, r);
					},
					children: PARTY_LABEL[p]
				}, p))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: reason,
				onChange: (e) => setReason(e.target.value),
				placeholder: "Why this party label?",
				className: "mt-2 h-10 w-full rounded-lg border border-border bg-raised px-2 text-sm"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Forced questions (airlift)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-1 list-disc space-y-1 pl-4 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Where did the aircraft arrive? — unknown unless a ground event is in ADS-B or a clear scene." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "What ground vehicles met it? — not visible at 10 m unless a later scene shows them." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Where did those vehicles go? — do not invent an answer if the next image is cloudy." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Timeline"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-2 space-y-2",
				children: [obs.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-xl border border-border p-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-xs text-subtle",
							children: [
								formatUtc(o.datetime),
								" · ",
								o.sensor,
								" · cloud ",
								o.cloudPct,
								"%"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed",
							children: o.notes
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-subtle",
							children: ["scene ", o.sceneId]
						})
					]
				}, o.id)), obs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: "No archived observations yet."
				}) : null]
			}),
			flights.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Nearby airframes"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1 text-xs",
				children: flights.slice(0, 5).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg border border-border px-2 py-1.5",
					children: [
						f.typeCode,
						" · ",
						f.hex,
						" · ",
						f.category,
						" · ",
						f.operator || "unknown"
					]
				}, f.id))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xs font-medium uppercase tracking-wider text-subtle",
				children: "Corroboration"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-1 space-y-1 text-xs text-muted",
				children: CITATIONS.slice(0, 3).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: c.url,
					target: "_blank",
					rel: "noreferrer",
					className: "underline-offset-2 hover:underline",
					children: [
						c.publisher,
						": ",
						c.title
					]
				}) }, c.id))
			})
		]
	});
}
function SwipeCompare({ date, compareDate, lat, lon, name }) {
	const [pct, setPct] = (0, import_react.useState)(50);
	const bbox = padBbox$1(lat, lon, .1);
	const layer = useAppStore((s) => s.imagery) === "s2" ? "HLS_S30_Nadir_BRDF_Adjusted_Reflectance" : "VIIRS_NOAA20_CorrectedReflectance_TrueColor";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-xl border border-border bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-2 py-1.5 text-xs text-muted",
				children: ["Before / after · ", name]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-[4/3]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: snapshotUrl(compareDate, bbox, layer),
						alt: "",
						className: "absolute inset-0 h-full w-full object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: snapshotUrl(date, bbox, layer),
						alt: "",
						className: "absolute inset-0 h-full w-full object-cover",
						style: { clipPath: `inset(0 0 0 ${pct}%)` }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: 100,
						value: pct,
						onChange: (e) => setPct(Number(e.target.value)),
						className: "absolute inset-x-2 bottom-2",
						"aria-label": "Swipe compare"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between px-2 py-1 font-mono text-[10px] text-subtle",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: compareDate }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: date })]
			})
		]
	});
}
function zulu(now) {
	return now.toISOString().slice(11, 19) + "Z";
}
function SitroomFx() {
	const hudOn = useAppStore((s) => s.hudOn);
	const [slew, setSlew] = (0, import_react.useState)({ phase: "idle" });
	(0, import_react.useEffect)(() => {
		const on = (e) => setSlew(e.detail);
		window.addEventListener("ahsr-slew", on);
		return () => window.removeEventListener("ahsr-slew", on);
	}, []);
	if (!hudOn) return null;
	const slewing = slew.phase === "slewing" || slew.phase === "lock";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("sitroom-crosshair", slewing && "is-slew"),
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ch-h" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ch-v" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ch-box" })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sitroom-corners",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "tr" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "bl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "br" })
			]
		}),
		slewing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlewOverlay, {
			phase: slew.phase,
			label: slew.label,
			duration: slew.duration
		}) : null
	] });
}
function SlewOverlay({ phase, label, duration }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "spy-slew",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spy-ring r1" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spy-ring r2" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spy-ring r3" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spy-scan" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "spy-bracket" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "spy-status",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: phase === "lock" ? "text-accent" : "live-pulse",
						children: phase === "lock" ? "LOCK" : "SLEWING"
					}),
					label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-fg",
						children: label
					}) : null,
					phase === "slewing" && duration ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 text-subtle",
						children: [(duration / 1e3).toFixed(1), "s"]
					}) : null
				]
			})
		]
	});
}
function SensorBar({ docsOpen, onDocs }) {
	const hudOn = useAppStore((s) => s.hudOn);
	const setHudOn = useAppStore((s) => s.setHudOn);
	const detectOn = useAppStore((s) => s.detectOn);
	const setDetectOn = useAppStore((s) => s.setDetectOn);
	const look = useAppStore((s) => s.look);
	const setLook = useAppStore((s) => s.setLook);
	const orbitOn = useAppStore((s) => s.orbitOn);
	const setOrbitOn = useAppStore((s) => s.setOrbitOn);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			if (e.key === "h" || e.key === "H") {
				e.preventDefault();
				setHudOn(!useAppStore.getState().hudOn);
			}
			if (e.key === "d" || e.key === "D") {
				e.preventDefault();
				setDetectOn(!useAppStore.getState().detectOn);
			}
			if (e.key === "o" || e.key === "O") {
				e.preventDefault();
				setOrbitOn(!useAppStore.getState().orbitOn);
			}
			if (e.key === "q" || e.key === "Q") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("sahel-map-nudge", { detail: { bearing: -18 } }));
			}
			if (e.key === "e" || e.key === "E") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("sahel-map-nudge", { detail: { bearing: 18 } }));
			}
			if (e.key === "r" || e.key === "R") {
				e.preventDefault();
				window.dispatchEvent(new CustomEvent("sahel-map-nudge", { detail: { reset: true } }));
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		setHudOn,
		setDetectOn,
		setOrbitOn
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel hud-panel-bracket pointer-events-auto flex items-center gap-1 p-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setHudOn(!hudOn),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", hudOn ? "text-accent" : "text-muted hover:text-fg"),
				children: "HUD"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				title: "Auto-find: BDA, cargo, air, sea, vehicles, pads, berms, POL, camps, crossings, tracks, FX. Candidates — not IDs.",
				onClick: () => setDetectOn(!detectOn),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", detectOn ? "text-accent" : "text-muted hover:text-fg"),
				children: "DET"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				title: "Slow satellite orbit around the current target (O)",
				onClick: () => setOrbitOn(!orbitOn),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", orbitOn ? "text-accent" : "text-muted hover:text-fg"),
				children: "ORBIT"
			}),
			[
				"crt",
				"nvg",
				"flir"
			].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				title: `${id.toUpperCase()} sensor look`,
				onClick: () => setLook(look === id ? "none" : id),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", look === id ? "text-accent" : "text-muted hover:text-fg"),
				children: id.toUpperCase()
			}, id)),
			onDocs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				title: "Open briefs, logs, news, FUAE",
				onClick: onDocs,
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", docsOpen ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
				children: "DOCS"
			}) : null
		]
	});
}
function ClockChip() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setNow(/* @__PURE__ */ new Date());
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono text-[11px] tabular-nums tracking-wider text-accent",
		children: now ? zulu(now) : "--:--:--Z"
	});
}
function ClassificationBar() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em] text-subtle",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "UNCLASSIFIED // OPEN SOURCE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: "DOCUMENTATION ONLY · NO TARGETING"
		})]
	});
}
var PICKER = [
	"hires",
	"gmaps",
	"s2cloudless",
	"viirs",
	"dark",
	"s2"
];
function BasemapPicker() {
	const imagery = useAppStore((s) => s.imagery);
	const setImagery = useAppStore((s) => s.setImagery);
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (e.target?.closest?.("[data-basemap-picker]")) return;
			setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-basemap-picker": true,
		className: "pointer-events-auto relative w-[17.5rem] max-w-[78vw]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			className: "hud-panel flex w-full items-center justify-between gap-2 px-3 py-2 text-left",
			"aria-expanded": open,
			"aria-haspopup": "listbox",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-3" }), "Satellite imagery"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-0.5 block truncate text-sm text-fg",
					children: IMAGERY[imagery].label
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 shrink-0 text-muted", open && "rotate-180") })]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			role: "listbox",
			className: "hud-panel absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden py-1",
			children: PICKER.map((id) => {
				const meta = IMAGERY[id];
				const live = id === "viirs";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "option",
					"aria-selected": imagery === id,
					onClick: () => {
						setImagery(id);
						setOpen(false);
					},
					className: cn("flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-raised", imagery === id && "bg-raised"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2 text-sm",
						children: [meta.label, live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-sm bg-damage px-1 font-mono text-[9px] tracking-wider text-fg",
							children: "LIVE"
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] leading-snug text-subtle",
						children: meta.pickerNote
					})]
				}) }, id);
			})
		}) : null]
	});
}
function LayerStack({ counts }) {
	const layers = useAppStore((s) => s.layers);
	const toggle = useAppStore((s) => s.toggleLayer);
	const hazardCount = useHazardState((s) => s.feed?.events.length ?? 0);
	const rows = [
		{
			key: "ai",
			label: "AI events",
			count: counts.ai,
			icon: Sparkles
		},
		{
			key: "rsfWatch",
			label: "RSF watch",
			count: RSF_WATCH.length,
			icon: Shield
		},
		{
			key: "vista",
			label: "Vista map",
			count: VISTA.features.length,
			icon: Shield
		},
		{
			key: "reports",
			label: "Reports",
			count: counts.reports,
			icon: Radio
		},
		{
			key: "news",
			label: "News",
			count: counts.news,
			icon: Newspaper
		},
		{
			key: "hazards",
			label: "Natural hazards",
			count: hazardCount,
			icon: Radio
		},
		{
			key: "firms",
			label: "Fire hotspots",
			count: counts.fires,
			icon: Flame
		},
		{
			key: "gdelt",
			label: "Forwarded intel",
			count: counts.feeds,
			icon: Radio
		},
		{
			key: "flights",
			label: "Flights",
			count: counts.flights,
			icon: Plane
		},
		{
			key: "vessels",
			label: "Vessels",
			count: counts.vessels,
			icon: Ship
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hud-panel pointer-events-auto hidden w-[13.5rem] overflow-hidden md:block",
		children: rows.map((r) => {
			const Icon = r.icon;
			const on = layers[r.key];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => toggle(r.key),
				className: cn("flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-xs last:border-b-0", on ? "text-fg" : "text-muted"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 shrink-0" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate",
						children: r.label
					}),
					typeof r.count === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono tabular-nums text-subtle",
						children: r.count
					}) : null
				]
			}, r.key);
		})
	});
}
var runSatelliteAnalysis = createServerFn({ method: "POST" }).inputValidator((data) => scanInput(data)).handler(createSsrRpc("b92cb569c89837647f88274b87e4fe2b3a23661ae77698d10549593f36023b86"));
var REVIEW_ASSESSMENTS = {
	unreviewed: "Not assessed",
	"possible-damage": "Possible damage",
	"visible-change": "Visible change · cause unknown",
	"no-visible-change": "No visible change",
	uncertain: "Uncertain / obscured"
};
var REVIEW_LIMITATIONS = "Analyst interpretation of imagery, not a verified damage inventory. Shadows, clouds, seasonal change, differing sensors, parallax, and image misalignment can create apparent change. A pixel-difference overlay cannot establish damage or its cause. No visible change does not establish safety or occupancy.";
function newImageryReview() {
	return {
		schema: "ahsr.imagery-review/v1",
		id: crypto.randomUUID(),
		title: "Building & infrastructure review",
		before: null,
		after: null,
		alignmentConfirmed: false,
		marks: [],
		notes: "",
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function normalizeRect(x1, y1, x2, y2) {
	if (![
		x1,
		y1,
		x2,
		y2
	].every(Number.isFinite)) return null;
	const clamp = (v) => Math.max(0, Math.min(1, v));
	const x = clamp(Math.min(x1, x2)), y = clamp(Math.min(y1, y2));
	const width = clamp(Math.max(x1, x2)) - x, height = clamp(Math.max(y1, y2)) - y;
	return width < .006 || height < .006 ? null : {
		x,
		y,
		width,
		height
	};
}
function validCaptureDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = /* @__PURE__ */ new Date(`${value}T00:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validatePair(review) {
	const errors = [], { before, after } = review;
	if (!before || !after) return ["Load a before image and an after image."];
	if (!validCaptureDate(before.capturedAt) || !validCaptureDate(after.capturedAt)) errors.push("Enter valid capture dates as YYYY-MM-DD. File modification dates are not capture dates.");
	if (before.capturedAt && after.capturedAt && before.capturedAt >= after.capturedAt) errors.push("The after date must be later than the before date.");
	if (Math.abs(before.width / before.height - after.width / after.height) > .01) errors.push("Image aspect ratios differ. Upload aligned crops of the same extent.");
	if (JSON.stringify(before.bbox) !== JSON.stringify(after.bbox)) errors.push("Image extents differ. Load both dated scenes for the same area.");
	if (!review.alignmentConfirmed) errors.push("Check the images and confirm that they cover the same aligned area.");
	return errors;
}
/** RGB difference only. Never an object classifier or an estimate of damaged buildings. */
function pixelDifference(before, after, threshold = 35) {
	if (before.length !== after.length || before.length % 4) throw new Error("Aligned image buffers must have identical dimensions.");
	if (!Number.isFinite(threshold) || threshold < 1 || threshold > 255) throw new Error("Invalid difference threshold.");
	const overlay = new Uint8ClampedArray(before.length);
	let changed = 0, valid = 0, bright = 0;
	for (let i = 0; i < before.length; i += 4) {
		if (before[i + 3] < 200 || after[i + 3] < 200) continue;
		valid++;
		const b = (before[i] + before[i + 1] + before[i + 2]) / 3;
		if ((after[i] + after[i + 1] + after[i + 2]) / 3 > 235 || b > 235) bright++;
		if ((Math.abs(before[i] - after[i]) + Math.abs(before[i + 1] - after[i + 1]) + Math.abs(before[i + 2] - after[i + 2])) / 3 < threshold) continue;
		changed++;
		overlay[i] = 244;
		overlay[i + 1] = 169;
		overlay[i + 2] = 75;
		overlay[i + 3] = 175;
	}
	return {
		overlay,
		changed,
		valid,
		brightFraction: valid ? bright / valid : 0
	};
}
function isScene(value) {
	if (!value || typeof value !== "object") return false;
	const s = value;
	return typeof s.id === "string" && typeof s.name === "string" && typeof s.source === "string" && typeof s.capturedAt === "string" && s.capturedAt.length <= 10 && Number.isFinite(s.width) && Number.isFinite(s.height) && s.width > 0 && s.height > 0 && s.width <= 4096 && s.height <= 4096 && typeof s.dataUrl === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.dataUrl) && s.dataUrl.length < 24e6 && typeof s.originalSha256 === "string" && /^[a-f0-9]{64}$/.test(s.originalSha256);
}
function parseImageryReview(text) {
	if (text.length > 5e7) throw new Error("Review exceeds 50 MB.");
	const r = JSON.parse(text);
	if (r?.schema !== "ahsr.imagery-review/v1" || typeof r.id !== "string" || typeof r.title !== "string" || r.title.length > 200 || typeof r.notes !== "string" || r.notes.length > 2e4 || typeof r.alignmentConfirmed !== "boolean" || !Array.isArray(r.marks) || r.marks.length > 100) throw new Error("Invalid imagery review file.");
	for (const s of [r.before, r.after]) if (s !== null && !isScene(s)) throw new Error("Invalid or unsafe scene image.");
	const ids = /* @__PURE__ */ new Set();
	for (const m of r.marks) {
		if (!m || typeof m.id !== "string" || ids.has(m.id) || ![
			m.x,
			m.y,
			m.width,
			m.height
		].every(Number.isFinite) || m.x < 0 || m.y < 0 || m.width <= 0 || m.height <= 0 || m.x + m.width > 1.000001 || m.y + m.height > 1.000001 || !Object.hasOwn(REVIEW_ASSESSMENTS, m.assessment) || ![
			"low",
			"medium",
			"high"
		].includes(m.confidence) || typeof m.label !== "string" || m.label.length > 200 || typeof m.note !== "string" || m.note.length > 1e4) throw new Error("Invalid review annotation.");
		ids.add(m.id);
	}
	const cleanScene = (s) => s ? {
		id: s.id,
		name: s.name,
		source: s.source,
		sourceUrl: s.sourceUrl && /^https?:\/\//.test(s.sourceUrl) ? s.sourceUrl : null,
		capturedAt: s.capturedAt,
		loadedAt: typeof s.loadedAt === "string" ? s.loadedAt : "",
		width: s.width,
		height: s.height,
		originalSha256: s.originalSha256,
		...s.hashKind === "decoded-rgb" ? { hashKind: "decoded-rgb" } : {},
		dataUrl: s.dataUrl,
		resolutionM: Number.isFinite(s.resolutionM) ? s.resolutionM : null,
		bbox: s.bbox && [
			s.bbox.west,
			s.bbox.south,
			s.bbox.east,
			s.bbox.north
		].every(Number.isFinite) ? s.bbox : null
	} : null;
	return {
		schema: r.schema,
		id: r.id,
		title: r.title,
		before: cleanScene(r.before),
		after: cleanScene(r.after),
		alignmentConfirmed: r.alignmentConfirmed,
		marks: r.marks.map((m) => ({
			id: m.id,
			x: m.x,
			y: m.y,
			width: m.width,
			height: m.height,
			label: m.label,
			assessment: m.assessment,
			confidence: m.confidence,
			...m.disposition && [
				"pending",
				"confirmed-change",
				"rejected"
			].includes(m.disposition) ? { disposition: m.disposition } : {},
			note: m.note,
			updatedAt: typeof m.updatedAt === "string" ? m.updatedAt : ""
		})),
		notes: r.notes,
		updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : ""
	};
}
function reviewHtml(review) {
	const r = parseImageryReview(JSON.stringify(review));
	const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[c]);
	const scene = (s, label) => s ? `<figure><figcaption><b>${label} · ${esc(s.capturedAt || "Capture date unknown")}</b><br>${esc(s.source)} · ${s.width} × ${s.height}</figcaption><div class="scene"><img src="${s.dataUrl}" alt="${label} scene"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${r.marks.map((m, i) => `<rect x="${m.x * 100}" y="${m.y * 100}" width="${m.width * 100}" height="${m.height * 100}"/><text x="${m.x * 100}" y="${Math.max(3, m.y * 100 - 1)}">${i + 1}</text>`).join("")}</svg></div><small>${s.hashKind === "decoded-rgb" ? "Decoded analysis RGB" : "Original file"} SHA-256: ${esc(s.originalSha256)}<br>Source: ${esc(s.sourceUrl ?? s.name)}</small></figure>` : "";
	return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(r.title)}</title><style>body{font:15px/1.6 system-ui;color:#202b27;background:#f7f9f8;margin:32px auto;max-width:1200px;padding:24px}h1{font-size:32px}header p,small{color:#53635b}small{overflow-wrap:anywhere}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}figcaption{margin-bottom:8px}.scene{position:relative}.scene img{display:block;width:100%}.scene svg{position:absolute;inset:0;width:100%;height:100%}rect{fill:none;stroke:#edaa43;stroke-width:.35}text{fill:#edaa43;font:bold 3px system-ui}article{padding:16px 0;border-bottom:1px solid #cbd4cf}p{white-space:pre-wrap}.notice{padding:16px;border-left:3px solid #b9822c;background:#efeee6}@media(max-width:700px){.pair{grid-template-columns:1fr}}@media print{body{margin:0}article,figure{break-inside:avoid}}</style><header><p>ABU HUREIRAH · CIVILIAN IMAGERY REVIEW</p><h1>${esc(r.title)}</h1><p>Updated ${esc(r.updatedAt)} · ${r.marks.length} areas marked</p></header><p class="notice">${esc(REVIEW_LIMITATIONS)}${r.alignmentConfirmed ? "" : " Alignment was NOT confirmed."}</p><div class="pair">${scene(r.before, "BEFORE")}${scene(r.after, "AFTER")}</div><h2>Analyst observations</h2>${r.marks.map((m, i) => `<article><h3>${i + 1}. ${esc(m.label)}</h3><b>${esc(REVIEW_ASSESSMENTS[m.assessment])} · ${esc(m.confidence)} confidence · ${esc(m.disposition ?? "pending")}</b><p>${esc(m.note || "No rationale supplied.")}</p></article>`).join("")}<h2>Review notes</h2><p>${esc(r.notes || "No additional notes.")}</p></html>`;
}
function png(base64, width, height, channels = 3) {
	const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	const c = document.createElement("canvas");
	c.width = width;
	c.height = height;
	const ctx = c.getContext("2d");
	const im = ctx.createImageData(width, height);
	for (let i = 0; i < width * height; i++) {
		for (let j = 0; j < 3; j++) im.data[i * 4 + j] = raw[i * channels + j];
		im.data[i * 4 + 3] = channels === 4 ? raw[i * 4 + 3] : 255;
	}
	ctx.putImageData(im, 0, 0);
	return c.toDataURL();
}
function SatelliteAutoScan({ onComplete, onStatus, busy, setBusy, onShowMap }) {
	const center = useAnalysisArea((s) => s.center);
	const mapBefore = useAppStore((s) => s.compareDate), mapAfter = useAppStore((s) => s.date);
	const [before, setBefore] = (0, import_react.useState)(mapBefore), [after, setAfter] = (0, import_react.useState)(mapAfter), [size, setSize] = (0, import_react.useState)(5), [windowDays, setWindowDays] = (0, import_react.useState)(15), [maxCloud, setMaxCloud] = (0, import_react.useState)(20);
	const [result, setResult] = (0, import_react.useState)(null);
	const run = async () => {
		setBusy(true);
		setResult(null);
		onStatus("Searching actual Sentinel-2 acquisitions, selecting matching tiles, reading image crops and cloud masks… This can take 1–2 minutes.");
		try {
			const r = await runSatelliteAnalysis({ data: {
				lon: center[0],
				lat: center[1],
				sizeKm: size,
				before,
				after,
				windowDays,
				maxCloud
			} });
			const scene = (s) => ({
				id: s.id,
				name: s.id,
				source: `Copernicus Sentinel-2 L2A · ${s.tile} · scene cloud ${s.cloud.toFixed(1)}%`,
				sourceUrl: s.metadata,
				capturedAt: s.date.slice(0, 10),
				loadedAt: r.generatedAt,
				width: r.width,
				height: r.height,
				originalSha256: s.sha256,
				hashKind: "decoded-rgb",
				dataUrl: png(s.rgb, r.width, r.height),
				resolutionM: r.metersPerPixel,
				bbox: {
					west: Math.min(...r.corners.map((p) => p[0])),
					south: Math.min(...r.corners.map((p) => p[1])),
					east: Math.max(...r.corners.map((p) => p[0])),
					north: Math.max(...r.corners.map((p) => p[1]))
				}
			});
			const review = {
				...newImageryReview(),
				title: `Satellite change scan · ${center[1].toFixed(3)}, ${center[0].toFixed(3)}`,
				before: scene(r.before),
				after: scene(r.after),
				alignmentConfirmed: true,
				marks: r.candidates.map((c, i) => ({
					id: crypto.randomUUID(),
					x: c.x,
					y: c.y,
					width: c.width,
					height: c.height,
					label: `Change candidate ${i + 1}`,
					assessment: "unreviewed",
					confidence: "low",
					note: `Automatically grouped ${c.pixels} changed land pixels; mean adjusted RGB difference ${c.score}/255. This is a change candidate, not a building identification or damage determination. Check shadows, seasonal changes and registration.`,
					updatedAt: r.generatedAt
				})),
				notes: `AUTOMATED ACQUISITION\nRequested dates: ${before} / ${after}, ±${windowDays} days.\nActual acquisitions: ${r.before.date} / ${r.after.date}.\nScenes found: ${r.searched.before} before / ${r.searched.after} after.\nShared projected grid EPSG:${r.epsg}; bounds ${r.projectedBounds.join(", ")}. Display spacing ${r.metersPerPixel.toFixed(1)} m; native RGB 10 m, SCL mask 20 m.\nComparable land ${(r.validFraction * 100).toFixed(1)}%; changed comparable land ${(r.changedFraction * 100).toFixed(1)}%.\nCloud/shadow/snow/no-data/water excluded using both SCL masks. Vegetation-to-vegetation changes excluded from candidates. Median exposure correction RGB: ${r.exposureBias.join(", ")}.\nCoordinates are aligned; residual sensor registration is not independently validated. Sentinel-2 cannot establish individual small-building damage.\n${r.attempts.length ? `Rejected pairs: ${r.attempts.join("; ")}` : ""}`
			};
			await onComplete(review);
			useAnalysisArea.getState().setOverlay({
				image: review.after.dataUrl,
				corners: r.corners,
				features: {
					...r.candidateFeatures,
					features: r.candidateFeatures.features.map((f, i) => ({
						...f,
						properties: {
							...f.properties,
							reviewMarkId: review.marks[i].id
						}
					}))
				},
				date: r.after.date.slice(0, 10),
				label: review.title
			});
			setResult(r);
			onStatus(`Scan complete: ${r.candidates.length} change candidates from real acquisitions on ${r.before.date.slice(0, 10)} and ${r.after.date.slice(0, 10)}. Select a candidate to inspect its image chips.`);
		} catch (e) {
			onStatus(e instanceof Error ? e.message : "Satellite acquisition failed.");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ir-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ir-kicker",
					children: "AUTOMATIC SATELLITE ACQUISITION + CHANGE SCREENING"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Scan the area you’re looking at" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Map center ",
					center[1].toFixed(4),
					"°, ",
					center[0].toFixed(4),
					"°. Close this panel and pan the map to change the area. No image upload needed."
				] })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ir-auto-fields",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Before target", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Scan before date",
						value: before,
						placeholder: "YYYY-MM-DD",
						maxLength: 10,
						disabled: busy,
						onChange: (e) => setBefore(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["After target", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Scan after date",
						value: after,
						placeholder: "YYYY-MM-DD",
						maxLength: 10,
						disabled: busy,
						onChange: (e) => setAfter(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Area width", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						"aria-label": "Scan area width",
						value: size,
						disabled: busy,
						onChange: (e) => setSize(Number(e.target.value)),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 2,
								children: "2 km · local area"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 5,
								children: "5 km · neighborhood"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 10,
								children: "10 km · district"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Search around dates", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						"aria-label": "Scene search window",
						value: windowDays,
						disabled: busy,
						onChange: (e) => setWindowDays(Number(e.target.value)),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 7,
								children: "±7 days"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 15,
								children: "±15 days"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 30,
								children: "±30 days"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Maximum scene cloud", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						"aria-label": "Maximum scene cloud",
						value: maxCloud,
						disabled: busy,
						onChange: (e) => setMaxCloud(Number(e.target.value)),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 10,
								children: "10%"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 20,
								children: "20%"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: 40,
								children: "40%"
							})
						]
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "ir-run",
				disabled: busy,
				onClick: () => void run(),
				children: busy ? "Acquiring & analyzing…" : "Find imagery & scan changes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ir-hint",
				children: "Automatically searches the scene catalogue, selects same-tile acquisitions, crops both dates to one grid, masks invalid/cloudy pixels, and groups changed areas. Public Sentinel-2 is 10 m: candidates indicate visible land/infrastructure change, not verified building damage."
			}),
			result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ir-auto-result",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							const c = result.corners;
							mapFit({
								west: Math.min(...c.map((p) => p[0])),
								south: Math.min(...c.map((p) => p[1])),
								east: Math.max(...c.map((p) => p[0])),
								north: Math.max(...c.map((p) => p[1]))
							}, {
								maxZoom: 15,
								pitch: 0
							});
							onShowMap();
						},
						children: "Show results on map"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [
						result.candidates.length,
						" candidates · ",
						(100 * result.validFraction).toFixed(0),
						"% comparable land"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						result.searched.before + result.searched.after,
						" catalogue matches searched ·",
						" ",
						(100 * result.changedFraction).toFixed(1),
						"% changed comparable land"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: [result.before, result.after].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: s.metadata,
						target: "_blank",
						rel: "noreferrer",
						children: [
							i ? "AFTER" : "BEFORE",
							" ",
							s.date.slice(0, 10),
							" · ",
							s.cloud.toFixed(1),
							"% scene cloud ↗"
						]
					}, s.id)) })
				]
			})
		]
	});
}
function CandidateChips({ before, after, area }) {
	const pad = .018, x = Math.max(0, area.x - pad), y = Math.max(0, area.y - pad), w = Math.min(1 - x, area.width + pad * 2), h = Math.min(1 - y, area.height + pad * 2);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "ir-chips",
		children: [before, after].map((scene, i) => scene && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", { children: [
			i ? "AFTER" : "BEFORE",
			" · ",
			scene.capturedAt
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				aspectRatio: `${w * scene.width}/${h * scene.height}`,
				position: "relative",
				overflow: "hidden"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				alt: `${i ? "After" : "Before"} candidate crop`,
				src: scene.dataUrl,
				style: {
					position: "absolute",
					maxWidth: "none",
					width: `${100 / w}%`,
					height: `${100 / h}%`,
					left: `${-x / w * 100}%`,
					top: `${-y / h * 100}%`
				}
			})
		})] }, scene.id))
	});
}
function database() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("ahsr-imagery-reviews", 1);
		request.onupgradeneeded = () => request.result.createObjectStore("reviews", { keyPath: "id" });
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Browser storage unavailable"));
		request.onblocked = () => reject(/* @__PURE__ */ new Error("Close other review tabs to unlock storage."));
	});
}
async function saveImageryReview(review) {
	const db = await database();
	try {
		await new Promise((resolve, reject) => {
			const tx = db.transaction("reviews", "readwrite");
			tx.objectStore("reviews").put(review);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Could not save review"));
			tx.onabort = () => reject(tx.error ?? /* @__PURE__ */ new Error("Review save was aborted"));
		});
	} finally {
		db.close();
	}
}
async function listImageryReviews() {
	const db = await database();
	try {
		return await new Promise((resolve, reject) => {
			const request = db.transaction("reviews").objectStore("reviews").getAll();
			request.onsuccess = () => {
				try {
					resolve(request.result.map((r) => parseImageryReview(JSON.stringify(r))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
				} catch {
					reject(/* @__PURE__ */ new Error("A saved review could not be read. Existing storage has not been changed."));
				}
			};
			request.onerror = () => reject(request.error);
		});
	} finally {
		db.close();
	}
}
async function decode(src) {
	const image = new Image();
	image.src = src;
	await image.decode();
	return image;
}
async function loadScene(file) {
	if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2e7) throw new Error("Use a PNG, JPEG or WebP smaller than 20 MB.");
	const bytes = await file.arrayBuffer();
	const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
	const url = URL.createObjectURL(file);
	try {
		const image = await decode(url);
		const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(image.width * scale);
		canvas.height = Math.round(image.height * scale);
		canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
		return {
			id: crypto.randomUUID(),
			name: file.name,
			source: "User-supplied imagery",
			sourceUrl: null,
			capturedAt: "",
			loadedAt: (/* @__PURE__ */ new Date()).toISOString(),
			width: canvas.width,
			height: canvas.height,
			originalSha256: digest,
			dataUrl: canvas.toDataURL("image/png"),
			resolutionM: null,
			bbox: null
		};
	} finally {
		URL.revokeObjectURL(url);
	}
}
function download(name, text, type) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 3e3);
}
function ImageryReviewWorkbench() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const mapOverlay = useAnalysisArea((s) => s.overlay);
	const [review, setReview] = (0, import_react.useState)(newImageryReview);
	const [saved, setSaved] = (0, import_react.useState)([]);
	const [status, setStatus] = (0, import_react.useState)("Choose two dates and run a scan. The app finds and processes the imagery for you.");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("side");
	const [swipe, setSwipe] = (0, import_react.useState)(50);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [drawing, setDrawing] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(null);
	const start = (0, import_react.useRef)(null);
	const [threshold, setThreshold] = (0, import_react.useState)(35);
	const [difference, setDifference] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const select = (e) => {
			const id = e.detail;
			if (review.marks.some((m) => m.id === id)) {
				setSelected(id);
				setOpen(true);
			}
		};
		window.addEventListener("civilian-candidate-select", select);
		return () => window.removeEventListener("civilian-candidate-select", select);
	}, [review.marks]);
	const errors = validatePair(review);
	const active = review.marks.find((m) => m.id === selected);
	const patch = (changes) => setReview((r) => ({
		...r,
		...changes,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	}));
	const act = async (fn) => {
		setBusy(true);
		try {
			await fn();
		} catch (e) {
			setStatus(e instanceof Error ? e.message : "The operation failed.");
		} finally {
			setBusy(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (open) listImageryReviews().then(setSaved).catch((e) => setStatus(String(e)));
	}, [open]);
	(0, import_react.useEffect)(() => {
		setDifference(null);
	}, [
		review.before,
		review.after,
		review.alignmentConfirmed,
		threshold
	]);
	const save = async () => {
		await saveImageryReview(review);
		setSaved(await listImageryReviews());
		setStatus("Saved in this browser. Export JSON for a portable backup.");
	};
	const markPatch = (changes) => patch({ marks: review.marks.map((m) => m.id === selected ? {
		...m,
		...changes,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	} : m) });
	const decide = async (disposition) => {
		const next = {
			...review,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			marks: review.marks.map((m) => m.id === selected ? {
				...m,
				disposition,
				assessment: disposition === "confirmed-change" ? "visible-change" : "no-visible-change",
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			} : m)
		};
		await saveImageryReview(next);
		setReview(next);
		setSaved(await listImageryReviews());
		setStatus("Analyst decision saved. No model accuracy or damage claim is implied.");
	};
	const rectangles = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 100 100",
		preserveAspectRatio: "none",
		className: "ir-annotations",
		"aria-hidden": "true",
		children: [review.marks.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: m.x * 100,
			y: m.y * 100,
			width: m.width * 100,
			height: m.height * 100,
			className: m.id === selected ? "selected" : ""
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
			x: m.x * 100,
			y: Math.max(3, m.y * 100 - 1),
			children: i + 1
		})] }, m.id)), draft && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: draft.x * 100,
			y: draft.y * 100,
			width: draft.width * 100,
			height: draft.height * 100
		})]
	});
	function stage(scene, annotate) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `ir-stage ${drawing && annotate ? "ir-draw" : ""}`,
			style: { aspectRatio: `${scene.width}/${scene.height}` },
			onPointerDown: (e) => {
				if (!drawing || !annotate || errors.length || review.marks.length >= 100) return;
				e.currentTarget.setPointerCapture(e.pointerId);
				const b = e.currentTarget.getBoundingClientRect();
				start.current = {
					x: (e.clientX - b.left) / b.width,
					y: (e.clientY - b.top) / b.height
				};
			},
			onPointerMove: (e) => {
				if (!start.current) return;
				const b = e.currentTarget.getBoundingClientRect();
				setDraft(normalizeRect(start.current.x, start.current.y, (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height));
			},
			onPointerCancel: () => {
				start.current = null;
				setDraft(null);
			},
			onPointerUp: (e) => {
				if (!start.current) return;
				const b = e.currentTarget.getBoundingClientRect();
				const rect = normalizeRect(start.current.x, start.current.y, (e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height);
				start.current = null;
				setDraft(null);
				if (rect) {
					const id = crypto.randomUUID();
					patch({ marks: [...review.marks, {
						...rect,
						id,
						label: `Area ${review.marks.length + 1}`,
						assessment: "unreviewed",
						confidence: "low",
						note: "",
						updatedAt: (/* @__PURE__ */ new Date()).toISOString()
					}] });
					setSelected(id);
					setDrawing(false);
				}
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: scene.dataUrl,
					alt: `${annotate ? "After" : "Before"} imagery`,
					draggable: false
				}),
				mode === "swipe" && annotate && review.before && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: review.before.dataUrl,
					alt: "Before imagery swipe overlay",
					draggable: false,
					style: { clipPath: `inset(0 ${100 - swipe}% 0 0)` }
				}),
				" ",
				annotate && difference && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: difference.url,
					alt: "Pixel change overlay",
					draggable: false
				}),
				" ",
				rectangles
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [
			mapOverlay && !open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ir-map-result",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: ["DATED SCAN · ", mapOverlay.date] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [mapOverlay.features.features.length, " change candidates · for review"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => useAnalysisArea.getState().setOverlay(null),
						children: "Hide scan layer"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "ir-launch",
					children: "AUTO CHANGE SCAN"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "ir-backdrop" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "ir-workbench",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "ir-header",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ir-kicker",
								children: "ABU HUREIRAH / CIVILIAN ANALYSIS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Automatic satellite change scan" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Find dated imagery, screen cloud cover, and surface civilian infrastructure change candidates." })
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
							className: "ir-button",
							"aria-label": "Close imagery review",
							children: "Close"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SatelliteAutoScan, {
						onShowMap: () => setOpen(false),
						busy,
						setBusy,
						onStatus: setStatus,
						onComplete: async (next) => {
							if (review.before || review.after) await saveImageryReview(review);
							await saveImageryReview(next);
							setReview(next);
							setSaved(await listImageryReviews());
							setSelected(next.marks[0]?.id ?? null);
							setMode("side");
							setDifference(null);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ir-toolbar",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "Review title",
								maxLength: 200,
								value: review.title,
								onChange: (e) => patch({ title: e.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: busy,
								onClick: () => void act(save),
								children: "Save review"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: busy,
								onClick: () => void act(async () => {
									if (review.before || review.after) await save();
									setReview(newImageryReview());
									setSelected(null);
									setDifference(null);
									setStatus("New review. Previous images were saved in this browser.");
								}),
								children: "New review"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								"aria-label": "Open saved review",
								value: "",
								disabled: busy,
								onChange: (e) => {
									const next = saved.find((r) => r.id === e.target.value);
									if (next) act(async () => {
										if (review.before || review.after) await save();
										setReview(next);
										setSelected(null);
										setStatus("Opened saved review.");
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: "",
									children: [
										"Saved reviews (",
										saved.length,
										")"
									]
								}), saved.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: r.id,
									children: r.title
								}, r.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ir-button",
								children: ["Import JSON", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ir-file",
									type: "file",
									accept: "application/json,.json",
									disabled: busy,
									onChange: (e) => {
										const f = e.target.files?.[0];
										e.target.value = "";
										if (f) act(async () => {
											if (f.size > 5e7) throw new Error("Review exceeds 50 MB.");
											const next = parseImageryReview(await f.text());
											for (const s of [next.before, next.after]) if (s) {
												const image = await decode(s.dataUrl);
												if (image.width !== s.width || image.height !== s.height) throw new Error("Image dimensions do not match the review metadata.");
											}
											if (review.before || review.after) await save();
											setReview(next);
											setSelected(null);
											setStatus("Imported review. Save to keep it in this browser.");
										});
									}
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ir-status",
						role: "status",
						children: status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ir-body",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
								className: "ir-manual",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: "Optional: use your own aligned imagery" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "ir-loaders",
										children: ["before", "after"].map((side) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: side === "before" ? "01 / BEFORE" : "02 / AFTER" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "ir-button",
												children: [review[side] ? "Replace image" : "Load image", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													className: "ir-file",
													"aria-label": `Load ${side} image`,
													type: "file",
													accept: "image/png,image/jpeg,image/webp",
													disabled: busy || review.marks.length > 0,
													onChange: (e) => {
														const f = e.target.files?.[0];
														e.target.value = "";
														if (f) act(async () => {
															const scene = await loadScene(f);
															patch({
																[side]: scene,
																alignmentConfirmed: false
															});
															setStatus("Image loaded. Enter its actual capture date and source.");
														});
													}
												})]
											}),
											review[side] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
													review[side].name,
													" · ",
													review[side].width,
													" × ",
													review[side].height
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Capture date", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "text",
													placeholder: "YYYY-MM-DD",
													maxLength: 10,
													inputMode: "numeric",
													"aria-label": `${side} capture date`,
													value: review[side].capturedAt,
													onChange: (e) => patch({ [side]: {
														...review[side],
														capturedAt: e.target.value
													} })
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Source / provider", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": `${side} image source`,
													maxLength: 300,
													value: review[side].source,
													onChange: (e) => patch({ [side]: {
														...review[side],
														source: e.target.value
													} })
												})] })
											] })
										] }, side))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "ir-hint",
										children: "Use aligned crops of the same area. PNG, JPEG or WebP, up to 20 MB each. Working copies are capped at 2,048 pixels; the original file hash is retained. Start a new review to replace images after marking areas."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ir-check",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: review.alignmentConfirmed,
									onChange: (e) => patch({ alignmentConfirmed: e.target.checked })
								}), "Use this aligned pair for comparison; inspect stable landmarks for residual misalignment."]
							}),
							review.before && errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ir-notice",
								children: errors.join(" ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ir-controls",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"aria-pressed": mode === "side",
										onClick: () => setMode("side"),
										children: "Side by side"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"aria-pressed": mode === "swipe",
										disabled: !!errors.length,
										onClick: () => setMode("swipe"),
										children: "Swipe"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"aria-pressed": drawing,
										disabled: !!errors.length || review.marks.length >= 100,
										onClick: () => setDrawing(!drawing),
										children: drawing ? "Drag on AFTER image" : "Mark an area"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: !!errors.length || busy,
										onClick: () => void act(async () => {
											if (difference) {
												setDifference(null);
												return;
											}
											const b = await decode(review.before.dataUrl), a = await decode(review.after.dataUrl);
											const c = document.createElement("canvas");
											c.width = Math.min(768, b.width);
											c.height = Math.round(c.width * b.height / b.width);
											const ctx = c.getContext("2d", { willReadFrequently: true });
											ctx.drawImage(b, 0, 0, c.width, c.height);
											const pixels = ctx.getImageData(0, 0, c.width, c.height);
											ctx.clearRect(0, 0, c.width, c.height);
											ctx.drawImage(a, 0, 0, c.width, c.height);
											const d = pixelDifference(pixels.data, ctx.getImageData(0, 0, c.width, c.height).data, threshold);
											const out = ctx.createImageData(c.width, c.height);
											out.data.set(d.overlay);
											ctx.putImageData(out, 0, 0);
											setDifference({
												url: c.toDataURL(),
												summary: d.valid ? `${(100 * d.changed / d.valid).toFixed(1)}% of comparable pixels exceed the threshold. This is not a damage percentage.${d.brightFraction > .25 ? " Many bright pixels: check clouds, glare and exposure." : ""}` : "No comparable opaque pixels. Review image coverage."
											});
										}),
										children: difference ? "Hide raw pixel differences" : "Show raw pixel differences"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
										"Threshold",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": "Pixel difference threshold",
											type: "range",
											min: "5",
											max: "120",
											value: threshold,
											onChange: (e) => setThreshold(Number(e.target.value))
										}),
										threshold
									] })
								]
							}),
							difference && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ir-notice",
								children: difference.summary
							}),
							mode === "swipe" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ir-swipe",
								children: [
									"Before ←",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										"aria-label": "Before after swipe position",
										min: "0",
										max: "100",
										value: swipe,
										onChange: (e) => setSwipe(Number(e.target.value))
									}),
									" ",
									"→ After"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ir-swipe",
								children: [
									"Zoom",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										"aria-label": "Image zoom",
										type: "range",
										min: "1",
										max: "4",
										step: "0.25",
										value: zoom,
										onChange: (e) => setZoom(Number(e.target.value))
									}),
									zoom,
									"×"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ir-image-scroll",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: { width: `${zoom * 100}%` },
									className: `ir-pair ${mode === "swipe" ? "single" : ""}`,
									children: [mode === "side" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: ["BEFORE · ", review.before?.capturedAt || "date unknown"] }), review.before ? stage(review.before, false) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "ir-empty",
										children: "Run a scan to acquire the earlier scene"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: ["AFTER · ", review.after?.capturedAt || "date unknown"] }), review.after ? stage(review.after, true) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "ir-empty",
										children: "The later scene appears here automatically"
									})] })]
								})
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: ["OBSERVATIONS ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: review.marks.length })] }),
							!review.marks.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ir-hint",
								children: "Mark a building, road, bridge or other infrastructure area on the after image. The same outline appears on both scenes."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ir-mark-list",
								children: review.marks.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									"aria-pressed": m.id === selected,
									onClick: () => setSelected(m.id),
									children: [
										i + 1,
										". ",
										m.label,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: m.disposition === "confirmed-change" ? "Change confirmed by analyst" : m.disposition === "rejected" ? "Rejected" : REVIEW_ASSESSMENTS[m.assessment] })
									]
								}, m.id))
							}),
							active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ir-editor",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandidateChips, {
										before: review.before,
										after: review.after,
										area: active
									}),
									mapOverlay?.features.features.some((f) => f.properties?.reviewMarkId === active.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											const ring = mapOverlay.features.features.find((f) => f.properties?.reviewMarkId === active.id).geometry.coordinates[0].slice(0, 4);
											const lon = ring.reduce((v, p) => v + p[0], 0) / 4, lat = ring.reduce((v, p) => v + p[1], 0) / 4;
											useAppStore.getState().setImagery("hires");
											useAppStore.getState().setFlyTarget({
												lon,
												lat,
												zoom: 16.7,
												label: active.label,
												inspect: true
											});
											setOpen(false);
										},
										children: "Inspect candidate on map"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ir-controls",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											disabled: busy,
											onClick: () => void act(() => decide("confirmed-change")),
											children: "Confirm visible change"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											disabled: busy,
											onClick: () => void act(() => decide("rejected")),
											children: "Reject candidate"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Area name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										"aria-label": "Area name",
										value: active.label,
										maxLength: 200,
										onChange: (e) => markPatch({ label: e.target.value })
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Assessment", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										"aria-label": "Area assessment",
										value: active.assessment,
										onChange: (e) => markPatch({ assessment: e.target.value }),
										children: Object.entries(REVIEW_ASSESSMENTS).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: k,
											children: v
										}, k))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Confidence", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										"aria-label": "Assessment confidence",
										value: active.confidence,
										onChange: (e) => markPatch({ confidence: e.target.value }),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "low",
												children: "Low"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "medium",
												children: "Medium"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "high",
												children: "High"
											})
										]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Visible evidence & alternative explanations", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										"aria-label": "Area evidence notes",
										maxLength: 1e4,
										value: active.note,
										onChange: (e) => markPatch({ note: e.target.value })
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											patch({ marks: review.marks.filter((m) => m.id !== selected) });
											setSelected(null);
										},
										children: "Remove area"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Review notes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								"aria-label": "Review notes",
								maxLength: 2e4,
								value: review.notes,
								onChange: (e) => patch({ notes: e.target.value })
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ir-exports",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: !review.before || !review.after,
									onClick: () => download(`imagery-review-${review.id}.html`, reviewHtml(review), "text/html"),
									children: "Export evidence report"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => download(`imagery-review-${review.id}.json`, JSON.stringify(review), "application/json"),
									children: "Export JSON backup"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ir-hint",
								children: "The report embeds both images, outlines, dates, image hashes and analyst notes. JSON can be imported into this workbench."
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", { children: REVIEW_LIMITATIONS })
				]
			})] })
		]
	});
}
function emptyLiveBundle() {
	const pending = (source) => ({
		source,
		fetchedAt: null,
		recordCount: 0,
		status: "gap",
		note: "This source has not returned a result yet."
	});
	return {
		firms: [],
		firmsMeta: pending("NASA FIRMS"),
		flights: [],
		flightsMeta: pending("ADS-B"),
		reports: [],
		reportsMeta: pending("ReliefWeb"),
		news: [],
		newsPoints: [],
		newsMeta: pending("News"),
		gdelt: [],
		gdeltMeta: pending("GDELT"),
		osm: [],
		osmMeta: pending("OpenStreetMap"),
		feeds: [],
		feedsMeta: pending("Public channels"),
		ticker: [],
		vessels: [],
		vesselsMeta: pending("Maritime")
	};
}
var JUMP = [
	{
		id: "hsss",
		label: "Khartoum"
	},
	{
		id: "wad-madani",
		label: "Wad Madani"
	},
	{
		id: "hsfs",
		label: "El Fasher"
	},
	{
		id: "hspn",
		label: "Port Sudan"
	},
	{
		id: "hsnn",
		label: "Nyala"
	},
	{
		id: "hsgn",
		label: "Geneina"
	},
	{
		id: "haso",
		label: "Asosa"
	},
	{
		id: "omam",
		label: "Al Dhafra"
	},
	{
		id: "jebel-ali",
		label: "Jebel Ali"
	},
	{
		id: "kufra",
		label: "Kufra"
	},
	{
		id: "adre",
		label: "Adré"
	},
	{
		id: "amdjarass",
		label: "Amdjarass"
	},
	{
		id: "hhas",
		label: "Assab"
	}
];
function DateStrip({ date, setDate, compareDate, setCompareDate, dated, swipeOn, setSwipeOn, onPickDate }) {
	const days = (0, import_react.useMemo)(() => Array.from({ length: 16 }, (_, i) => daysAgo(15 - i)), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel flex w-full items-center gap-3 px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "date",
				value: date,
				onChange: (e) => onPickDate(e.target.value),
				className: "h-9 w-[9.5rem] rounded-lg border border-border bg-raised px-2 font-mono text-xs tabular-nums",
				"aria-label": "Browse date"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto",
				children: days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onPickDate(d),
					className: cn("h-8 shrink-0 rounded-md px-2 font-mono text-[11px] tabular-nums", date === d ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised hover:text-fg"),
					children: d.slice(5)
				}, d))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "hidden shrink-0 items-center gap-2 text-xs text-muted sm:flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: swipeOn,
					onChange: (e) => setSwipeOn(e.target.checked)
				}), "Compare"]
			}),
			swipeOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "date",
				value: compareDate,
				onChange: (e) => setCompareDate(e.target.value),
				className: "hidden h-9 w-[9.5rem] rounded-lg border border-border bg-raised px-2 font-mono text-xs tabular-nums sm:block",
				"aria-label": "Compare date"
			}) : null,
			!dated ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "hidden max-w-[14rem] shrink-0 text-[11px] leading-snug text-subtle lg:block",
				children: "Picking a date switches to Sentinel-2 so the day actually means something."
			}) : null
		]
	});
}
function Workspace() {
	const [tab, setTab] = (0, import_react.useState)("news");
	const [live, setLive] = (0, import_react.useState)(null);
	const [liveError, setLiveError] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)("");
	const [boxOpen, setBoxOpen] = (0, import_react.useState)(false);
	const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
	const [leftOpen, setLeftOpen] = (0, import_react.useState)(false);
	const [sweeping, setSweeping] = (0, import_react.useState)(false);
	const [sweepNote, setSweepNote] = (0, import_react.useState)(null);
	const [brief, setBrief] = (0, import_react.useState)(null);
	const [briefLoading, setBriefLoading] = (0, import_react.useState)(false);
	const [sitrep, setSitrep] = (0, import_react.useState)(null);
	const [newsLoading, setNewsLoading] = (0, import_react.useState)(false);
	const [legendOpen, setLegendOpen] = (0, import_react.useState)(false);
	const [deskOpen, setDeskOpen] = (0, import_react.useState)(false);
	const [detectReport, setDetectReport] = (0, import_react.useState)(null);
	const [detecting, setDetecting] = (0, import_react.useState)(false);
	const customReports = useAppStore((s) => s.customReports);
	const searchRef = (0, import_react.useRef)(null);
	const [boxForm, setBoxForm] = (0, import_react.useState)({
		name: "",
		west: "32.2",
		south: "15.3",
		east: "32.8",
		north: "15.9"
	});
	const selectedSiteId = useAppStore((s) => s.selectedSiteId);
	const selectedAlertId = useAppStore((s) => s.selectedAlertId);
	const setSelectedSite = useAppStore((s) => s.setSelectedSite);
	const setSelectedAlert = useAppStore((s) => s.setSelectedAlert);
	const partyFilter = useAppStore((s) => s.partyFilter);
	const setPartyFilter = useAppStore((s) => s.setPartyFilter);
	const kindFilter = useAppStore((s) => s.kindFilter);
	useAppStore((s) => s.setKindFilter);
	const reviewFilter = useAppStore((s) => s.reviewFilter);
	const setReviewFilter = useAppStore((s) => s.setReviewFilter);
	const layers = useAppStore((s) => s.layers);
	const toggleLayer = useAppStore((s) => s.toggleLayer);
	const imagery = useAppStore((s) => s.imagery);
	const setImagery = useAppStore((s) => s.setImagery);
	const date = useAppStore((s) => s.date);
	const setDate = useAppStore((s) => s.setDate);
	const compareDate = useAppStore((s) => s.compareDate);
	const setCompareDate = useAppStore((s) => s.setCompareDate);
	const swipeOn = useAppStore((s) => s.swipeOn);
	const setSwipeOn = useAppStore((s) => s.setSwipeOn);
	const query = useAppStore((s) => s.query);
	const setQuery = useAppStore((s) => s.setQuery);
	const reviews = useAppStore((s) => s.reviews);
	const reviewAlert = useAppStore((s) => s.reviewAlert);
	const partyOverrides = useAppStore((s) => s.partyOverrides);
	const overrideParty = useAppStore((s) => s.overrideParty);
	const addBox = useAppStore((s) => s.addBox);
	const removeBox = useAppStore((s) => s.removeBox);
	const hideDefaultBox = useAppStore((s) => s.hideDefaultBox);
	const audit = useAppStore((s) => s.audit);
	const replaceLog = useAppStore((s) => s.replaceLog);
	const changeLog = useAppStore((s) => s.changeLog);
	const setLastSweepAt = useAppStore((s) => s.setLastSweepAt);
	const helpOpen = useAppStore((s) => s.helpOpen);
	const setHelpOpen = useAppStore((s) => s.setHelpOpen);
	const theaterId = useAppStore((s) => s.theaterId);
	const setTheater = useAppStore((s) => s.setTheater);
	const rightTab = useAppStore((s) => s.rightTab);
	const setRightTab = useAppStore((s) => s.setRightTab);
	const setFlyTarget = useAppStore((s) => s.setFlyTarget);
	const setSelectedReport = useAppStore((s) => s.setSelectedReport);
	const detectOn = useAppStore((s) => s.detectOn);
	const look = useAppStore((s) => s.look);
	const ingestFuae = useAppStore((s) => s.ingestFuae);
	const fuaeLog = useAppStore((s) => s.fuaeLog);
	const boxes = useVisibleBoxes();
	function applyLive(b, announce) {
		setLive((prev) => {
			return b.news.length === 0 && (prev?.news.length ?? 0) > 0 ? {
				...b,
				news: prev.news,
				newsPoints: prev.newsPoints,
				newsMeta: {
					...b.newsMeta,
					status: "stale",
					note: "Latest news refresh returned no rows. Previous results retained; check publication dates."
				},
				ticker: prev.ticker
			} : b;
		});
		setLiveError(null);
		const { next, added } = ingestLive(b, useAppStore.getState().changeLog);
		replaceLog(next);
		ingestFuae(scanFuae(mergeFlights(b.flights), b.vessels?.length ? b.vessels : allVessels()));
		setLastSweepAt((/* @__PURE__ */ new Date()).toISOString());
		setSitrep(compileSitrep({
			log: next,
			live: b,
			lastSweepAt: (/* @__PURE__ */ new Date()).toISOString()
		}));
		if (announce) {
			setSweepNote(added ? `${added} new log rows` : "Sweep finished · no new rows");
			window.setTimeout(() => setSweepNote(null), 4e3);
		}
	}
	(0, import_react.useEffect)(() => {
		setSitrep(compileSitrep({
			log: changeLog,
			live,
			lastSweepAt: useAppStore.getState().lastSweepAt
		}));
	}, [live, changeLog]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const load = (announce) => {
			setSweeping(true);
			getLiveBundle().then((b) => {
				if (!cancelled) applyLive(b, announce);
			}).catch((err) => {
				if (!cancelled) setLiveError(err instanceof Error ? err.message : "Live ingest failed");
			}).finally(() => {
				if (!cancelled) setSweeping(false);
			});
		};
		const last = useAppStore.getState().lastSweepAt;
		load(!last || Date.now() - Date.parse(last) > 216e5);
		const id = window.setInterval(() => load(true), 216e5);
		const applyNews = (n) => {
			if (cancelled) return;
			setLive((prev) => {
				if (!prev) return {
					...emptyLiveBundle(),
					news: n.items,
					newsPoints: n.points,
					newsMeta: n.meta,
					ticker: n.items.map((i) => ({
						source: i.source,
						title: i.title,
						url: i.url
					}))
				};
				const nextLive = {
					...prev,
					news: n.items,
					newsPoints: n.points,
					newsMeta: n.meta,
					ticker: n.items.map((i) => ({
						source: i.source,
						title: i.title,
						url: i.url
					}))
				};
				const { next } = ingestLive(nextLive, useAppStore.getState().changeLog);
				replaceLog(next);
				return nextLive;
			});
		};
		const refreshNews = () => {
			setNewsLoading(true);
			getNewsFeed().then(applyNews).catch(() => {
				if (!cancelled) setLive((prev) => ({
					...prev ?? emptyLiveBundle(),
					newsMeta: {
						...(prev ?? emptyLiveBundle()).newsMeta,
						status: prev?.news.length ? "stale" : "error",
						note: "News refresh failed. Any retained headlines keep their original publication dates."
					}
				}));
			}).finally(() => {
				if (!cancelled) setNewsLoading(false);
			});
		};
		refreshNews();
		const newsId = window.setInterval(refreshNews, 3e5);
		return () => {
			cancelled = true;
			window.clearInterval(id);
			window.clearInterval(newsId);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const poll = () => {
			getTraffic().then((t) => {
				if (cancelled) return;
				setLive((prev) => {
					if (!prev) return {
						...emptyLiveBundle(),
						flights: mergeFlights(t.flights),
						flightsMeta: t.flightsMeta,
						vessels: t.vessels,
						vesselsMeta: t.vesselsMeta
					};
					return {
						...prev,
						flights: mergeFlights(t.flights),
						flightsMeta: t.flightsMeta,
						vessels: t.vessels,
						vesselsMeta: t.vesselsMeta
					};
				});
				ingestFuae(scanFuae(mergeFlights(t.flights), t.vessels.length ? t.vessels : allVessels()));
			}).catch(() => {});
		};
		poll();
		const id = window.setInterval(poll, 2e4);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [ingestFuae]);
	(0, import_react.useEffect)(() => {
		const show = () => {
			if (!useAppStore.getState().helpSeen) useAppStore.getState().setHelpOpen(true);
		};
		const persist = useAppStore.persist;
		if (persist?.hasHydrated?.()) show();
		return persist?.onFinishHydration?.(show);
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") {
				if (useAppStore.getState().helpOpen) {
					e.preventDefault();
					setHelpOpen(false);
					return;
				}
				setSelectedAlert(null);
				setSelectedSite(null);
				setSearchOpen(false);
			}
			if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
				e.preventDefault();
				searchRef.current?.focus();
				setSearchOpen(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [setSelectedAlert, setSelectedSite]);
	const firms = live?.firms ?? [];
	const flights = mergeFlights(live?.flights ?? [], FLIGHTS);
	const vessels = allVessels();
	const gdelt = live?.gdelt?.length ? live.gdelt : GDELT_ARCHIVE;
	const osm = live?.osm?.length ? live.osm : OSM_SEED;
	const feeds = live?.feeds?.length ? live.feeds : FEED_SEED;
	(0, import_react.useEffect)(() => {
		if (selectedSiteId || selectedAlertId) setDeskOpen(true);
	}, [selectedSiteId, selectedAlertId]);
	(0, import_react.useEffect)(() => {
		ingestFuae(seedFuae());
	}, [ingestFuae]);
	const sites = (0, import_react.useMemo)(() => {
		return SITES.filter((s) => {
			const party = partyOverrides[s.id]?.party ?? s.party;
			if (partyFilter !== "all" && party !== partyFilter) return false;
			if (!siteInKindGroup(s.kind, kindFilter)) return false;
			return true;
		});
	}, [
		partyFilter,
		partyOverrides,
		kindFilter
	]);
	const alerts = (0, import_react.useMemo)(() => {
		return ALERTS.filter((a) => {
			const state = reviews[a.id]?.state ?? a.review;
			if (reviewFilter !== "all" && state !== reviewFilter) return false;
			if (partyFilter !== "all") {
				if (!a.siteIds.some((id) => {
					const site = SITES.find((s) => s.id === id);
					return (partyOverrides[id]?.party ?? site?.party) === partyFilter;
				})) return false;
			}
			return true;
		});
	}, [
		reviewFilter,
		partyFilter,
		partyOverrides,
		reviews
	]);
	const searchHits = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (q.length < 2) return {
			siteHits: [],
			alertHits: [],
			vistaHits: []
		};
		return {
			siteHits: SITES.filter((s) => s.name.toLowerCase().includes(q) || s.admin1.toLowerCase().includes(q) || s.kind.includes(q)).slice(0, 6),
			alertHits: ALERTS.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 4),
			vistaHits: VISTA_DIVS.filter((f) => f.properties.name.toLowerCase().includes(q) || f.properties.nameAr.includes(query.trim()) || (f.properties.place ?? "").toLowerCase().includes(q)).slice(0, 6)
		};
	}, [query]);
	const selectedSite = SITES.find((s) => s.id === selectedSiteId) ?? null;
	const selectedAlert = ALERTS.find((a) => a.id === selectedAlertId) ?? null;
	const siteObs = selectedSite ? OBSERVATIONS.filter((o) => o.siteId === selectedSite.id) : [];
	const siteParty = selectedSite ? partyOverrides[selectedSite.id]?.party ?? selectedSite.party : "unknown";
	const panelOpen = deskOpen;
	function applyReview(state) {
		if (!selectedAlert) return;
		reviewAlert(selectedAlert.id, state, note, selectedAlert.confidence);
		setNote("");
	}
	function pickDate(d) {
		if (!IMAGERY[imagery].dated) setImagery("s2");
		setDate(d);
	}
	function sweepNow() {
		setSweeping(true);
		getLiveBundle().then((b) => applyLive(b, true)).catch((err) => setLiveError(err instanceof Error ? err.message : "Live ingest failed")).finally(() => setSweeping(false));
	}
	function runBrief() {
		setBriefLoading(true);
		generateAiBrief().then((b) => setBrief(b)).catch((err) => setBrief({
			ok: false,
			model: "grok-4.5",
			generatedAt: Date.now(),
			items: [],
			citations: [],
			error: err instanceof Error ? err.message : "Brief failed"
		})).finally(() => setBriefLoading(false));
	}
	const allReports = [...customReports, ...SEED_REPORTS];
	const newsFeed = live ? {
		items: live.news,
		points: live.newsPoints,
		meta: live.newsMeta
	} : null;
	const aiEvents = brief?.items.filter((i) => i.lat != null && i.lon != null) ?? [];
	const briefingDoc = (0, import_react.useMemo)(() => {
		if (!sitrep) return null;
		return composeBriefing({
			sitrep,
			live,
			log: changeLog
		});
	}, [
		sitrep,
		live,
		changeLog
	]);
	const briefingOn = tab === "brief" || rightTab === "brief";
	const newsPoints = live?.newsPoints ?? [];
	firms.length;
	flights.length;
	newsPoints.length;
	(0, import_react.useEffect)(() => {
		if (!detectOn) {
			setDetectReport(null);
			setDetecting(false);
			return;
		}
		const args = {
			boxes,
			firms,
			flights,
			osm,
			news: newsPoints,
			date,
			compareDate,
			vessels,
			gdelt
		};
		const fused = fuseDetect(args);
		setDetectReport({
			hits: fused,
			ranAt: (/* @__PURE__ */ new Date()).toISOString(),
			opticalTried: 0,
			opticalOk: 0,
			gridTried: 0,
			gridHits: 0,
			note: "Sweeping blank satellite tiles (Esri + Sentinel-2) for pads, yards, berms, change. Known pins scored in parallel."
		});
		setDetecting(true);
		let cancelled = false;
		const t = window.setTimeout(() => {
			runDetect({
				...args,
				optical: true
			}).then((r) => {
				if (!cancelled) {
					setDetectReport(r);
					setDetecting(false);
				}
			});
		}, 600);
		return () => {
			cancelled = true;
			window.clearTimeout(t);
		};
	}, [
		detectOn,
		date,
		compareDate,
		boxes.length
	]);
	function openDesk(tabId = "queue") {
		setDeskOpen(true);
		setRightTab(tabId);
	}
	function openAnno(id) {
		const a = briefingDoc?.annotations.find((x) => x.id === id);
		if (!a) return;
		setFlyTarget({
			lat: a.lat,
			lon: a.lon,
			zoom: 8.2,
			label: a.title
		});
	}
	function openDetect(hit) {
		setImagery("hires");
		setFlyTarget(inspectFromHit(hit));
		if (hit.siteId) setSelectedSite(hit.siteId);
	}
	const railProps = {
		date,
		compareDate,
		setDate,
		setCompareDate,
		swipeOn,
		setSwipeOn,
		layers,
		toggleLayer,
		imagery,
		setImagery,
		partyFilter,
		setPartyFilter,
		query,
		setQuery,
		boxes,
		boxOpen,
		setBoxOpen,
		boxForm,
		setBoxForm,
		addBox,
		removeBox,
		hideDefaultBox,
		flights,
		firms
	};
	const rightProps = {
		alerts,
		sites,
		selectedAlert,
		selectedSite,
		siteParty,
		siteObs,
		reviews,
		note,
		setNote,
		applyReview,
		setSelectedAlert,
		setSelectedSite,
		reviewFilter,
		setReviewFilter,
		overrideParty,
		flights,
		live,
		liveError,
		audit,
		news: newsFeed,
		newsLoading,
		brief,
		briefLoading,
		onRunBrief: runBrief,
		sitrep,
		briefingDoc,
		onOpenAnno: openAnno,
		feeds,
		feedsMeta: live?.feedsMeta ?? null,
		fuae: fuaeLog,
		onOpenFuae: (r) => {
			setFlyTarget({
				lat: r.lat,
				lon: r.lon,
				zoom: 7.4,
				label: r.title
			});
			setDeskOpen(true);
			setRightTab("fuae");
		},
		detections: detectReport?.hits ?? [],
		onOpenFlag: (f) => {
			setImagery("hires");
			setFlyTarget(inspectFromFlag(f));
			if (f.siteId) setSelectedSite(f.siteId);
			if (f.id.startsWith("flag-rep-")) {
				setSelectedReport(f.id.slice(9));
				setDeskOpen(true);
			}
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh overflow-hidden bg-bg text-fg",
		"data-look": look,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapCanvas, {
				boxes,
				firms,
				flights,
				panelOpen,
				reports: allReports,
				newsPoints: live?.newsPoints ?? [],
				aiEvents,
				gdelt,
				osm,
				vessels,
				briefingOn,
				annotations: briefingOn ? briefingDoc?.annotations ?? [] : [],
				detections: detectOn ? detectReport?.hits ?? [] : [],
				fuae: fuaeLog
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SitroomFx, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-30 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassificationBar, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-start gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/",
								className: "hud-panel hud-panel-bracket pointer-events-auto flex items-center gap-2.5 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-8 items-center justify-center border border-accent/50 text-accent",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block font-mono text-[10px] tracking-[0.22em] text-accent",
											children: "ABU HUREIRAH"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block font-mono text-sm font-medium leading-tight tracking-tight",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "sm:hidden",
												children: "AHSR · SDN"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "hidden sm:inline",
												children: "SITUATION ROOM"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden font-mono text-[10px] tracking-[0.14em] text-muted sm:block",
											children: "SUDAN WING"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-auto relative min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "hud-panel relative block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										ref: searchRef,
										value: query,
										onChange: (e) => {
											setQuery(e.target.value);
											setSearchOpen(true);
										},
										onFocus: () => setSearchOpen(true),
										placeholder: "Jump to a site, division, or alert  ·  /",
										className: "h-11 w-full bg-transparent pl-10 pr-3 text-sm text-fg placeholder:text-subtle"
									})]
								}), searchOpen && query.trim().length >= 2 && searchHits.siteHits.length + searchHits.alertHits.length + searchHits.vistaHits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hud-panel absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden py-1",
									children: [
										searchHits.siteHits.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-raised",
											onClick: () => {
												setSelectedSite(s.id);
												setSelectedAlert(null);
												setQuery("");
												setSearchOpen(false);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-subtle",
												children: [
													s.kind,
													" · ",
													s.admin1
												]
											})]
										}, s.id)),
										searchHits.vistaHits.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-raised",
											onClick: () => {
												const [lon, lat] = f.geometry.coordinates;
												setFlyTarget({
													lat,
													lon,
													zoom: 12.4,
													label: f.properties.name
												});
												setQuery("");
												setSearchOpen(false);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f.properties.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-subtle",
												children: ["Vista · ", f.properties.place]
											})]
										}, f.properties.id)),
										searchHits.alertHits.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-raised",
											onClick: () => {
												setSelectedAlert(a.id);
												const first = a.siteIds[0];
												if (first) setSelectedSite(first);
												setQuery("");
												setSearchOpen(false);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-subtle",
												children: "alert"
											})]
										}, a.id))
									]
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
								className: "pointer-events-auto hidden items-center gap-2 sm:flex",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SensorBar, {
										docsOpen: deskOpen,
										onDocs: () => {
											if (deskOpen) setDeskOpen(false);
											else openDesk("queue");
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "hud-panel flex items-center gap-2 px-3 py-1.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockChip, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hud-panel hidden items-center gap-1 p-1 lg:flex",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setDeskOpen((v) => !v),
												className: cn("rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider hover:bg-raised", deskOpen ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
												children: "DOCS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													openDesk("fuae");
												},
												className: "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg",
												children: ["FUAE", fuaeLog.length ? ` ${fuaeLog.length}` : ""]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/methods",
												className: "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg",
												children: "METHODS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/ethics",
												className: "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg",
												children: "ETHICS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/sop",
												className: "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg",
												children: "SOP"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/flyer",
												className: "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg",
												children: "FLYER"
											})
										]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex items-start gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BasemapPicker, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pointer-events-auto hidden flex-wrap gap-1 md:flex",
							children: THEATERS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setTheater(t.id);
									mapFit(t);
								},
								className: cn("h-8 border border-border bg-bg/70 px-2.5 font-mono text-[10px] tracking-wider text-muted backdrop-blur-sm hover:text-fg", theaterId === t.id && "border-accent bg-accent text-accent-fg"),
								children: t.short
							}, t.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pointer-events-auto hidden flex-wrap gap-1 lg:flex",
							children: (THEATER_BY_ID[theaterId]?.jumps.length ? THEATER_BY_ID[theaterId].jumps : JUMP).map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setSelectedAlert(null);
									setSelectedSite(j.id);
								},
								className: cn("h-8 border border-border bg-bg/70 px-3 text-xs text-muted backdrop-blur-sm hover:text-fg", selectedSiteId === j.id && "border-accent bg-accent text-accent-fg"),
								children: j.label
							}, j.id))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("pointer-events-none absolute right-3 top-[11.5rem] z-20 md:top-[13.5rem]", deskOpen && "lg:right-[26.2rem]"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerStack, { counts: {
					ai: aiEvents.length,
					reports: allReports.length,
					news: live?.news.length ?? 0,
					fires: firms.length,
					feeds: feeds.length,
					flights: flights.length,
					vessels: vessels.length
				} })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute bottom-24 left-3 top-[14rem] z-20 hidden w-60 md:block",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto mb-2 flex flex-wrap items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-8 rounded-full border border-border bg-bg/80 px-3 text-xs text-muted hover:text-fg",
								onClick: () => setLeftOpen((v) => !v),
								children: leftOpen ? "Hide layers" : "Layers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Zoom in",
								className: "flex size-8 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg",
								onClick: () => mapCommand("in"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Zoom out",
								className: "flex size-8 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg",
								onClick: () => mapCommand("out"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg/80 px-3 text-xs text-muted hover:text-fg",
								onClick: sweepNow,
								disabled: sweeping,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-3.5", sweeping && "animate-spin") }), sweeping ? "Sweeping" : "Sweep now"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg/80 px-3 text-xs text-muted hover:text-fg",
								onClick: () => mapMeasure(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ruler, { className: "size-3.5" }), "Measure"]
							})
						]
					}),
					sweepNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pointer-events-none mb-2 rounded-full border border-border bg-bg/80 px-3 py-1 text-[11px] text-fg",
						children: sweepNote
					}) : liveError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pointer-events-none mb-2 rounded-full border border-damage/40 bg-bg/80 px-3 py-1 text-[11px] text-damage",
						children: liveError
					}) : null,
					leftOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hud-panel pointer-events-auto h-[min(100%,calc(100dvh-16rem))] overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeftRail, {
							overlay: true,
							...railProps
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto mt-auto",
						children: [imagery === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlLegend, {
							open: legendOpen,
							onToggle: () => setLegendOpen((v) => !v)
						}) : null, detectOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetectPanel, {
							report: detectReport,
							loading: detecting,
							onOpen: openDetect,
							coincidence: signalCoincidence({
								flights,
								firms,
								gdelt,
								news: live?.news.length ?? 0,
								fuae: fuaeLog
							})
						}) : null]
					})
				]
			}),
			deskOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-3 bottom-[5.5rem] top-[7.5rem] z-40 md:inset-auto md:bottom-24 md:right-3 md:top-[14rem] md:w-[24.5rem] lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hud-panel pointer-events-auto flex h-full flex-col overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center justify-between border-b border-border px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-[10px] tracking-wider text-muted",
							children: "DOCS · briefs · logs · news"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-muted hover:text-fg",
							onClick: () => setDeskOpen(false),
							children: "Close"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RightRail, { ...rightProps })]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageryReviewWorkbench, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-label": "Toggle documentation drawer",
				"aria-expanded": deskOpen,
				className: "pointer-events-auto absolute bottom-5 right-3 z-40 flex h-11 items-center gap-2 rounded-md border border-accent bg-bg/95 px-4 font-mono text-xs text-accent md:bottom-28",
				onClick: (e) => {
					e.stopPropagation();
					setDeskOpen((v) => !v);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-4" }), "DOCS"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden p-3 md:block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-auto mx-auto mb-2 flex max-w-5xl justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookTray, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-auto mx-auto max-w-5xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateStrip, {
						date,
						setDate,
						compareDate,
						setCompareDate,
						dated: IMAGERY[imagery].dated,
						swipeOn,
						setSwipeOn,
						onPickDate: pickDate
					})
				})]
			}),
			helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-bg/80 p-3",
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": "help-title",
				onClick: (e) => {
					e.stopPropagation();
					setHelpOpen(false);
				},
				onPointerDown: (e) => {
					if (e.target === e.currentTarget) setHelpOpen(false);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hud-panel flex max-h-[min(90dvh,36rem)] w-full max-w-lg flex-col overflow-hidden",
					onClick: (e) => e.stopPropagation(),
					onPointerDown: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "shrink-0 px-5 pt-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-widest text-subtle",
									children: "How this works"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									id: "help-title",
									className: "mt-1 font-mono text-xl font-medium tracking-tight",
									children: "Abu Hureirah Situation Room"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-mono text-[11px] tracking-widest text-accent",
									children: "SUDAN WING"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "min-h-0 flex-1 list-decimal space-y-3 overflow-y-auto px-5 py-4 pl-10 text-sm leading-relaxed text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Theater chips"
								}), " jump Sudan, Egypt, Ethiopia, Somalia, Chad, Libya, UAE, Eritrea, and the Red Sea corridor. Pins are public sites — bases, yards, ports, crossings — not occupancy."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "1–6"
								}), " switch God’s Eye View sensor looks on the satellite itself: Optical, CRT phosphor, NVG, FLIR ironbow, Noir, Snow. Looks tint the map tiles — not the HUD. H still toggles HUD chrome."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "Double-click"
									}),
									" the map to descend on that point. Site chips fly in with pitch and a lock box. ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "ORBIT"
									}),
									" / O slowly circles the target. Q / E bank the view. R resets north."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Contacts"
								}), " are live ADS-B plus maritime lane markers that crawl along documented Red Sea / Aden / Suez corridors. Cargo-typical airframes paint amber. Lane markers are NOT live AIS — they move so the maritime picture is not frozen."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "DOCS"
									}),
									" (next to HUD / DET, or the ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "Briefs · logs · news"
									}),
									" pill) opens news, log, brief, FUAE, queue. Closed by default so the satellite is not covered."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "Basemap picker"
									}),
									" sits top-left: High-res Esri, Google satellite (compare yards/roofs), Sentinel-2 10 m, VIIRS daily, Dark context, dated HLS. Control shading (SAF cyan / RSF rust) is only on the dark map, not on satellite. ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "Vista"
									}),
									" is the public Google My Map (copied from Vista, translated to English): 20 SAF division HQs and 10 control polygons. Fills on the dark map; pins and outlines stay on satellite."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Documentation archive only. No targeting, fire control, or kill-chain language. Public data." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid shrink-0 grid-cols-2 gap-2 border-t border-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-12 rounded-xl bg-accent text-sm font-medium text-accent-fg",
								onClick: (e) => {
									e.stopPropagation();
									setHelpOpen(false);
								},
								onPointerUp: (e) => {
									e.preventDefault();
									e.stopPropagation();
									setHelpOpen(false);
								},
								children: "Got it — open the map"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/flyer",
								className: "flex h-12 items-center justify-center rounded-xl border border-border text-sm text-muted hover:text-fg",
								children: "Flyer / icon copy"
							})]
						})
					]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: cn("pointer-events-auto absolute bottom-40 z-20 hidden size-10 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg lg:flex", deskOpen ? "right-[26.2rem]" : "right-3"),
				"aria-label": "How this works",
				onClick: () => setHelpOpen(true),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "size-4" })
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workspace, {});
}
//#endregion
export { Home as component };
