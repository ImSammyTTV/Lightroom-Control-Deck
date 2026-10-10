import model from "./generated/model.json";

export type Command = { id: string; label: string; glyph: string; group: string; color?: string };
export type Param = { id: string; label: string; group: string };
export type PhotoState = { rating: number; flag: number; label: string; module: string };
export type Reading = { v: number; min: number; max: number };

export const brand = model.brand;
export const commandsById = new Map<string, Command>(model.commands.map((c) => [c.id, c]));
export const paramsById = new Map<string, Param>(model.params.map((p) => [p.id, p]));
export const banks = model.banks;

const C = brand.colors;
const FONT = "Segoe UI, Helvetica, Arial, sans-serif";
const toUrl = (svg: string) => `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

const APERTURE = "#1b1c20";
const GREEN = "#47d17f";
const RED = "#ff5a4d";
const LABEL_COLORS: Record<string, string> = { red: "#ff5a4d", yellow: "#ffd23f", green: "#47d17f", blue: "#5b9dff", purple: "#b58cff" };

// ---- 24x24 glyph library (line art in warm ink unless a colour is given) ----------------------------------
const S = (d: string, c = C.ink) => `<g fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
const F = (d: string, c = C.ink) => `<g fill="${c}">${d}</g>`;
const STAR = "M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.5l-5.9 3.3 1.3-6.7L2.5 9.5l6.6-.8z";
const TAG = "M3 6.5h12.5L21 12l-5.5 5.5H3z";
const PIC = (c = C.ink) => F(`<rect x="3" y="4" width="18" height="16" rx="2"/>`, c) + F(`<path d="M5 18l5-6 3 3.5 2-2.5 4 5z"/><circle cx="16.5" cy="9" r="1.6"/>`, APERTURE);
const PERSON = `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0z"/>`;

