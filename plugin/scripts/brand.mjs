// One place for the product's identity. Everything generated (manifest, profiles, icons, docs) reads from here.
export const brand = {
  name: "Lightroom Control Deck",
  product: "Lightroom Control Deck for Lightroom Classic",
  tagline: "A control surface for Lightroom Classic",
  slug: "lightroom-control-deck",
  uuid: "com.imsammy.lightroom-control-deck",
  author: "ImSammy",
  version: "0.1.3.3",
  repo: "ImSammyTTV/Lightroom-Control-Deck",
  commandPort: 53110,
  statusPort: 53112,
  // Light-table palette: warm paper white on charcoal, grease-pencil accents.
  colors: { bg: "#0e0e10", panel: "#17181b", slide: "#232529", edge: "#3a3c41", ink: "#f3efe4", muted: "#9a968a", pencilYellow: "#ffd23f", pencilRed: "#ff5a4d" },
};

// Task-based pages ("banks"). Each has an accent used for its LED, ruler marker and bank key.
export const banks = [
  { id: "sort", name: "Sort", accent: "#ffd23f" },
  { id: "tone", name: "Tone", accent: "#8fe3c0" },
  { id: "balance", name: "Balance", accent: "#ff9f5a" },
  { id: "colour", name: "Colour", accent: "#ff7ab8" },
  { id: "detail", name: "Detail", accent: "#7aa8ff" },
  { id: "shape", name: "Shape", accent: "#c3a6ff" },
];
