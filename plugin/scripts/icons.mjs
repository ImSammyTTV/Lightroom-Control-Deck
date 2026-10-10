// Renders every PNG the manifest points at: plugin icon, category icon, action-list icons and default key images.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

import { actions } from "./actions.mjs";
import { brand } from "./brand.mjs";

const SD = `${brand.uuid}.sdPlugin`;
mkdirSync(`${SD}/imgs/actions`, { recursive: true });
const C = brand.colors;

const stroke = (d, c = "#fff", w = 1.8) => `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
const fill = (d, c = "#fff") => `<g fill="${c}">${d}</g>`;
const frame = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.22}"/>`;

// Action-list glyphs: white line art on a transparent background, 24x24.
const glyphs = {
  key: stroke(`<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><rect x="7.5" y="7" width="9" height="7.5" rx="1.5"/>`) + fill(`<circle cx="17.5" cy="6.5" r="1.4"/>`),
  fader: stroke(`<path d="M3 17h18"/><path d="M5 17v-2M8 17v-3M11 17v-2M14 17v-3M17 17v-2M20 17v-3"/>`) + fill(`<path d="M12 4l3.4 6H8.6z"/>`),
  nudge: stroke(`<path d="M3 18h18"/><path d="M7 11l5-5 5 5"/>`) + fill(`<circle cx="12" cy="18" r="1.6"/>`),
  wheel: stroke(`<circle cx="12" cy="12" r="9"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/>`) + fill(`<circle cx="12" cy="12" r="3.4"/>`),
  browse: stroke(`<rect x="2.5" y="8" width="4.5" height="8" rx="1.2"/><rect x="17" y="8" width="4.5" height="8" rx="1.2"/><rect x="9" y="5.5" width="6" height="13" rx="1.5"/>`),
  frame: stroke(`<path d="M7 3v14h14M3 7h14v14"/>`),
  apply: stroke(`<path d="M3 7.5h11.5L20 13l-5.5 5.5H3z"/><path d="M17 3v5M14.5 5.5h5"/>`),
  bank: stroke(`<rect x="3.5" y="11" width="13" height="9" rx="2"/><path d="M7 7.5h13.5V16M10.5 4h10"/>`),
  category: stroke(`<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>`) + fill(`<rect x="13" y="13" width="8" height="8" rx="2"/>`),
};

const svg = (size, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${bg ? `<rect width="24" height="24" fill="${bg}"/>` : ""}${body}</svg>`;
const png = (file, size, s) => sharp(Buffer.from(s), { density: 300 }).resize(size, size).png().toFile(`${SD}/imgs/${file}.png`);

// Plugin icon: a landscape photo above three Develop-style sliders, so it reads as photo editing at a glance.
const pluginSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 288 288">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#202226"/><stop offset="1" stop-color="#0e0e10"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d6fd6"/><stop offset="1" stop-color="#9cc4ff"/></linearGradient>
<clipPath id="ph"><rect x="40" y="40" width="208" height="124" rx="20"/></clipPath></defs>
<rect width="288" height="288" rx="62" fill="url(#g)"/><rect x="8" y="8" width="272" height="272" rx="55" fill="none" stroke="${C.edge}" stroke-width="6"/>
<g clip-path="url(#ph)"><rect x="40" y="40" width="208" height="124" fill="url(#sky)"/>
<circle cx="196" cy="84" r="17" fill="${C.pencilYellow}"/>
<path d="M40 164V128l46-48 38 38 30-26 54 52v20z" fill="#1b2538"/><path d="M40 164v-14l60-36 34 24 40-22 74 48v0z" fill="#10151f"/></g>
<rect x="40" y="40" width="208" height="124" rx="20" fill="none" stroke="${C.ink}" stroke-opacity=".55" stroke-width="4"/>
<g stroke-linecap="round"><g stroke="#3a3c41" stroke-width="9"><path d="M52 192h184M52 218h184M52 244h184"/></g>
<path d="M52 192h110" stroke="#8fe3c0" stroke-width="9"/><path d="M52 218h60" stroke="#ff9f5a" stroke-width="9"/><path d="M52 244h138" stroke="#ff7ab8" stroke-width="9"/></g>
<g fill="${C.ink}"><circle cx="162" cy="192" r="11"/><circle cx="112" cy="218" r="11"/><circle cx="190" cy="244" r="11"/></g>
</svg>`;

const jobs = [];
jobs.push(sharp(Buffer.from(pluginSvg)).resize(256, 256).png().toFile(`${SD}/imgs/plugin-icon.png`));
jobs.push(sharp(Buffer.from(pluginSvg)).resize(512, 512).png().toFile(`${SD}/imgs/plugin-icon@2x.png`));
jobs.push(png("category-icon", 28, svg(28, glyphs.category)), png("category-icon@2x", 56, svg(56, glyphs.category)));
for (const a of actions) {
  jobs.push(png(`actions/${a.id}`, 20, svg(20, glyphs[a.id])), png(`actions/${a.id}@2x`, 40, svg(40, glyphs[a.id])));
  const key = `<g transform="translate(4.5 4.5) scale(.625)">${glyphs[a.id]}</g>`;
  jobs.push(png(`actions/${a.id}-key`, 72, svg(72, key, C.panel)), png(`actions/${a.id}-key@2x`, 144, svg(144, key, C.panel)));
}
await Promise.all(jobs);
console.log("icons rendered");
