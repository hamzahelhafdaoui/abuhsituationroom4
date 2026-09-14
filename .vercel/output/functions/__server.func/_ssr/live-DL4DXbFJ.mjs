import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { s as geocodePlace } from "./osint-BYV_Xgat.mjs";
import { A as inAoi, E as createSsrRpc, L as pullNews, P as nearest, b as SITES, d as FLIGHTS, f as GDELT_ARCHIVE, g as OSM_SEED, j as isUsefulOsm, l as FEED_CHANNELS, r as AOI, t as AIRFIELDS, u as FEED_SEED, w as allVessels, x as THERMAL } from "./control-BMG1rbv2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-DL4DXbFJ.js
var UA$1 = "AbuHureirahSitroom/1.0 (civilian public-data archive; documentation only)";
var mem$1 = /* @__PURE__ */ new Map();
var pending = /* @__PURE__ */ new Map();
function cached$1(key, ttl, fn) {
	const hit = mem$1.get(key);
	if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value);
	const inflight = pending.get(key);
	if (inflight) return inflight;
	const p = fn().then((value) => {
		mem$1.set(key, {
			at: Date.now(),
			value
		});
		return value;
	}).finally(() => pending.delete(key));
	pending.set(key, p);
	return p;
}
async function fetchText$1(url, ms = 12e3, extra = {}) {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), ms);
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "*/*",
				"User-Agent": UA$1,
				...extra
			},
			signal: ctrl.signal
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.text();
	} finally {
		clearTimeout(t);
	}
}
function meta$1(source, count, note, status = "ok") {
	return {
		fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
		recordCount: count,
		status: count === 0 && status === "ok" ? "empty" : status,
		source,
		note
	};
}
function subtypeFamily(subtype) {
	const s = subtype.toLowerCase();
	if (s.includes("air") || s.includes("drone") || s.includes("airlift")) return "Air activity";
	if (s.includes("vehicle") || s.includes("convoy")) return "Vehicle movement";
	if (s.includes("cargo") || s.includes("port")) return "Cargo movement";
	if (s.includes("displac")) return "Displacement";
	if (s.includes("control")) return "Control change";
	if (s.includes("harm") || s.includes("civilian")) return "Civilian harm";
	if (s.includes("report")) return "Reporting";
	if (s.includes("force")) return "Use of Force";
	return "Armed clash";
}
function mergeOsm(live) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const row of [...live, ...OSM_SEED]) {
		if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
		if (!inAoi(row.lat, row.lon)) continue;
		if (!isUsefulOsm(row)) continue;
		const k = `${row.id}|${row.lat.toFixed(3)}|${row.lon.toFixed(3)}`;
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(row);
	}
	return out;
}
function mergeGdelt(live) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const row of [...live, ...GDELT_ARCHIVE]) {
		if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
		if (!inAoi(row.lat, row.lon)) continue;
		const k = row.id || `${row.date}|${row.lat.toFixed(3)}|${row.lon.toFixed(3)}`;
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(row);
	}
	return out;
}
async function pullOsmLive() {
	const boxes = [
		[
			8.4,
			20.2,
			24.8,
			39.2
		],
		[
			20,
			9.5,
			32.8,
			34
		],
		[
			-1,
			41,
			14,
			51.6
		],
		[
			22.4,
			51.5,
			26.6,
			56.8
		]
	];
	const rows = [];
	const seen = /* @__PURE__ */ new Set();
	for (const [s, w, n, e] of boxes) {
		const query = `
[out:json][timeout:22];
(
  node["aeroway"~"aerodrome|airstrip|helipad"](${s},${w},${n},${e});
  way["aeroway"~"aerodrome|airstrip"](${s},${w},${n},${e});
  node["military"](${s},${w},${n},${e});
  way["landuse"="military"](${s},${w},${n},${e});
  node["harbour"](${s},${w},${n},${e});
  node["highway"="border_crossing"](${s},${w},${n},${e});
);
out center 180;
`.trim();
		try {
			const res = await fetch("https://overpass-api.de/api/interpreter", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"User-Agent": UA$1
				},
				body: new URLSearchParams({ data: query }),
				signal: AbortSignal.timeout(24e3)
			});
			if (!res.ok) continue;
			const json = await res.json();
			for (const el of json.elements ?? []) {
				const lat = el.lat ?? el.center?.lat;
				const lon = el.lon ?? el.center?.lon;
				if (lat == null || lon == null || !inAoi(lat, lon)) continue;
				const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
				if (seen.has(key)) continue;
				seen.add(key);
				const tags = el.tags ?? {};
				const name = tags["name:en"] || tags.name || tags.operator || tags.military || tags.aeroway || "OSM site";
				const mil = tags.military || tags.landuse;
				const aero = tags.aeroway;
				let kind = "compound";
				if (aero === "aerodrome") kind = "airfield";
				else if (aero === "airstrip" || aero === "helipad") kind = "strip";
				else if (mil === "airfield") kind = "airfield";
				else if (mil === "barracks" || mil === "base") kind = "base";
				else if (mil === "checkpoint") kind = "checkpoint";
				else if (tags.highway === "border_crossing") kind = "crossing";
				else if (tags.harbour) kind = "port";
				else if (mil) kind = "base";
				rows.push({
					id: `osm-${el.type}-${el.id}`,
					name,
					kind,
					lat,
					lon,
					country: "TH",
					source: "osm"
				});
			}
		} catch (err) {
			console.warn("[overpass]", s, w, err);
		}
	}
	return rows;
}
async function pullOsm() {
	return cached$1("osm-bases", 216e5, async () => {
		try {
			const live = await pullOsmLive();
			const rows = mergeOsm(live);
			return {
				rows,
				meta: meta$1("OpenStreetMap Overpass + OurAirports", rows.length, `Live OSM ${live.length} · seed ${OSM_SEED.length}. Public mapped infrastructure, not occupancy. Cached 6h.`, live.length ? "ok" : "stale")
			};
		} catch (err) {
			const rows = mergeOsm([]);
			return {
				rows,
				meta: meta$1("OurAirports / compiled OSM (live Overpass unreachable)", rows.length, err instanceof Error ? err.message : "Overpass failed", "stale")
			};
		}
	});
}
async function pullGdeltLive() {
	const text = await fetchText$1("https://api.gdeltproject.org/api/v2/geo/geo?query=" + encodeURIComponent("(Sudan OR Darfur OR Khartoum OR RSF OR SAF OR Kufra OR Adre OR Asosa OR Berbera OR Assab) (attack OR clash OR airstrike OR shelling OR displaced OR airlift)") + "&mode=PointData&format=GeoJSON&maxpoints=200&timespan=14d", 14e3);
	let feats = [];
	try {
		const json = JSON.parse(text);
		feats = Array.isArray(json) ? json : json.features ?? [];
	} catch {
		return [];
	}
	const rows = [];
	const seen = /* @__PURE__ */ new Set();
	for (const f of feats) {
		const coords = f.geometry?.coordinates;
		const lat = Number(f.lat ?? coords?.[1]);
		const lon = Number(f.lon ?? coords?.[0]);
		if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) continue;
		const name = f.properties?.name || f.name || "Sudan";
		const key = `${lat.toFixed(2)}|${lon.toFixed(2)}|${name}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		rows.push({
			id: `gdelt-live-${key.replace(/[^a-z0-9]+/gi, "-").slice(0, 48)}`,
			name,
			actor: "unattributed in GDELT",
			date: today,
			subtype: subtypeFamily(name + " " + (f.properties?.html ?? "")),
			country: "Sudan",
			notes: "GDELT GEO 2.0 named-place centroid for the last 14 days. Media geolocation, not an incident coordinate. Not a targeting feed.",
			lat,
			lon,
			source: "gdelt",
			live: true,
			url: f.properties?.url
		});
	}
	return rows;
}
async function pullGdelt() {
	return cached$1("gdelt-conflicts", 9e5, async () => {
		try {
			const live = await pullGdeltLive();
			const rows = mergeGdelt(live);
			return {
				rows,
				meta: meta$1("GDELT GEO 2.0 + 2022–2026 compiled archive", rows.length, `Live GDELT ${live.length} · archive ${GDELT_ARCHIVE.length}. Named-place centroids. Cached 15 min.`, live.length ? "ok" : "stale")
			};
		} catch (err) {
			const rows = mergeGdelt([]);
			return {
				rows,
				meta: meta$1("2022–2026 compiled GDELT-style archive (live unreachable)", rows.length, err instanceof Error ? err.message : "GDELT failed", "stale")
			};
		}
	});
}
function decode(s) {
	return s.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
async function scrapeChannel(channel) {
	const blocks = (await fetchText$1(`https://t.me/s/${channel}`, 1e4)).split("class=\"tgme_widget_message_wrap");
	const rows = [];
	for (const b of blocks.slice(1, 18)) {
		const textMatch = b.match(/class="tgme_widget_message_text"[^>]*>([\s\S]*?)<\/div>/i);
		const timeMatch = b.match(/datetime="([^"]+)"/);
		const hrefMatch = b.match(/class="tgme_widget_message_date"[^>]*href="([^"]+)"/);
		const text = textMatch ? decode(textMatch[1]) : "";
		if (text.length < 12) continue;
		const timestamp = timeMatch?.[1] ?? (/* @__PURE__ */ new Date()).toISOString();
		const url = hrefMatch?.[1] ?? `https://t.me/${channel}`;
		const geo = geocodePlace(text);
		rows.push({
			id: `tg-${channel}-${url.split("/").pop() ?? rows.length}`,
			url,
			source: "telegram",
			channel,
			text: text.slice(0, 900),
			timestamp,
			hasMedia: /tgme_widget_message_photo|tgme_widget_message_video/.test(b),
			lat: geo?.lat,
			lon: geo?.lon,
			place: geo?.name
		});
	}
	return rows;
}
async function pullFeeds() {
	return cached$1("tg-feeds", 12e4, async () => {
		const batches = await Promise.all(FEED_CHANNELS.map(async (ch) => {
			try {
				return await scrapeChannel(ch.id);
			} catch {
				return [];
			}
		}));
		const rows = batches.flat().concat(FEED_SEED).sort((a, b) => a.timestamp < b.timestamp ? 1 : -1);
		const seen = /* @__PURE__ */ new Set();
		const dedup = rows.filter((r) => {
			if (seen.has(r.id)) return false;
			seen.add(r.id);
			return true;
		}).slice(0, 120);
		return {
			rows: dedup,
			meta: meta$1("Public Telegram web previews (t.me/s)", dedup.length, "Sudan-relevant public channels. Preview scrape, not a login. Rate-limited. Seed notes fill the gap when t.me blocks.", batches.some((b) => b.length) ? "ok" : "stale")
		};
	});
}
async function pullTicker(news) {
	const extraUrls = ["https://feeds.bbci.co.uk/news/world/africa/rss.xml", "https://www.aljazeera.com/xml/rss/all.xml"];
	const extra = [...news];
	for (const url of extraUrls) try {
		const blocks = (await fetchText$1(url, 8e3)).match(/<item>[\s\S]*?<\/item>/gi) ?? [];
		for (const b of blocks.slice(0, 12)) {
			const title = decode(b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
			const link = decode(b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "");
			if (!title) continue;
			if (!/sudan|darfur|khartoum|rsf|saf |kordofan|port sudan/i.test(title)) continue;
			extra.push({
				source: url.includes("bbc") ? "BBC Africa" : "Al Jazeera",
				title,
				url: link || url
			});
		}
	} catch {}
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const t of extra) {
		if (seen.has(t.title)) continue;
		seen.add(t.title);
		out.push(t);
	}
	return out.slice(0, 40);
}
createServerFn({ method: "GET" }).handler(createSsrRpc("d14f076a42cd03407493a6f4d167b2b4cc93d839e9fd5035ed6e61134cc644a5"));
var UA = "AbuHureirahSitroom/1.0 (civilian public-data archive; documentation only)";
var mem = /* @__PURE__ */ new Map();
var TTL_MS = 9e4;
function cached(key, ttl, fn) {
	const hit = mem.get(key);
	if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value);
	return fn().then((value) => {
		mem.set(key, {
			at: Date.now(),
			value
		});
		return value;
	});
}
async function fetchText(url, ms = 12e3) {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), ms);
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "text/plain, application/json, */*",
				"User-Agent": UA
			},
			signal: ctrl.signal
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.text();
	} finally {
		clearTimeout(t);
	}
}
function meta(source, count, note, status = "ok") {
	return {
		fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
		recordCount: count,
		status: count === 0 && status === "ok" ? "empty" : status,
		source,
		note
	};
}
function classifyThermal(lat, lon, frp, daynight) {
	const near = nearest(lat, lon, SITES, 8);
	if (!near) return "unknown";
	const kind = near.item.kind;
	if (kind === "farm") return "agricultural";
	if (near.item.id === "heglig") return "industrial";
	if (kind === "hospital" || kind === "camp" || kind === "market") return frp >= 10 ? "possible_explosive" : "urban_structure";
	if (kind === "port" || kind === "logistics") return frp >= 40 ? "industrial" : "unknown";
	if (daynight === "N" && kind === "airfield" && frp >= 8) return "unknown";
	return "unknown";
}
function parseFirmsCsv(csv, satellite) {
	const lines = csv.trim().split(/\r?\n/);
	if (lines.length < 2) return [];
	const header = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
	const idx = (name) => header.indexOf(name);
	const iLat = idx("latitude");
	const iLon = idx("longitude");
	const iDate = idx("acq_date");
	const iTime = idx("acq_time");
	const iConf = idx("confidence");
	const iFrp = idx("frp");
	const iDn = idx("daynight");
	const iSat = idx("satellite");
	const out = [];
	for (let i = 1; i < lines.length; i++) {
		const cols = (lines[i] ?? "").split(",");
		const lat = Number(cols[iLat]);
		const lon = Number(cols[iLon]);
		if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) continue;
		const frp = Number(cols[iFrp] ?? 0) || 0;
		const daynight = (cols[iDn] ?? "D") === "N" ? "N" : "D";
		const site = nearest(lat, lon, SITES, 6);
		out.push({
			id: `live-th-${satellite}-${cols[iDate]}-${cols[iTime]}-${lat.toFixed(3)}-${lon.toFixed(3)}`,
			lat,
			lon,
			acqDate: cols[iDate] ?? "",
			acqTime: String(cols[iTime] ?? "").padStart(4, "0"),
			satellite: cols[iSat] || satellite,
			confidence: String(cols[iConf] ?? ""),
			frp,
			daynight,
			klass: classifyThermal(lat, lon, frp, daynight),
			siteId: site?.item.id,
			live: true
		});
	}
	return out;
}
async function pullFirms() {
	const urls = [{
		sat: "NOAA-20",
		url: "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv"
	}, {
		sat: "NOAA-21",
		url: "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_Global_24h.csv"
	}];
	const collected = [];
	const notes = [];
	for (const u of urls) try {
		const rows = parseFirmsCsv(await fetchText(u.url, 14e3), u.sat);
		collected.push(...rows);
		notes.push(`${u.sat} ${rows.length}`);
	} catch (err) {
		notes.push(`${u.sat} fail`);
		console.warn("[firms]", u.sat, err);
	}
	const dedup = /* @__PURE__ */ new Map();
	for (const r of collected) {
		const k = `${r.acqDate}-${r.lat.toFixed(3)}-${r.lon.toFixed(3)}`;
		const prev = dedup.get(k);
		if (!prev || r.frp > prev.frp) dedup.set(k, r);
	}
	const rows = [...dedup.values()].filter((r) => {
		if (nearest(r.lat, r.lon, SITES, 40)) return true;
		return r.frp >= 14 && r.daynight === "N";
	}).sort((a, b) => b.frp - a.frp).slice(0, 420);
	if (rows.length === 0) return {
		rows: THERMAL.map((t) => ({
			...t,
			live: false
		})),
		meta: meta("NASA FIRMS VIIRS 24h CSV (archive fallback)", THERMAL.length, "Live FIRMS CSV unreachable. Showing curated archive points. FIRMS is a thermal-anomaly feed, not a strike feed.", "stale")
	};
	return {
		rows,
		meta: meta("NASA FIRMS VIIRS 24h public CSV", rows.length, `Deduped VIIRS NOAA-20/21 in AOI (${notes.join(", ")}). Thermal anomaly ≠ strike. Optical follow-up required before any combat-related label above possible.`)
	};
}
function classifyAirframe(type, category) {
	const t = (type || "").toUpperCase();
	if (/IL76|IL-76|A50|C17|C-17|C130|C-130|A400|AN12|AN-12|AN124|AN-124|Y20|Y-20|B763F|B77L|A33F|MD11/.test(t)) return "cargo";
	if (/KC135|K35R|IL78|A330MRTT|K35/.test(t)) return "tanker";
	if (/GLF|GLEX|CL60|C56X|FA7X|FA50|E55P|GL5T|GA6C|C700/.test(t)) return "bizjet";
	if (/A31|A32|A33|B73|B77|B78|E19|E29|AT7|DH8|C208|B350/.test(t)) return "pax";
	if (category?.startsWith("A7") || category === "C3") return "cargo";
	return "unknown";
}
function nearestAirfieldName(lat, lon) {
	const n = nearest(lat, lon, AIRFIELDS, 80);
	if (!n) return "none in 80 km (ADS-B gap possible)";
	return `${n.item.name} (~${n.km.toFixed(0)} km)`;
}
function toFlight(ac, source) {
	const lat = Number(ac.lat);
	const lon = Number(ac.lon);
	if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inAoi(lat, lon)) return null;
	const typeCode = (ac.t || "UNK").toUpperCase();
	const category = classifyAirframe(typeCode, ac.category);
	const callsign = (ac.flight || "").trim();
	const alt = typeof ac.alt_baro === "number" ? ac.alt_baro : Number(ac.alt_baro);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	return {
		id: `live-fl-${(ac.hex || `${lat}-${lon}`).toLowerCase()}`,
		hex: (ac.hex || "unknown").toLowerCase(),
		reg: ac.r || "unknown",
		typeCode,
		operator: callsign || "unknown",
		category,
		origin: "unreconstructed",
		dest: "unreconstructed",
		firstSeen: now,
		lastSeen: now,
		lat,
		lon,
		altFt: Number.isFinite(alt) ? alt : void 0,
		track: ac.track,
		gs: ac.gs,
		nearestAirfield: nearestAirfieldName(lat, lon),
		notes: `Live ${source}. Category is airframe-typical, not a payload claim. ADS-B in this region is sparse — absence of a track is not absence of a flight.`,
		confidence: 1,
		relevant: true,
		live: true,
		military: category === "cargo" || category === "tanker" || /IL76|C130|C17|A400|AN12|KC135/.test(typeCode)
	};
}
async function pullAdsbPoint(lat, lon, dist) {
	const urls = [`https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist}`, `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${dist}`];
	for (const url of urls) try {
		const text = await fetchText(url, 1e4);
		const json = JSON.parse(text);
		if (Array.isArray(json.ac)) return json.ac;
	} catch (err) {
		console.warn("[adsb]", url, err);
	}
	return [];
}
async function pullOpenSky() {
	const url = `https://opensky-network.org/api/states/all?lamin=${AOI.south}&lomin=${AOI.west}&lamax=${AOI.north}&lomax=${AOI.east}`;
	try {
		const text = await fetchText(url, 1e4);
		return (JSON.parse(text).states ?? []).map((s) => ({
			hex: String(s[0] ?? ""),
			flight: String(s[1] ?? ""),
			r: "",
			t: "",
			lon: Number(s[5]),
			lat: Number(s[6]),
			alt_baro: typeof s[7] === "number" ? Math.round(Number(s[7]) * 3.28084) : void 0,
			track: typeof s[10] === "number" ? Number(s[10]) : void 0,
			gs: typeof s[9] === "number" ? Math.round(Number(s[9]) * 1.94384) : void 0
		}));
	} catch (err) {
		console.warn("[opensky]", err);
		return [];
	}
}
async function pullFlights() {
	const points = [
		[
			15.6,
			32.5,
			380
		],
		[
			13.6,
			25.3,
			380
		],
		[
			19.5,
			37.2,
			320
		],
		[
			14,
			35.4,
			280
		],
		[
			12.05,
			24.88,
			280
		],
		[
			15.47,
			36.4,
			240
		],
		[
			30.1,
			31.4,
			280
		],
		[
			24.2,
			23.3,
			300
		],
		[
			12.1,
			15,
			260
		],
		[
			24.45,
			54.65,
			220
		],
		[
			2.03,
			45.32,
			260
		],
		[
			10.4,
			44.94,
			220
		],
		[
			13.07,
			42.65,
			220
		],
		[
			21.5,
			39.15,
			260
		],
		[
			29,
			32.55,
			200
		]
	];
	const raw = [];
	let source = "adsb.lol / adsb.fi";
	const results = await Promise.all(points.map(([la, lo, d]) => pullAdsbPoint(la, lo, d)));
	for (const batch of results) raw.push(...batch);
	if (raw.length === 0) {
		const sky = await pullOpenSky();
		raw.push(...sky);
		source = "OpenSky Network (anonymous)";
	}
	const seen = /* @__PURE__ */ new Set();
	const rows = [];
	for (const ac of raw) {
		const fl = toFlight(ac, source);
		if (!fl || seen.has(fl.hex)) continue;
		seen.add(fl.hex);
		rows.push(fl);
	}
	if (rows.length === 0) return {
		rows: FLIGHTS.map((f) => ({
			...f,
			live: false
		})),
		meta: meta("Archive sample (live ADS-B empty)", FLIGHTS.length, "No live state vectors in the AOI. ADS-B coverage in Sudan, Darfur, and the desert corridors is sparse. Showing the curated archive so the review workflow still runs. Absence of a track is not absence of a flight.", "gap")
	};
	return {
		rows,
		meta: meta(source, rows.length, "Live positions are ADS-B only. Large parts of Darfur, Kordofan, and the Libya tracks are coverage gaps. Category is typical for the airframe, never a cargo claim.", rows.length < 3 ? "gap" : "ok")
	};
}
async function pullReports() {
	const url = "https://api.reliefweb.int/v1/reports?appname=ahsr-sudan&profile=lite&limit=8&sort[]=date:desc&filter[field]=primary_country&filter[value]=sdn";
	try {
		const text = await fetchText(url, 1e4);
		const rows = (JSON.parse(text).data ?? []).map((d) => ({
			id: `rw-${d.id}`,
			title: d.fields?.title || "ReliefWeb report",
			publisher: d.fields?.source?.[0]?.name || "ReliefWeb",
			date: (d.fields?.date?.created || "").slice(0, 10),
			url: d.fields?.url || "https://reliefweb.int/",
			reliability: "high",
			note: "Humanitarian reporting. Corroboration, not ground truth."
		}));
		return {
			rows,
			meta: meta("ReliefWeb public API", rows.length, "Sudan-tagged humanitarian reports. Corroboration layer only.")
		};
	} catch (err) {
		console.warn("[reliefweb]", err);
		return {
			rows: [],
			meta: meta("ReliefWeb public API", 0, "Unreachable this cycle.", "error")
		};
	}
}
async function pullVessels() {
	const rows = allVessels();
	return {
		rows,
		meta: meta("Port nodes + documented Red Sea / Aden lane animation", rows.length, "No keyless global AIS snapshot is wired. Port nodes are real harbours. Moving markers follow published shipping lanes so the maritime picture is not frozen — they are NOT live AIS contacts. Absence of a contact is not absence of a vessel.", "gap")
	};
}
var getLiveBundle_createServerFn_handler = createServerRpc({
	id: "01ac50a6b210d7c55e9b45dea72e796cba145e186591bdd88c0094df5a076b33",
	name: "getLiveBundle",
	filename: "src/lib/live.ts"
}, (opts) => getLiveBundle.__executeServer(opts));
var getLiveBundle = createServerFn({ method: "GET" }).handler(getLiveBundle_createServerFn_handler, async () => {
	return cached("live-bundle", TTL_MS, async () => {
		const [firms, flights, reports, news, gdelt, osm, feeds, vessels] = await Promise.all([
			pullFirms(),
			pullFlights(),
			pullReports(),
			pullNews(),
			pullGdelt(),
			pullOsm(),
			pullFeeds(),
			pullVessels()
		]);
		const ticker = await pullTicker(news.items.map((n) => ({
			source: n.source,
			title: n.title,
			url: n.url
		})));
		return {
			firms: firms.rows,
			firmsMeta: firms.meta,
			flights: flights.rows,
			flightsMeta: flights.meta,
			reports: reports.rows,
			reportsMeta: reports.meta,
			news: news.items,
			newsPoints: news.points,
			newsMeta: news.meta,
			gdelt: gdelt.rows,
			gdeltMeta: gdelt.meta,
			osm: osm.rows,
			osmMeta: osm.meta,
			feeds: feeds.rows,
			feedsMeta: feeds.meta,
			ticker,
			vessels: vessels.rows,
			vesselsMeta: vessels.meta
		};
	});
});
var getTraffic_createServerFn_handler = createServerRpc({
	id: "534092db8484cb1d618e39dace1c97f0e51038567adcb1ce65879546b6fe22bd",
	name: "getTraffic",
	filename: "src/lib/live.ts"
}, (opts) => getTraffic.__executeServer(opts));
var getTraffic = createServerFn({ method: "GET" }).handler(getTraffic_createServerFn_handler, async () => {
	return cached("traffic", 18e3, async () => {
		const [flights, vessels] = await Promise.all([pullFlights(), pullVessels()]);
		return {
			flights: flights.rows,
			flightsMeta: flights.meta,
			vessels: vessels.rows,
			vesselsMeta: vessels.meta
		};
	});
});
//#endregion
export { getLiveBundle_createServerFn_handler, getTraffic_createServerFn_handler };