const icons: Record<string, string> = {
	flagPick: F(`<path d="M5 3h2v18H5z"/><path d="M7 4h12l-3 4.5 3 4.5H7z"/>`, GREEN),
	flagReject: F(`<path d="M5 3h2v18H5z"/><path d="M7 4h12l-3 4.5 3 4.5H7z"/>`, RED),
	flagNone: S(`<path d="M6 3v18M6 4h12l-3 4.5 3 4.5H6"/>`),
	star: F(`<path d="${STAR}"/>`, C.pencilYellow),
	starEmpty: S(`<path d="${STAR}"/>`),
	noLabel: S(`<path d="${TAG}M3 3l18 18"/>`),
	prev: S(`<path d="M15 5l-7 7 7 7"/>`),
	next: S(`<path d="M9 5l7 7-7 7"/>`),
	selectAll: S(`<rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke-dasharray="3 2.5"/>`) + F(`<rect x="8" y="8" width="8" height="8" rx="1"/>`),
	selectNone: S(`<rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke-dasharray="3 2.5"/>`),
	grid: F(`<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/>`),
	survey: F(`<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>`),
	loupe: PIC(),
	compare: F(`<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="11" height="16" rx="1"/>`) + S(`<path d="M3.5 8h4M3.5 12h4M3.5 16h4"/>`, APERTURE),
	zoomIn: S(`<circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6M10 7v6M7 10h6"/>`),
	zoomOut: S(`<circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6M7 10h6"/>`),
	zoomToggle: S(`<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>`),
	undo: S(`<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-4"/>`),
	redo: S(`<path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h4"/>`),
	reset: S(`<path d="M3.5 12a8.5 8.5 0 102.6-6.1L3 9M3 4v5h5M12 7v5l3 2"/>`),
	crop: S(`<path d="M6 2v16h16M2 6h16v16"/>`),
	resetCrop: S(`<path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/>`),
	resetXform: F(`<path d="M3 9h18v8H3z"/>`) + S(`<path d="M6 9v3M9 9v4M12 9v3M15 9v4M18 9v3"/>`, APERTURE),
	mask: S(`<circle cx="12" cy="12" r="8"/>`) + F(`<path d="M12 4a8 8 0 010 16z"/>`),
	eye: S(`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`),
	redeye: S(`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>`) + F(`<circle cx="12" cy="12" r="3.5"/>`, RED),
	heal: F(`<g transform="rotate(-45 12 12)"><rect x="1.5" y="8" width="21" height="8" rx="4"/></g>`) + F(`<circle cx="10.5" cy="10.5" r="1"/><circle cx="13.5" cy="13.5" r="1"/><circle cx="13.5" cy="10.5" r="1"/><circle cx="10.5" cy="13.5" r="1"/>`, APERTURE),
	linear: S(`<path d="M2 12h12"/><circle cx="18" cy="12" r="3.2"/>`),
	radial: S(`<circle cx="12" cy="12" r="9"/>`) + F(`<circle cx="12" cy="12" r="4"/>`),
	brush: F(`<path d="M20.5 3.5l-9.5 9.5 2 2 9.5-9.5z"/><path d="M9 13.5c-3 0-4 2-4 4 0 1.5-1 2.5-2 3 4.5 1 8-.5 8-4a3 3 0 00-2-3z"/>`),
	subject: F(PERSON),
	sky: F(`<path d="M7 18a4.5 4.5 0 01-.5-9A6 6 0 0118 10a4 4 0 010 8z"/>`),
	background: F(`<path d="M12 3l9 5-9 5-9-5z"/>`) + S(`<path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>`),
	objects: F([5, 12, 19].flatMap((x) => [5, 12, 19].map((y) => `<circle cx="${x}" cy="${y}" r="1.8"/>`)).join("")),
	people: F(`<g transform="translate(6 3) scale(.5)">${PERSON}</g><g transform="translate(-0.5 9) scale(.4)">${PERSON}</g><g transform="translate(14.5 9) scale(.4)">${PERSON}</g>`),
	landscape: F(`<path d="M2 20L9 7l4 7 3-4 6 10z"/>`),
	camera: F(`<path d="M8 5l1.5-2h5L16 5h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/>`) + S(`<circle cx="12" cy="12.5" r="3.5"/>`, APERTURE),
	stamp: F(`<path d="M9 3h4v7h4a2 2 0 012 2v2H3v-2a2 2 0 012-2h4z"/><rect x="2" y="16" width="12" height="3" rx="1"/>`, C.pencilYellow) + S(`<path d="M16.5 17.5h5m-2-2l2 2-2 2"/>`, C.pencilYellow),
	sync: S(`<rect x="4" y="4.5" width="11" height="16" rx="2"/><path d="M7.5 4.5V3h4v1.5M11 14h10m-3-3l3 3-3 3"/>`, C.pencilYellow),
	editps: S(`<path d="M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M14 3h7v7M21 3L11 13"/>`),
	export: S(`<path d="M12 3v12m-5-5l5 5 5-5M4 20h16"/>`),
	autoTone: S(`<path d="M3 21L15 9M13 7l4 4"/>`) + F(`<path d="M18 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`, C.pencilYellow),
	autoWB: S(`<circle cx="12" cy="12" r="9.5"/>`) + `<text x="12" y="15.5" font-size="9" font-weight="700" text-anchor="middle" fill="${C.ink}" font-family="${FONT}">WB</text>`,
	clipping: F(`<circle cx="12" cy="12" r="9.5"/>`) + S(`<path d="M7.5 6.5v11M12 3v18M16.5 6.5v11"/>`, APERTURE),
	copy: S(`<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h2"/>`),
	paste: S(`<rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/>`),
	before: S(`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`),
	baH: F(`<path d="M3 4h8v16H3z"/>`) + S(`<path d="M14 4.8h6.2v14.4H14z"/>`),
	baV: F(`<path d="M4 3h16v8H4z"/>`) + S(`<path d="M4.8 13.8h14.4V20H4.8z"/>`),
	upright: S(`<path d="M5 20V4M19 20V4M5 8h14M5 16h14"/>`),
	uprightOff: S(`<path d="M5 20V4M19 20V4M3 3l18 18"/>`),
	module: S(`<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 9h8M8 12h8M8 15h5"/>`),
	develop: S(`<path d="M5 8h14M5 12h14M5 16h14"/>`) + F(`<circle cx="9" cy="8" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="16" r="2"/>`),
	library: PIC(),
	map: F(`<path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z"/>`) + F(`<circle cx="12" cy="9" r="2.5"/>`, APERTURE),
	book: S(`<path d="M4 4h7a2 2 0 012 2v14a2 2 0 00-2-2H4zM20 4h-7a2 2 0 00-2 2v14a2 2 0 012-2h7z"/>`),
	slideshow: F(`<path d="M7 4l13 8-13 8z"/>`),
	print: S(`<path d="M7 9V3h10v6M7 17H4v-8h16v8h-3"/><rect x="7" y="14" width="10" height="7"/>`),
	web: S(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`),
};

type Spec = { title: string; icon: string };

// Captions are written for this plugin: short, bottom-aligned, uppercase.
const CAPTION: Record<string, string> = {
	selectAll: "ALL", selectNone: "NONE", ratingUp: "STAR UP", ratingDown: "STAR DOWN", copySettings: "COPY LOOK", pasteSettings: "PASTE LOOK",
	resetAll: "RESET", resetCrop: "CLEAR CROP", resetTransform: "CLEAR SHAPE", resetBrush: "CLEAR BRUSH", key_ba_h: "SPLIT", key_ba_v: "STACK",
	key_before: "BEFORE", key_stamp: "LAST LOOK", key_editps: "TO PS", key_sync: "SYNC", key_snapshot: "SNAPSHOT", key_export: "EXPORT", key_clipping: "CLIPPING",
	zoomToggle: "1:1", zoomIn: "ZOOM +", zoomOut: "ZOOM -", noLabel: "NO TAG", autoWB: "AUTO WB", autoTone: "AUTO TONE", undo: "UNDO", redo: "REDO",
	view_compare: "COMPARE", view_survey: "SURVEY", view_loupe: "LOUPE", view_grid: "GRID", prev: "BACK", next: "FORWARD",
	tool_loupe: "HAND", tool_crop: "CROP", tool_dust: "HEAL", tool_redeye: "RED EYE", tool_gradient: "LINEAR", tool_circularGradient: "RADIAL", tool_localized: "BRUSH",
	newmask_brush: "NEW BRUSH", newmask_gradient: "NEW LINEAR", newmask_radial: "NEW RADIAL",
	module_library: "LIBRARY", module_develop: "DEVELOP", module_map: "MAP", module_book: "BOOK", module_slideshow: "SLIDES", module_print: "PRINT", module_web: "WEB",
};

function specFor(cmd: Command): Spec {
	const id = cmd.id;
	const title = CAPTION[id] ?? cmd.label.replace(/^(Tool|Mask|Crop|Upright): /, "").toUpperCase();
	let m: RegExpMatchArray | null;
	if ((m = id.match(/^rate(\d)$/))) return { title: m[1] === "0" ? "NO STARS" : `${m[1]} STAR${m[1] === "1" ? "" : "S"}`, icon: m[1] === "0" ? icons.starEmpty : icons.star };
	if (id === "ratingUp" || id === "ratingDown") return { title, icon: icons.star + F(`<text x="19" y="9" font-size="11" font-weight="700" text-anchor="middle" font-family="${FONT}">${id === "ratingUp" ? "+" : "−"}</text>`) };
	if (id === "pick") return { title: "PICK", icon: icons.flagPick };
	if (id === "reject") return { title: "REJECT", icon: icons.flagReject };
	if (id === "unflag") return { title: "CLEAR FLAG", icon: icons.flagNone };
	if (LABEL_COLORS[id]) return { title: id.toUpperCase(), icon: F(`<path d="${TAG}"/>`, LABEL_COLORS[id]) };
	if ((m = id.match(/^module_(.+)$/))) return { title, icon: icons[m[1]] ?? icons.module };
	if ((m = id.match(/^crop_(\d+)x(\d+)$/))) return { title: `${m[1]}:${m[2]}`, icon: ratioGlyph(Number(m[1]), Number(m[2])) };
	if ((m = id.match(/^upright_(\d)$/))) return { title: ["UPRIGHT OFF", "AUTO", "LEVEL", "VERTICAL", "FULL", "GUIDED"][Number(m[1])], icon: m[1] === "0" ? icons.uprightOff : icons.upright };
	if ((m = id.match(/^mask_(.+)$/))) return { title: m[1] === "background" ? "BACKDROP" : m[1].toUpperCase().replace("OBJECTS", "OBJECT"), icon: icons[m[1] === "objects" ? "objects" : m[1]] };
	const map: Record<string, string> = {
		prev: "prev", next: "next", selectAll: "selectAll", selectNone: "selectNone", view_loupe: "loupe", view_grid: "grid", view_compare: "compare", view_survey: "survey",
		zoomToggle: "zoomToggle", zoomIn: "zoomIn", zoomOut: "zoomOut", autoTone: "autoTone", autoWB: "autoWB", resetAll: "reset", copySettings: "copy", pasteSettings: "paste",
		undo: "undo", redo: "redo", tool_loupe: "loupe", tool_crop: "crop", tool_dust: "heal", tool_redeye: "redeye", tool_gradient: "linear", tool_circularGradient: "radial",
		tool_localized: "brush", key_before: "before", key_ba_h: "baH", key_ba_v: "baV", key_clipping: "clipping", key_snapshot: "camera", key_stamp: "stamp", key_sync: "sync",
		key_editps: "editps", key_export: "export", resetCrop: "resetCrop", resetTransform: "resetXform", resetBrush: "brush", newmask_brush: "brush", newmask_gradient: "linear",
		newmask_radial: "radial", noLabel: "noLabel",
	};
	return { title, icon: icons[map[id]] ?? F(`<text x="12" y="17" font-size="14" text-anchor="middle" fill="${C.ink}" font-family="${FONT}">${esc(cmd.glyph)}</text>`) };
}

/** A crop glyph drawn at the real aspect ratio, so the key shows the shape you'll get. */
function ratioGlyph(w: number, h: number): string {
	const max = 18;
	const rw = w >= h ? max : (max * w) / h;
	const rh = w >= h ? (max * h) / w : max;
	return S(`<rect x="${12 - rw / 2}" y="${12 - rh / 2}" width="${rw}" height="${rh}" rx="1.5"/>`);
}

/** Whether a command's effect is currently true for the selected photo / current module. */
export function isActive(id: string, s: PhotoState): boolean {
	const rating = id.match(/^rate(\d)$/);
	if (rating) return Number(rating[1]) > 0 && s.rating === Number(rating[1]);
	if (id === "pick") return s.flag === 1;
	if (id === "reject") return s.flag === -1;
	if (id.startsWith("module_")) return s.module === id.slice(7);
	return ["red", "yellow", "green", "blue", "purple"].includes(id) && s.label === id;
}

const ledColor = (id: string, accent: string): string => (id === "pick" ? GREEN : id === "reject" ? RED : LABEL_COLORS[id] ?? (id.startsWith("rate") ? C.pencilYellow : accent));

// ---- keys (144x144): slide mount, glyph in an aperture, caption along the bottom, LED in the corner -------------
function slideKey(inner: string, caption: string, opts: { active?: boolean; accent: string; led?: string }): string {
	const { active = false, accent, led = accent } = opts;
	const frame = active ? led : C.edge;
	return (
		`<rect width="144" height="144" fill="${C.panel}"/>` +
		`<rect x="8" y="8" width="128" height="128" rx="20" fill="${C.slide}" stroke="${C.edge}" stroke-width="1.5"/>` +
		`<rect x="30" y="20" width="84" height="74" rx="10" fill="${APERTURE}" stroke="${frame}" stroke-width="${active ? 3 : 1.5}"/>` +
		inner +
		`<text x="72" y="119" font-size="15" font-weight="600" letter-spacing="1.6" fill="${active ? C.ink : C.muted}" text-anchor="middle" font-family="${FONT}">${esc(caption)}</text>` +
		(active ? `<circle cx="121" cy="23" r="10" fill="${led}" opacity=".25"/>` : "") +
		`<circle cx="121" cy="23" r="5.5" fill="${active ? led : "#2c2e33"}"/>`
	);
}
const glyphAt = (icon: string, size = 52) => `<g transform="translate(${72 - size / 2} ${57 - size / 2}) scale(${size / 24})">${icon}</g>`;

