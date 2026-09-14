import "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatUtc(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toISOString().slice(0, 16).replace("T", " ") + "Z";
}
function daysAgo(n) {
	const d = /* @__PURE__ */ new Date();
	d.setUTCDate(d.getUTCDate() - n);
	return d.toISOString().slice(0, 10);
}
function downloadBlob(filename, mime, body) {
	const blob = new Blob([body], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	window.setTimeout(() => {
		a.remove();
		URL.revokeObjectURL(url);
	}, 1500);
}
function mapCommand(cmd) {
	window.dispatchEvent(new CustomEvent("sahel-map", { detail: cmd }));
}
function mapFit(bbox) {
	window.dispatchEvent(new CustomEvent("sahel-map-fit", { detail: bbox }));
}
function mapMeasure() {
	window.dispatchEvent(new CustomEvent("sahel-map-measure"));
}
async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
function snapshotUrl(date, bbox, layer = "VIIRS_NOAA20_CorrectedReflectance_TrueColor") {
	const { west, south, east, north } = bbox;
	const png = layer.includes("HLS");
	return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${new URLSearchParams({
		SERVICE: "WMS",
		REQUEST: "GetMap",
		VERSION: "1.3.0",
		LAYERS: layer,
		CRS: "EPSG:4326",
		BBOX: `${south},${west},${north},${east}`,
		WIDTH: "768",
		HEIGHT: "768",
		FORMAT: png ? "image/png" : "image/jpeg",
		TIME: date,
		STYLES: "",
		TRANSPARENT: png ? "TRUE" : "FALSE"
	}).toString()}`;
}
var PARTY_TONE = {
	saf: "bg-saf/15 text-saf border-saf/30",
	rsf: "bg-rsf/15 text-rsf border-rsf/30",
	mixed: "bg-mixed/15 text-mixed border-mixed/30",
	other_armed: "bg-other/15 text-other border-other/30",
	civilian: "bg-civilian/15 text-civilian border-civilian/30",
	unknown: "bg-unknown/15 text-unknown border-unknown/30"
};
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			secondary: "bg-raised text-fg border border-border hover:bg-surface",
			ghost: "text-fg hover:bg-raised",
			outline: "border border-border bg-transparent text-fg hover:bg-raised",
			danger: "bg-damage/90 text-fg hover:bg-damage"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-8 px-3 text-xs",
			lg: "h-11 px-5",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { daysAgo as a, mapCommand as c, snapshotUrl as d, copyText as i, mapFit as l, PARTY_TONE as n, downloadBlob as o, cn as r, formatUtc as s, Button as t, mapMeasure as u };
