// Bank layouts for every supported device. Each bank is a priority list; the builder fills as many keys and dials as the
// device has, always reserving the bottom-right key for the Bank key so it is in the same place on every page.
import { banks } from "./brand.mjs";

// type = manifest DeviceType, model = Stream Deck model id used inside a profile.
export const devices = {
  plus: { title: "Stream Deck +", type: 7, model: "20GBD9901", cols: 4, rows: 2, dials: 4 },
  plusxl: { title: "Stream Deck + XL", type: 13, model: "20GBX9901", cols: 9, rows: 4, dials: 6 },
  xl: { title: "Stream Deck XL", type: 2, model: "20GAT9901", cols: 8, rows: 4, dials: 0 },
  mk2: { title: "Stream Deck MK.2", type: 0, model: "20GBA9901", cols: 5, rows: 3, dials: 0 },
  neo: { title: "Stream Deck Neo", type: 9, model: "20GBJ9901", cols: 4, rows: 2, dials: 0 },
  mini: { title: "Stream Deck Mini", type: 1, model: "20GAI9901", cols: 3, rows: 2, dials: 0 },
};

// Spec strings (expanded by profiles.mjs):
//   "pick*"        key command (a trailing * means "go to the next photo afterwards")
//   "up:Param" / "down:Param"   nudge keys      "f:Param"   fader        "wheel:id"   colour wheel
//   "browse:mode"  browse dial (browse | stars | tag | loupe)           "frame"      crop dial
const bankDefs = {
  sort: {
    dials: ["browse:browse", "browse:stars", "browse:tag", "browse:loupe"],
    head: ["reject", "unflag", "pick*"],
    headKeysOnly: ["pick*", "reject", "unflag", "prev", "next"],
    tools: ["view_loupe", "view_grid", "view_compare", "view_survey", "rate1*", "rate2*", "rate3*", "rate4*", "rate5*", "red", "yellow", "green", "blue", "purple", "noLabel", "prev", "next", "zoomToggle", "selectAll", "selectNone", "module_library", "module_develop", "key_editps", "key_export", "key_sync"],
    sliders: [],
  },
  tone: {
    dials: ["f:Exposure2012", "f:Contrast2012", "f:Highlights2012", "f:Shadows2012", "f:Whites2012", "f:Blacks2012"],
    head: ["undo", "redo", "autoTone"],
    tools: ["resetAll", "key_before", "copySettings", "pasteSettings", "key_ba_h", "key_snapshot", "key_stamp", "key_clipping", "key_editps"],
    sliders: ["Exposure2012", "Contrast2012", "Highlights2012", "Shadows2012", "Whites2012", "Blacks2012"],
  },
  balance: {
    dials: ["f:Temperature", "f:Tint", "f:Vibrance", "f:Saturation", "f:SaturationAdjustmentOrange", "f:LuminanceAdjustmentOrange"],
    head: ["undo", "redo", "autoWB"],
    tools: ["resetAll", "key_before", "copySettings", "pasteSettings", "key_snapshot"],
    sliders: ["Temperature", "Tint", "Vibrance", "Saturation"],
  },
  colour: {
    dials: ["wheel:shadows", "wheel:midtones", "wheel:highlights", "wheel:global", "f:ColorGradeBlending", "f:SplitToningBalance"],
    head: ["undo", "redo", "resetAll"],
    tools: ["key_before", "copySettings", "pasteSettings", "key_snapshot", "autoTone", "autoWB"],
    sliders: ["Saturation", "Vibrance"],
  },
  detail: {
    dials: ["f:Texture", "f:Clarity2012", "f:Dehaze", "f:Sharpness", "f:LuminanceSmoothing", "f:ColorNoiseReduction"],
    head: ["undo", "redo", "key_before"],
    tools: ["resetAll", "key_clipping", "tool_dust", "tool_redeye", "tool_localized", "copySettings", "pasteSettings"],
    sliders: ["Texture", "Clarity2012", "Dehaze", "Sharpness"],
  },
  shape: {
    dials: ["frame", "f:CropAngle", "f:PerspectiveVertical", "f:PerspectiveHorizontal", "f:PerspectiveRotate", "f:PerspectiveScale"],
    head: ["tool_crop", "resetCrop", "undo"],
    tools: ["redo", "upright_1", "resetTransform", "tool_dust", "tool_gradient", "tool_circularGradient", "tool_localized", "key_editps"],
    sliders: ["CropAngle", "PerspectiveVertical", "PerspectiveHorizontal"],
  },
};

/** Specs for one bank of one device, row by row, plus its dials. */
export function buildBank(deviceId, bankId) {
  const d = devices[deviceId];
  const def = bankDefs[bankId];
  const capacity = d.cols * d.rows - 1; // the last key is the Bank key
  const nudges = def.sliders.flatMap((p) => [`up:${p}`, `down:${p}`]);
  const dialSliders = new Set(def.dials.slice(0, d.dials).map((s) => s.replace(/^f:/, "")));
  const keyOnly = d.dials === 0;
  // Dial devices already have the main sliders under their fingers, so only the rest get nudge keys; key-only decks need them all.
  const wantedNudges = keyOnly ? nudges : nudges.filter((n) => !dialSliders.has(n.split(":")[1]));
  const head = keyOnly && def.headKeysOnly ? def.headKeysOnly : def.head;
  const ordered = keyOnly && bankId !== "sort" ? [...head.slice(0, 1), ...wantedNudges, ...head.slice(1), ...def.tools] : [...head, ...def.tools, ...wantedNudges];
  const flat = [...new Set(ordered)].slice(0, capacity);
  while (flat.length < capacity) flat.push("-");
  flat.push("@bank");
  const rows = Array.from({ length: d.rows }, (_, r) => flat.slice(r * d.cols, (r + 1) * d.cols));
  const dials = def.dials.slice(0, d.dials);
  return { rows, dials };
}

export const bankIds = banks.map((b) => b.id);