export function commandImage(cmd: Command | undefined, opts: { active?: boolean; accent?: string; title?: string } = {}): string {
	const accent = opts.accent ?? C.pencilYellow;
	if (!cmd) return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${slideKey(`<text x="72" y="63" font-size="13" fill="${C.muted}" text-anchor="middle" font-family="${FONT}">EMPTY</text>`, "PICK A COMMAND", { accent })}</svg>`);
	const spec = specFor(cmd);
	const caption = (opts.title?.trim() || spec.title).slice(0, 13);
	return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${slideKey(glyphAt(spec.icon), caption, { active: opts.active, accent, led: ledColor(cmd.id, accent) })}</svg>`);
}

/** The bank key: names the bank it jumps to and marks that bank's place in the strip of banks. */
export function bankKeyImage(targetIndex: number, total: number, targetName: string, accent: string): string {
	const cell = 11, gap = 4, w = total * cell + (total - 1) * gap, x0 = 72 - w / 2;
	const strip = Array.from({ length: total }, (_, i) => `<rect x="${x0 + i * (cell + gap)}" y="78" width="${cell}" height="7" rx="2.5" fill="${i === targetIndex ? accent : "#34363b"}"/>`).join("");
	const body = `<text x="72" y="60" font-size="${targetName.length > 5 ? 15 : 19}" font-weight="700" letter-spacing=".6" fill="${accent}" text-anchor="middle" font-family="${FONT}">${esc(targetName.toUpperCase())}</text>` + strip;
	return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${slideKey(body, "GO TO", { accent, active: true })}</svg>`);
}

/** Quick Apply key: a preset, a collection or a keyword, by name. */
export function applyImage(type: string, name: string, accent: string): string {
	const icon = type === "collection" ? icons.grid : type === "keyword" ? S(`<path d="${TAG}"/><circle cx="16" cy="12" r="1.2"/>`) : icons.autoTone;
	const caption = (name || (type === "collection" ? "COLLECTION" : type === "keyword" ? "KEYWORD" : "PRESET")).toUpperCase().slice(0, 13);
	return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${slideKey(glyphAt(icon), caption, { accent })}</svg>`);
}

