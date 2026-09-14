import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link, y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as CLAIM_CLASS, t as ACTORS } from "./doctrine-BoQ_KKoM.mjs";
import { a as FACTION_META, c as imageryLinks, i as CONTROL_ZONES, l as reportsToLog, n as CONTROL_AS_OF, o as SEED_REPORTS, r as CONTROL_SOURCE, s as geocodePlace, t as CATEGORY_META } from "./osint-BYV_Xgat.mjs";
import { C as ExternalLink, D as CircleHelp, E as ClipboardList, O as ChevronDown, S as Eye, T as Copy, _ as LoaderCircle, a as Ship, b as Flame, c as Ruler, f as Plus, g as Map$1, h as Minus, i as Shield, k as Check, l as RefreshCw, m as Newspaper, n as TriangleAlert, o as Search, p as Plane, r as Sparkles, t as X, u as Radio, v as Layers, w as Download, x as FileText, y as Focus } from "../_libs/lucide-react.mjs";
import { a as daysAgo, c as mapCommand, d as snapshotUrl, i as copyText, l as mapFit, n as PARTY_TONE, o as downloadBlob, r as cn, s as formatUtc, t as Button, u as mapMeasure } from "./button-B8-BRhKG.mjs";
import { C as WATCH_BOXES, D as deadReckon, E as createSsrRpc, F as padBbox, I as partyToFaction, M as mergeFlights, N as mergedControlCities, O as gdeltFamily, R as siteInKindGroup, S as VESSEL_SEED, T as controlZonesFor, _ as PARTY_LABEL, a as CHANNEL_TONE, b as SITES, c as CONTROL_CITIES, d as FLIGHTS, f as GDELT_ARCHIVE, g as OSM_SEED, h as OBSERVATIONS, i as ARCHIVE_EVENTS, j as isUsefulOsm, k as getNewsFeed, l as FEED_CHANNELS, m as KIND_GROUP_LABEL, n as ALERTS, o as CITATIONS, p as IMAGERY, r as AOI, s as CONFIDENCE_RUBRIC, u as FEED_SEED, v as REGIONAL_EVENTS, w as allVessels, y as SEA_LANES } from "./control-BMG1rbv2.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-COQwBm0D.js
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
		const c = a.firstSeen.localeCompare(b.firstSeen);
		if (c !== 0) return c;
		return a.id.localeCompare(b.id);
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
var SENSOR_LOOKS = [
	{
		id: "normal",
		label: "OPTICAL",
		key: "1"
	},
	{
		id: "crt",
		label: "CRT",
		key: "2"
	},
	{
		id: "nvg",
		label: "NVG",
		key: "3"
	},
	{
		id: "flir",
		label: "FLIR",
		key: "4"
	},
	{
		id: "noir",
		label: "NOIR",
		key: "5"
	},
	{
		id: "snow",
		label: "SNOW",
		key: "6"
	}
];
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
		reports: true,
		ai: true,
		gdelt: true,
		osm: false,
		vessels: true,
		corridors: true
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
	helpOpen: true,
	customReports: [],
	selectedReportId: null,
	addingReport: false,
	rightTab: "log",
	sensor: "normal",
	hudOn: true,
	detectOn: true,
	theaterId: "sdn",
	controlUpdates: [],
	flyTarget: null,
	dateLock: false,
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
	setHelpOpen: (v) => set({ helpOpen: v }),
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
	setSensor: (sensor) => set({ sensor }),
	setHudOn: (hudOn) => set({ hudOn }),
	setDetectOn: (detectOn) => set({ detectOn }),
	setTheater: (theaterId) => set({ theaterId }),
	addControlUpdate: (u) => set((s) => ({ controlUpdates: [u, ...s.controlUpdates].slice(0, 80) })),
	setFlyTarget: (flyTarget) => set(flyTarget ? {
		flyTarget,
		selectedSiteId: null
	} : { flyTarget: null }),
	setDateLock: (dateLock) => set({ dateLock })
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
		helpOpen: s.helpOpen,
		customReports: s.customReports,
		sensor: s.sensor,
		hudOn: s.hudOn,
		detectOn: s.detectOn,
		theaterId: s.theaterId,
		controlUpdates: s.controlUpdates,
		dateLock: s.dateLock
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
				corridors: p.layers?.corridors ?? true
			},
			controlUpdates: p.controlUpdates ?? []
		};
	}
}));
function useVisibleBoxes() {
	const custom = useAppStore((s) => s.customBoxes);
	const hidden = useAppStore((s) => s.hiddenBoxIds);
	return [...WATCH_BOXES.filter((b) => !hidden.includes(b.id)), ...custom];
}
function Badge({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted", className),
		...props
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
var DARK_TILES = "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png";
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
	if (id === "esri") return imagery === "hires" || imagery === "s2" || imagery === "viirs" ? "visible" : "none";
	if (id === "hls") return imagery === "s2" ? "visible" : "none";
	if (id === "viirs") return imagery === "viirs" ? "visible" : "none";
	return imagery === "s2cloudless" ? "visible" : "none";
}
function hudPad(panelOpen) {
	return {
		top: 220,
		right: panelOpen ? 420 : 72,
		bottom: 108,
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
			dark: {
				type: "raster",
				tiles: [DARK_TILES],
				tileSize: 256,
				maxzoom: 18,
				attribution: "CARTO Dark Matter"
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
function MapCanvas({ boxes, firms, flights, panelOpen = false, reports = [], newsPoints = [], aiEvents = [], gdelt = [], osm = [], vessels = [], briefingOn = false, annotations = [] }) {
	const host = (0, import_react.useRef)(null);
	const wrap = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const ready = (0, import_react.useRef)(false);
	const hoverPopup = (0, import_react.useRef)(null);
	const [engine, setEngine] = (0, import_react.useState)("static");
	const [cursor, setCursor] = (0, import_react.useState)("—");
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
	const flightSnap = (0, import_react.useRef)({
		rows: flights,
		at: Date.now()
	});
	(0, import_react.useEffect)(() => {
		if (!host.current) return;
		let cancelled = false;
		let map = null;
		let ro = null;
		let onCmd = null;
		let onFit = null;
		let onMeasure = null;
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
				maxPitch: 0
			});
			map.addControl(new NavigationControl({ showCompass: false }), "bottom-left");
			map.addControl(new ScaleControl({
				maxWidth: 110,
				unit: "metric"
			}), "bottom-left");
			map.setPadding(hudPad(false));
			mapRef.current = map;
			const boxesNow = boxes;
			const firmsNow = firms;
			const flightsNow = flightSnap.current.rows;
			allVessels();
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
						"circle-radius": 6,
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
						"circle-opacity": .55,
						"circle-stroke-width": 1.4,
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
							.9,
							6,
							1.35,
							10,
							1.7
						],
						"icon-rotate": ["to-number", ["get", "track"]],
						"icon-rotation-alignment": "map",
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
						"text-field": [
							"step",
							["zoom"],
							"",
							5.4,
							["get", "label"]
						],
						"text-size": 11,
						"text-offset": [0, 1.45],
						"text-allow-overlap": true
					},
					paint: {
						"text-color": "#e8f6ee",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.4
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
						"circle-radius": 5,
						"circle-color": "#7ec8b3",
						"circle-opacity": .5
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
							.8,
							7,
							1.25
						],
						"icon-rotate": ["to-number", ["get", "cog"]],
						"icon-rotation-alignment": "map",
						"icon-allow-overlap": true,
						"icon-ignore-placement": true,
						"text-field": [
							"step",
							["zoom"],
							"",
							5.2,
							["get", "name"]
						],
						"text-size": 10,
						"text-offset": [0, 1.35],
						"text-allow-overlap": true
					},
					paint: {
						"text-color": "#9adbb8",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.2
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
						"fill-opacity": .5
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
						"line-width": 3,
						"line-opacity": 1
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
						"line-width": 3.2,
						"line-opacity": 1,
						"line-dasharray": [2.6, 1.4]
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
						"circle-radius": 5,
						"circle-color": [
							"match",
							["get", "faction"],
							"saf",
							FACTION_META.saf.color,
							"rsf",
							FACTION_META.rsf.color,
							FACTION_META.contested.color
						],
						"circle-stroke-width": 1.6,
						"circle-stroke-color": "#07090b"
					}
				});
				map.addSource("control-labels", {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: controlZonesFor(state.theaterId).map((z) => {
							let la = 0;
							let lo = 0;
							for (const [a, b] of z.polygon) {
								la += a;
								lo += b;
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
									coordinates: [lo / n, la / n]
								}
							};
						})
					}
				});
				map.addLayer({
					id: "control-labels",
					type: "symbol",
					source: "control-labels",
					layout: {
						"text-field": ["get", "label"],
						"text-size": 12,
						"text-allow-overlap": true,
						"text-padding": 2
					},
					paint: {
						"text-color": "#f4fff8",
						"text-halo-color": "#07090b",
						"text-halo-width": 1.6
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
			bindPopup("sites", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name ?? ""}</div>`);
			bindPopup("flights-icon", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.label ?? p.hex}<div style="opacity:.7;font-size:11px">ADS-B · not a cargo claim</div></div>`);
			bindPopup("vessels-icon", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name}<div style="opacity:.7;font-size:11px">${p.kind === "lane" ? "Documented lane marker — not live AIS" : "Port node — not live AIS"}</div></div>`);
			bindPopup("news-pts", (p) => `<div style="font:500 12px/1.35 'IBM Plex Sans',system-ui">${p.name} · ${p.count} headlines<div style="opacity:.7;font-size:11px">Named-place centroid</div></div>`);
			bindPopup("brief-pts", (p) => `<div style="max-width:260px;font:500 12px/1.4 'IBM Plex Sans',system-ui"><div>${p.title}</div><div style="opacity:.75;font-size:11px;margin-top:4px">${p.claim} · ${p.confidence}</div><div style="font-weight:400;font-size:11px;margin-top:6px">${p.paragraph ?? ""}</div><div style="opacity:.65;font-size:10px;margin-top:6px">${p.sources ?? ""}</div></div>`);
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
				if (cmd === "in") map.zoomIn({ duration: 250 });
				if (cmd === "out") map.zoomOut({ duration: 250 });
			};
			onFit = (ev) => {
				const b = ev.detail;
				map?.fitBounds([[b.west, b.south], [b.east, b.north]], {
					padding: 48,
					duration: 800,
					maxZoom: 11.5
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
			hoverPopup.current?.remove();
			ro?.disconnect();
			map?.remove();
			mapRef.current = null;
		};
	}, []);
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
		setVis("dark", imagery === "dark");
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
		setVis("sites", layers.sites);
		setVis("control-fill", layers.control);
		setVis("control-line", layers.control);
		setVis("control-line-dash", layers.control);
		setVis("control-cities", layers.control);
		setVis("control-labels", layers.control);
		setVis("osint-reports", layers.reports);
		setVis("news-pts", layers.news);
		setVis("ai-pts", layers.ai);
		setVis("gdelt", layers.gdelt);
		setVis("gdelt-glow", layers.gdelt);
		setVis("osm", layers.osm);
		setVis("brief-fill", briefingOn);
		setVis("brief-line", briefingOn);
		setVis("brief-pts", briefingOn);
	}, [
		layers,
		imagery,
		briefingOn
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
			const advanced = rows.map((f) => deadReckon(f, dt));
			const fs = map.getSource("flights");
			if (fs && "setData" in fs) fs.setData(flightData(advanced));
			const vs = map.getSource("vessels");
			if (vs && "setData" in vs) vs.setData(vesselData(allVessels(Date.now())));
		}, 700);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("vessels");
		if (src && "setData" in src) src.setData(vesselData(allVessels()));
	}, [vessels]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready.current) return;
		const src = map.getSource("control");
		if (src && "setData" in src) src.setData(controlFc(theaterId));
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
		const src = map.getSource("news-pts");
		if (src && "setData" in src) src.setData(pointFc(newsPoints, (r) => ({
			name: r.name,
			count: r.count
		})));
	}, [newsPoints]);
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
		map.flyTo({
			center: [site.lon, site.lat],
			zoom: yardsZoom ? 17.2 : close ? 16.1 : 14.6,
			duration: 900,
			essential: true
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
			duration: 800,
			maxZoom: 11.5
		});
	}, [focusedBoxId, boxes]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !flyTarget) return;
		map.flyTo({
			center: [flyTarget.lon, flyTarget.lat],
			zoom: flyTarget.zoom,
			duration: 900,
			essential: true
		});
		setFlyTarget(null);
	}, [flyTarget, setFlyTarget]);
	(0, import_react.useEffect)(() => {
		const t = THEATER_BY_ID[theaterId];
		const map = mapRef.current;
		if (!map || !ready.current || !t) return;
		map.fitBounds([[t.west, t.south], [t.east, t.north]], {
			padding: 40,
			duration: 700,
			maxZoom: t.zoom
		});
	}, [theaterId]);
	const grain = imagery === "s2" ? `S2 HLS ${date}` : imagery === "viirs" ? `VIIRS ${date}` : imagery === "s2cloudless" ? "S2 mosaic 2024" : imagery === "dark" ? "Dark context" : "High-res Esri";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrap,
		className: "absolute inset-0 bg-bg",
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
	const { alerts, sites, selectedAlert, selectedSite, siteParty, siteObs, reviews, note, setNote, applyReview, setSelectedAlert, setSelectedSite, reviewFilter, setReviewFilter, overrideParty, flights, live, liveError, audit, force, news, newsLoading, brief, briefLoading, onRunBrief, sitrep, feeds, feedsMeta, briefingDoc, onOpenAnno } = props;
	const selectedReportId = useAppStore((s) => s.selectedReportId);
	const addingReport = useAppStore((s) => s.addingReport);
	const customReports = useAppStore((s) => s.customReports);
	const addReport = useAppStore((s) => s.addReport);
	const setSelectedReport = useAppStore((s) => s.setSelectedReport);
	const setAddingReport = useAppStore((s) => s.setAddingReport);
	const allReports = [...customReports, ...SEED_REPORTS];
	const selectedReport = allReports.find((r) => r.id === selectedReportId) ?? null;
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
		onOpenAnno
	});
}
function QueueOrLog({ alerts, reviews, reviewFilter, setReviewFilter, setSelectedAlert, setSelectedSite, news, newsLoading, brief, briefLoading, onRunBrief, sitrep, reports, onSelectReport, onAddReport, feeds, feedsMeta, briefingDoc, onOpenAnno }) {
	const rightTab = useAppStore((s) => s.rightTab);
	const setRightTab = useAppStore((s) => s.setRightTab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-1 px-3 pt-3",
			children: [[
				["log", "Log"],
				["queue", "Queue"],
				["news", "News"],
				["brief", "Brief"],
				["reports", "Reports"],
				["feeds", "Feeds"]
			].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					setRightTab(id);
					if (id === "brief") {
						setSelectedAlert(null);
						setSelectedSite(null);
					}
				},
				className: cn("h-8 rounded-lg px-2.5 text-xs", rightTab === id ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised"),
				children: label
			}, id)), rightTab === "queue" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				value: reviewFilter,
				onChange: (e) => setReviewFilter(e.target.value),
				className: "ml-auto h-8 rounded-md border border-border bg-raised px-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "all",
						children: "All"
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
			}) : null]
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
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex-1 overflow-y-auto px-3 py-2",
			children: alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "p-3 text-sm text-muted",
				children: "Nothing in this filter. Open Change log for the full first-seen record."
			}) : alerts.map((a) => {
				const state = reviews[a.id]?.state ?? a.review;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						setSelectedAlert(a.id);
						const first = a.siteIds[0];
						if (first) setSelectedSite(first);
					},
					className: "mb-1.5 w-full rounded-xl border border-border bg-surface/60 p-3 text-left hover:bg-raised",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium leading-snug",
							children: a.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidencePips, { value: a.confidence })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mt-1.5 flex items-center gap-2 text-xs text-subtle",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "capitalize",
							children: a.type.replace("_", " ")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: state })]
					})]
				}) }, a.id);
			})
		})]
	});
}
function ChangeLogList({ onOpenSite }) {
	const rows = useAppStore((s) => s.changeLog);
	const lastSweepAt = useAppStore((s) => s.lastSweepAt);
	const [fam, setFam] = (0, import_react.useState)("all");
	const shown = fam === "all" ? rows : rows.filter((e) => e.families.includes(fam));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-4 pt-2 text-[11px] leading-snug text-subtle",
				children: [
					shown.length,
					" records · oldest first-seen first. 2022–2026 public archive, not a live occupancy picture.",
					lastSweepAt ? ` Sweep ${lastSweepAt.slice(0, 16).replace("T", " ")}Z.` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1 px-3 pt-2",
				children: [
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
				}, id))
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
	const bbox = padBbox(site.lat, site.lon, .08);
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
	const bbox = padBbox(lat, lon, .1);
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
	if (!useAppStore((s) => s.hudOn)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sitroom-vignette" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "sitroom-scanlines" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sitroom-crosshair",
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
		})
	] });
}
function SensorBar() {
	const sensor = useAppStore((s) => s.sensor);
	const setSensor = useAppStore((s) => s.setSensor);
	const hudOn = useAppStore((s) => s.hudOn);
	const setHudOn = useAppStore((s) => s.setHudOn);
	const detectOn = useAppStore((s) => s.detectOn);
	const setDetectOn = useAppStore((s) => s.setDetectOn);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			const hit = SENSOR_LOOKS.find((s) => s.key === e.key);
			if (hit) {
				e.preventDefault();
				setSensor(hit.id);
			}
			if (e.key === "h" || e.key === "H") {
				e.preventDefault();
				setHudOn(!useAppStore.getState().hudOn);
			}
			if (e.key === "d" || e.key === "D") {
				e.preventDefault();
				setDetectOn(!useAppStore.getState().detectOn);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		setSensor,
		setHudOn,
		setDetectOn
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel hud-panel-bracket pointer-events-auto flex items-center gap-1 p-1",
		children: [
			SENSOR_LOOKS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				title: `${s.label} · key ${s.key}`,
				onClick: () => setSensor(s.id),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", sensor === s.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised hover:text-fg"),
				children: s.label
			}, s.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setHudOn(!hudOn),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", hudOn ? "text-accent" : "text-muted hover:text-fg"),
				children: "HUD"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setDetectOn(!detectOn),
				className: cn("h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider", detectOn ? "text-accent" : "text-muted hover:text-fg"),
				children: "DET"
			})
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
	const rows = [
		{
			key: "ai",
			label: "AI events",
			count: counts.ai,
			icon: Sparkles
		},
		{
			key: "control",
			label: "Control areas",
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
function ago(iso) {
	if (!iso) return "—";
	const mins = Math.round((Date.now() - Date.parse(iso)) / 6e4);
	if (!Number.isFinite(mins) || mins < 0) return "—";
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	return `${Math.round(mins / 60)}h ago`;
}
function LiveStrip({ headlines, fires, flights, vessels, meta, nextSec, onRefresh, sweeping }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hud-panel pointer-events-auto flex w-full items-center gap-3 px-3 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-accent" }), "LIVE"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 truncate font-mono text-[11px] tabular-nums text-muted",
				children: [
					headlines,
					" live headlines · ",
					fires,
					" fires · ",
					flights,
					" flights · ",
					vessels,
					" vessels · updated ",
					ago(meta?.fetchedAt)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "ml-auto hidden shrink-0 font-mono text-[11px] tabular-nums text-subtle sm:inline",
				children: [
					"next ",
					Math.max(0, nextSec),
					"s"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRefresh,
				disabled: sweeping,
				className: "shrink-0 font-mono text-[11px] text-muted hover:text-fg",
				"aria-label": "Refresh live feeds",
				children: sweeping ? "…" : "↻"
			})
		]
	});
}
function Ticker({ items }) {
	if (items.length === 0) return null;
	const loop = [...items, ...items];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hud-panel pointer-events-auto mt-2 hidden overflow-hidden md:block",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "ticker-track",
			children: loop.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: h.url,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "ticker-item",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-saf",
					children: h.source
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: h.title })]
			}, `${h.url}-${i}`))
		})
	});
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
		id: "hhas",
		label: "Assab"
	}
];
function MetaChip({ label, meta }) {
	const tone = meta?.status === "ok" ? "text-civilian" : meta?.status === "gap" || meta?.status === "stale" ? "text-thermal" : meta?.status === "error" ? "text-damage" : "text-muted";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("font-mono text-[11px] tabular-nums", tone),
		children: [
			label,
			" ",
			meta ? meta.status : "…",
			meta?.fetchedAt ? ` · ${meta.fetchedAt.slice(11, 16)}Z` : ""
		]
	});
}
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
	const [tab, setTab] = (0, import_react.useState)("log");
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
	const [legendOpen, setLegendOpen] = (0, import_react.useState)(true);
	const [trafficIn, setTrafficIn] = (0, import_react.useState)(20);
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
	const changeLogCount = useAppStore((s) => s.changeLog.length);
	const changeLog = useAppStore((s) => s.changeLog);
	const setLastSweepAt = useAppStore((s) => s.setLastSweepAt);
	const helpOpen = useAppStore((s) => s.helpOpen);
	const setHelpOpen = useAppStore((s) => s.setHelpOpen);
	const theaterId = useAppStore((s) => s.theaterId);
	const setTheater = useAppStore((s) => s.setTheater);
	const rightTab = useAppStore((s) => s.rightTab);
	const setRightTab = useAppStore((s) => s.setRightTab);
	const setFlyTarget = useAppStore((s) => s.setFlyTarget);
	const boxes = useVisibleBoxes();
	function applyLive(b, announce) {
		setLive(b);
		setLiveError(null);
		const { next, added } = ingestLive(b, useAppStore.getState().changeLog);
		replaceLog(next);
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
		const newsId = window.setInterval(() => {
			setNewsLoading(true);
			getNewsFeed().then((n) => {
				if (cancelled) return;
				setLive((prev) => {
					if (!prev) return {
						firms: [],
						firmsMeta: n.meta,
						flights: [],
						flightsMeta: n.meta,
						reports: [],
						reportsMeta: n.meta,
						news: n.items,
						newsPoints: n.points,
						newsMeta: n.meta,
						gdelt: GDELT_ARCHIVE,
						gdeltMeta: n.meta,
						osm: OSM_SEED,
						osmMeta: n.meta,
						feeds: [],
						feedsMeta: n.meta,
						ticker: n.items.map((i) => ({
							source: i.source,
							title: i.title,
							url: i.url
						})),
						vessels: VESSEL_SEED,
						vesselsMeta: n.meta
					};
					const nextLive = {
						...prev,
						news: n.items,
						newsPoints: n.points,
						newsMeta: n.meta
					};
					const { next } = ingestLive(nextLive, useAppStore.getState().changeLog);
					replaceLog(next);
					return nextLive;
				});
			}).finally(() => {
				if (!cancelled) setNewsLoading(false);
			});
		}, 3e5);
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
						firms: [],
						firmsMeta: t.flightsMeta,
						flights: mergeFlights(t.flights),
						flightsMeta: t.flightsMeta,
						reports: [],
						reportsMeta: t.flightsMeta,
						news: [],
						newsPoints: [],
						newsMeta: t.flightsMeta,
						gdelt: GDELT_ARCHIVE,
						gdeltMeta: t.flightsMeta,
						osm: OSM_SEED,
						osmMeta: t.flightsMeta,
						feeds: [],
						feedsMeta: t.flightsMeta,
						ticker: [],
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
				setTrafficIn(20);
			}).catch(() => {
				if (!cancelled) setTrafficIn(20);
			});
		};
		poll();
		const id = window.setInterval(poll, 2e4);
		const tick = window.setInterval(() => {
			setTrafficIn((n) => n > 0 ? n - 1 : 20);
		}, 1e3);
		return () => {
			cancelled = true;
			window.clearInterval(id);
			window.clearInterval(tick);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") {
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
	const tickerItems = live?.ticker?.length ? live.ticker : (live?.news ?? []).map((n) => ({
		source: n.source,
		title: n.title,
		url: n.url
	}));
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
			alertHits: []
		};
		return {
			siteHits: SITES.filter((s) => s.name.toLowerCase().includes(q) || s.admin1.toLowerCase().includes(q) || s.kind.includes(q)).slice(0, 6),
			alertHits: ALERTS.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 4)
		};
	}, [query]);
	const selectedSite = SITES.find((s) => s.id === selectedSiteId) ?? null;
	const selectedAlert = ALERTS.find((a) => a.id === selectedAlertId) ?? null;
	const siteObs = selectedSite ? OBSERVATIONS.filter((o) => o.siteId === selectedSite.id) : [];
	const siteParty = selectedSite ? partyOverrides[selectedSite.id]?.party ?? selectedSite.party : "unknown";
	const panelOpen = Boolean(selectedSite || selectedAlert);
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
	function openBrief() {
		setTab("brief");
		setRightTab("brief");
		setSelectedAlert(null);
		setSelectedSite(null);
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
	function pickMobile(id) {
		setTab(id);
		if (id === "brief") {
			setRightTab("brief");
			setSelectedAlert(null);
			setSelectedSite(null);
		} else if (rightTab === "brief") setRightTab("log");
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
		feedsMeta: live?.feedsMeta ?? null
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh overflow-hidden bg-bg text-fg",
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
				annotations: briefingOn ? briefingDoc?.annotations ?? [] : []
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
										placeholder: "Jump to a site or alert  ·  /",
										className: "h-11 w-full bg-transparent pl-10 pr-3 text-sm text-fg placeholder:text-subtle"
									})]
								}), searchOpen && query.trim().length >= 2 && searchHits.siteHits.length + searchHits.alertHits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hud-panel absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden py-1",
									children: [searchHits.siteHits.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
									}, s.id)), searchHits.alertHits.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
									}, a.id))]
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
								className: "pointer-events-auto hidden items-center gap-2 sm:flex",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SensorBar, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "hud-panel flex items-center gap-2 px-3 py-1.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClockChip, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hud-panel hidden items-center gap-1 p-1 lg:flex",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: openBrief,
												className: "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg",
												children: "BRIEF"
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticker, { items: tickerItems }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 hidden md:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveStrip, {
							headlines: live?.news.length ?? 0,
							fires: firms.length,
							flights: flights.length,
							vessels: vessels.length,
							meta: live?.newsMeta ?? live?.flightsMeta ?? null,
							nextSec: trafficIn,
							onRefresh: sweepNow,
							sweeping
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex items-start gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BasemapPicker, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hud-panel pointer-events-auto ml-auto hidden items-center gap-3 px-3 py-1.5 xl:flex",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-[11px] tabular-nums text-muted",
										children: [
											SITES.length + osm.length,
											" pins · ",
											vessels.length,
											" maritime · ",
											changeLogCount,
											" records"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaChip, {
										label: "FIRMS",
										meta: live?.firmsMeta ?? null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaChip, {
										label: "ADS-B",
										meta: live?.flightsMeta ?? null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaChip, {
										label: "AIS",
										meta: live?.vesselsMeta ?? null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaChip, {
										label: "OSM",
										meta: live?.osmMeta ?? null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "border-damage/40 text-damage",
										children: "DOCS ONLY"
									})
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute right-3 top-[13.5rem] z-20 md:top-[16.5rem] lg:right-[26.2rem]",
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
				className: "pointer-events-none absolute bottom-24 left-3 top-[16.5rem] z-20 hidden w-60 md:block",
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-auto mt-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlLegend, {
							open: legendOpen,
							onToggle: () => setLegendOpen((v) => !v)
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute bottom-24 right-3 top-[16.5rem] z-20 hidden w-[24.5rem] lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hud-panel pointer-events-auto flex h-full flex-col overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RightRail, { ...rightProps })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden p-3 md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex h-[42vh] flex-col md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 overflow-y-auto border-t border-border bg-bg/95",
					children: tab === "layers" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeftRail, { ...railProps }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RightRail, {
						...rightProps,
						force: tab
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex shrink-0 items-center gap-0.5 border-t border-border bg-bg px-1 py-1.5",
					children: [
						[
							"log",
							"Log",
							FileText
						],
						[
							"alerts",
							"Queue",
							TriangleAlert
						],
						[
							"brief",
							"Brief",
							ClipboardList
						],
						[
							"sites",
							"Sites",
							Map$1
						],
						[
							"layers",
							"Layers",
							Layers
						]
					].map(([id, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => pickMobile(id),
						className: cn("flex h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-lg text-[10px]", tab === id ? "bg-raised text-fg" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
					}, id))
				})]
			}),
			helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-40 flex items-center justify-center bg-bg/70 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hud-panel max-h-[90dvh] w-full max-w-lg overflow-y-auto p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-widest text-subtle",
							children: "How this works"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-mono text-xl font-medium tracking-tight",
							children: "Abu Hureirah Situation Room"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-[11px] tracking-widest text-accent",
							children: "SUDAN WING"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Theater chips"
								}), " jump Sudan, Egypt, Ethiopia, Somalia, Chad, Libya, UAE, Eritrea, and the Red Sea corridor. Pins are public sites — bases, yards, ports, crossings — not occupancy."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "Optics 1–6"
									}),
									" reskin the satellite (optical, CRT, NVG, FLIR, noir, snow). ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "H"
									}),
									" toggles the HUD. ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-fg",
										children: "D"
									}),
									" toggles detection boxes when you are zoomed in."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Contacts"
								}), " are live ADS-B plus maritime lane markers that crawl along documented Red Sea / Aden / Suez corridors. Cargo-typical airframes paint amber. Lane markers are NOT live AIS — they move so the maritime picture is not frozen."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Brief"
								}), " is a fifth tab (and the BRIEF button). It auto-compiles a fourteen-section military-intelligence assessment and turns on the analyst overlay. Leave the tab to turn the overlay off. Every circle on that overlay is a paragraph."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: "Basemap picker"
								}), " sits top-left on the map: High-res Esri, Sentinel-2 10 m, VIIRS daily, Dark context (phosphor), dated HLS. Control polygons stay on: SAF cyan, RSF rust, Kordofan gold dashed."] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Documentation archive only. No targeting, fire control, or kill-chain language. Public data." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-xs leading-relaxed text-subtle",
							children: "Documentation archive only. No targeting, fire control, or kill-chain language. Public data."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 rounded-xl bg-accent text-sm font-medium text-accent-fg",
								onClick: () => setHelpOpen(false),
								children: "Got it — open the map"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/flyer",
								className: "flex h-11 items-center justify-center rounded-xl border border-border text-sm text-muted hover:text-fg",
								children: "Flyer / icon copy"
							})]
						})
					]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "pointer-events-auto absolute bottom-28 right-[26rem] z-20 hidden size-10 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg lg:flex",
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
