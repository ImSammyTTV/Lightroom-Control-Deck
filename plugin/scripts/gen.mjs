// Generates everything derived from the model and brand: model.json, the manifest, settings pages, icons and profiles.
import { writeFileSync, mkdirSync } from "node:fs";

import { actions, uuidFor } from "./actions.mjs";
import { brand, banks } from "./brand.mjs";
import { commands, params, cropRatios, wheels } from "./model.mjs";

const SD = `${brand.uuid}.sdPlugin`;
mkdirSync("src/generated", { recursive: true });
mkdirSync(`${SD}/ui`, { recursive: true });
mkdirSync(`${SD}/layouts`, { recursive: true });
writeFileSync("src/generated/model.json", JSON.stringify({ commands, params, cropRatios, wheels, banks, brand }, null, 1));

// ---- settings pages (sdpi-components) ------------------------------------------------------------------------------
const grouped = (items) => {
  const g = new Map();
  for (const i of items) g.set(i.group, [...(g.get(i.group) ?? []), i]);
  return [...g].map(([name, list]) => `<optgroup label="${name}">${list.map((i) => `<option value="${i.id}">${i.label}</option>`).join("")}</optgroup>`).join("\n");
};
const page = (body) => `<!doctype html>
<html><head><meta charset="utf-8"><script src="https://sdpi-components.dev/releases/v4/sdpi-components.js"></script></head>
<body>${body}</body></html>`;
const select = (setting, label, options, def = "") => `<sdpi-item label="${label}"><sdpi-select setting="${setting}"${def ? ` default="${def}"` : ""} placeholder="Choose...">${options}</sdpi-select></sdpi-item>`;
const opt = (v, t) => `<option value="${v}">${t}</option>`;

const pages = {
  key: page(
    select("command", "Command", grouped(commands)) +
      `<sdpi-item label="Caption"><sdpi-textfield setting="title" placeholder="Optional, replaces the caption" maxlength="13"></sdpi-textfield></sdpi-item>` +
      `<sdpi-item label="Auto-advance"><sdpi-checkbox setting="advance" label="Go to the next photo after Pick, Reject, stars or a tag"></sdpi-checkbox></sdpi-item>`,
  ),
  fader: page(select("param", "Slider", grouped(params))),
  nudge: page(select("param", "Slider", grouped(params)) + select("direction", "Direction", opt("1", "Up (+)") + opt("-1", "Down (-)"), "1") + select("step", "Step size", opt("1", "Fine") + opt("2", "Medium") + opt("5", "Coarse"), "2")),
  wheel: page(select("wheel", "Wheel", wheels.map((w) => opt(w.id, w.label)).join(""), "shadows")),
  browse: page(select("mode", "Dial does", opt("browse", "Browse (push: pick, tap: reject)") + opt("stars", "Stars (push: next photo, tap: clear)") + opt("tag", "Colour tag (push: clear)") + opt("loupe", "Loupe zoom (push: fit / 1:1)"), "browse")),
  apply: page(select("type", "Apply", opt("preset", "A develop preset") + opt("collection", "Add to a collection") + opt("keyword", "Add a keyword"), "preset") + `<sdpi-item label="Name"><sdpi-textfield setting="name" placeholder="Exactly as named in Lightroom"></sdpi-textfield></sdpi-item>`),
  bank: page(select("to", "Go to bank", banks.map((b) => opt(b.id, b.name)).join(""))),
};
for (const [id, html] of Object.entries(pages)) writeFileSync(`${SD}/ui/${id}.html`, html);

// ---- layout used by every dial for its touch-strip card -----------------------------------------------------------
writeFileSync(`${SD}/layouts/card.json`, JSON.stringify({ $schema: "https://schemas.elgato.com/streamdeck/plugins/layout.json", id: `${brand.uuid}.card`, items: [{ key: "canvas", type: "pixmap", rect: [0, 0, 200, 100] }] }, null, 2));

// ---- icons and profiles -----------------------------------------------------------------------------------------------
await import("./icons.mjs");
const { buildProfiles } = await import("./profiles.mjs");
const profiles = buildProfiles(`${SD}/profiles`);

// ---- manifest --------------------------------------------------------------------------------------------------------------
const manifest = {
  $schema: "https://schemas.elgato.com/streamdeck/plugins/manifest.json",
  SDKVersion: 3,
  Author: brand.author,
  URL: `https://github.com/${brand.repo}`,
  UUID: brand.uuid,
  Name: brand.name,
  Description: "A control surface for Lightroom Classic: sort and rate photos from keys, ride Develop sliders and colour wheels on dials, with live values on the deck. Needs the free Lightroom Control Deck bridge plugin in Lightroom.",
  Version: brand.version,
  Icon: "imgs/plugin-icon",
  Category: brand.name,
  CategoryIcon: "imgs/category-icon",
  CodePath: "bin/plugin.js",
  Nodejs: { Version: "20", Debug: "enabled" },
  OS: [{ Platform: "windows", MinimumVersion: "10" }, { Platform: "mac", MinimumVersion: "12" }],
  Software: { MinimumVersion: "7.1" },
  Actions: actions.map((a) => ({
    UUID: uuidFor(a.id),
    Name: a.name,
    Tooltip: a.tooltip,
    Icon: `imgs/actions/${a.id}`,
    ...(a.pi ? { PropertyInspectorPath: `ui/${a.pi}.html` } : {}),
    Controllers: a.controllers,
    ...(a.controllers.includes("Encoder") ? { Encoder: { layout: "layouts/card.json", TriggerDescription: a.encoder ?? {} } } : {}),
    States: [{ Image: `imgs/actions/${a.id}-key`, TitleAlignment: "bottom", ShowTitle: false }],
  })),
  Profiles: profiles,
};
writeFileSync(`${SD}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`manifest written: ${manifest.Actions.length} actions, ${profiles.length} profiles`);