// ---- values --------------------------------------------------------------------------------------------------
export function formatValue(v: number, min: number, max: number): string {
	const span = Math.abs(max - min);
	const text = span <= 20 ? v.toFixed(2) : String(Math.round(v));
	return v > 0 && min < 0 ? `+${text}` : text;
}

function ruler(x: number, y: number, w: number, r: Reading | undefined, accent: string, ticks = 41): string {
	const pct = r && r.max > r.min ? (r.v - r.min) / (r.max - r.min) : 0.5;
	const zero = r && r.min < 0 && r.max > 0 ? -r.min / (r.max - r.min) : 0;
	const lo = Math.min(pct, zero), hi = Math.max(pct, zero), step = w / (ticks - 1);
	let s = "";
	for (let i = 0; i < ticks; i++) {
		const p = i / (ticks - 1), major = i % 5 === 0, h = major ? 14 : 8;
		s += `<rect x="${x + i * step - 0.8}" y="${y + 14 - h}" width="1.6" height="${h}" rx=".8" fill="${p >= lo - 1e-6 && p <= hi + 1e-6 ? accent : "#46484e"}"/>`;
	}
	const mx = x + w * pct;
	return s + `<path d="M${mx} ${y - 2}l-5-7h10z" fill="${accent}"/><rect x="${mx - 1.5}" y="${y - 2}" width="3" height="18" rx="1.5" fill="${accent}"/>`;
}

// ---- touch-strip cards (200x100) ------------------------------------------------------------------------------
const card = (inner: string) => toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect x="2" y="2" width="196" height="96" rx="10" fill="${C.slide}" stroke="${C.edge}" stroke-width="1.5"/>${inner}</svg>`);
const cap = (t: string, x = 14, anchor = "start") => `<text x="${x}" y="22" font-size="13" font-weight="600" letter-spacing="1.8" fill="${C.muted}" text-anchor="${anchor}" font-family="${FONT}">${esc(t.toUpperCase())}</text>`;
const bigValue = (t: string, x = 14, size = 34) => `<text x="${x}" y="60" font-size="${size}" font-weight="600" fill="${C.ink}" font-family="${FONT}">${esc(t)}</text>`;

export function faderCanvas(p: Param | undefined, r: Reading | undefined, accent: string): string {
	return card(cap(p?.label ?? "Pick a slider") + bigValue(r ? formatValue(r.v, r.min, r.max) : "--") + ruler(14, 72, 172, r, accent));
}

export function ratingCanvas(rating: number, accent = C.pencilYellow): string {
	const cells = [0, 1, 2, 3, 4].map((i) => `<rect x="${14 + i * 35}" y="36" width="30" height="30" rx="7" fill="${i < rating ? accent : "#2b2d32"}" stroke="${C.edge}"/><g transform="translate(${14 + i * 35 + 6} 42) scale(.75)">${F(`<path d="${STAR}"/>`, i < rating ? "#1b1c20" : "#4d4f56")}</g>`).join("");
	return card(cap("Stars") + cells + `<text x="186" y="88" font-size="12" fill="${C.muted}" text-anchor="end" font-family="${FONT}">${rating} of 5</text>`);
}

export function tagCanvas(label: string): string {
	const names = ["red", "yellow", "green", "blue", "purple"];
	const sw = names.map((n, i) => `<rect x="${14 + i * 35}" y="${n === label ? 32 : 38}" width="30" height="${n === label ? 38 : 30}" rx="7" fill="${LABEL_COLORS[n]}" opacity="${n === label ? 1 : 0.5}" ${n === label ? `stroke="${C.ink}" stroke-width="2"` : ""}/>`).join("");
	return card(cap("Colour tag") + sw + `<text x="186" y="90" font-size="12" fill="${C.muted}" text-anchor="end" font-family="${FONT}">${label === "none" ? "none" : label}</text>`);
}

const flagGlyph = (flag: number) => (flag === 1 ? icons.flagPick : flag === -1 ? icons.flagReject : "");
const flagWord = (flag: number) => (flag === 1 ? "picked" : flag === -1 ? "rejected" : "unflagged");

/** The Browse card on its own, used until Lightroom has sent a preview of the selected photo. */
export function browseCanvas(flag: number, rating = 0): string {
	const g = flagGlyph(flag);
	return card(
		cap("Browse") + `<rect x="60" y="30" width="80" height="54" rx="8" fill="#222428" stroke="${C.edge}" stroke-width="1.5"/><g transform="translate(88 45)">${icons.loupe}</g>` +
			`<text x="30" y="62" font-size="15" font-weight="600" fill="${rating ? C.pencilYellow : C.muted}" text-anchor="middle" font-family="${FONT}">${rating ? "★" + rating : "–"}</text>` +
			(g ? `<g transform="translate(152 44)">${g}</g>` : "") +
			`<text x="100" y="95" font-size="11" fill="${C.muted}" text-anchor="middle" font-family="${FONT}">${flagWord(flag)}</text>`,
	);
}

/** The right half of the Browse card; the photo preview fills the left half (see layouts/browse.json). */
export function browsePanel(flag: number, rating = 0): string {
	const g = flagGlyph(flag);
	return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect x="0" y="2" width="98" height="96" rx="10" fill="${C.slide}" stroke="${C.edge}" stroke-width="1.5"/>${cap("Browse", 12)}` +
		(g ? `<g transform="translate(14 32) scale(1.3)">${g}</g>` : "") +
		`<text x="54" y="58" font-size="20" font-weight="600" fill="${rating ? C.pencilYellow : C.muted}" font-family="${FONT}">${rating ? "★" + rating : "–"}</text>` +
		`<text x="49" y="88" font-size="11" fill="${C.muted}" text-anchor="middle" font-family="${FONT}">${flagWord(flag)}</text></svg>`);
}

export function loupeCanvas(accent: string): string {
	return card(
		cap("Loupe") + `<g transform="translate(14 36) scale(1.7)">${icons.zoomOut}</g><g transform="translate(144 36) scale(1.7)">${icons.zoomIn}</g>` +
			`<rect x="62" y="38" width="76" height="32" rx="16" fill="none" stroke="${accent}" stroke-width="2"/><text x="100" y="59" font-size="13" font-weight="600" fill="${C.ink}" text-anchor="middle" font-family="${FONT}">FIT / 1:1</text>`,
	);
}

export function frameCanvas(ratio: string, accent: string): string {
	const [a, b] = ratio.split(":").map(Number);
	const max = 52, w = a >= b ? max : (max * a) / b, h = a >= b ? (max * b) / a : max;
	return card(
		cap("Frame") + `<rect x="${52 - w / 2}" y="${58 - h / 2}" width="${w}" height="${h}" rx="4" fill="${APERTURE}" stroke="${accent}" stroke-width="2.5"/>` + bigValue(ratio, 96, 34) +
			`<text x="186" y="90" font-size="11" fill="${C.muted}" text-anchor="end" font-family="${FONT}">push: apply</text>`,
	);
}

export type WheelMode = "hue" | "sat" | "lum";
const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;

export function wheelCanvas(label: string, mode: WheelMode, r: { hue?: Reading; sat?: Reading; lum?: Reading }, accent: string): string {
	const cur = r[mode];
	const hue = r.hue?.v ?? 0, sat = r.sat?.v ?? 0;
	const lum = r.lum ? ((r.lum.v - r.lum.min) / (r.lum.max - r.lum.min || 1)) * 100 : 50;
	const chip = hsl(hue, Math.max(sat, 4), 25 + lum * 0.5);
	const tabs = (["hue", "sat", "lum"] as WheelMode[]).map((m, i) => `<text x="${150 + i * 18}" y="58" font-size="15" font-weight="700" fill="${m === mode ? accent : "#5b5d63"}" text-anchor="middle" font-family="${FONT}">${m === "hue" ? "H" : m === "sat" ? "S" : "L"}</text>`).join("");
	return card(
		`<circle cx="34" cy="48" r="22" fill="${chip}" stroke="${accent}" stroke-width="2.5"/>` + cap(label, 70) + tabs + bigValue(cur ? formatValue(cur.v, cur.min, cur.max) : "--", 70, 28) + ruler(70, 72, 116, cur, accent, 25),
	);
}

export function commandCanvas(cmd: Command | undefined, accent: string): string {
	if (!cmd) return card(`<text x="100" y="56" font-size="15" fill="${C.muted}" text-anchor="middle" font-family="${FONT}">Choose a command</text>`);
	const spec = specFor(cmd);
	return card(cap(spec.title, 100, "middle") + `<g transform="translate(76 34) scale(2)">${spec.icon}</g>`);
}

export function sliderKeyImage(p: Param | undefined, r: Reading | undefined, dir: number, accent: string): string {
	const val = r ? formatValue(r.v, r.min, r.max) : "--";
	const pct = r && r.max > r.min ? (r.v - r.min) / (r.max - r.min) : 0.5;
	const body =
		`<text x="78" y="63" font-size="24" font-weight="600" fill="${C.ink}" text-anchor="middle" font-family="${FONT}">${esc(val)}</text>` +
		`<rect x="40" y="76" width="64" height="4" rx="2" fill="#34363b"/><rect x="40" y="76" width="${64 * pct}" height="4" rx="2" fill="${accent}"/>` +
		`${dir === 0 ? "" : `<path d="${dir > 0 ? "M44 40l7-10 7 10z" : "M44 30l7 10 7-10z"}" fill="${accent}"/>`}`;
	return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144">${slideKey(body, (p?.label ?? "SLIDER").toUpperCase().slice(0, 13), { accent, active: false })}</svg>`);
}
