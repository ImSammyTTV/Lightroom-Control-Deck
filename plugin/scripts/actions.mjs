// The plugin's actions. The manifest, the settings pages and the profile generator all read this list.
import { brand } from "./brand.mjs";

export const actions = [
  { id: "key", name: "Key", tooltip: "Run any Lightroom command from a key: flag, rate, tag, move, switch view, undo and more.", controllers: ["Keypad", "Encoder"], pi: "key", encoder: { Push: "Run command", Touch: "Run command" } },
  { id: "fader", name: "Fader", tooltip: "Any Develop slider on a dial: turn to move it, push to reset. On a key, press to reset.", controllers: ["Encoder", "Keypad"], pi: "fader", encoder: { Rotate: "Move slider", Push: "Reset slider", Touch: "Reset slider" } },
  { id: "nudge", name: "Nudge Key", tooltip: "Nudge a Develop slider up or down from a key. Hold to keep going.", controllers: ["Keypad"], pi: "nudge" },
  { id: "wheel", name: "Grade Wheel", tooltip: "A colour grading wheel on one dial. Push to cycle hue, saturation and luminance.", controllers: ["Encoder"], pi: "wheel", encoder: { Rotate: "Adjust", Push: "Hue / Sat / Lum", Touch: "Reset" } },
  { id: "browse", name: "Browse Dial", tooltip: "Work through a shoot: browse and flag, set stars, set a colour tag, or zoom the loupe.", controllers: ["Encoder"], pi: "browse", encoder: { Rotate: "Step through", Push: "Primary action", Touch: "Secondary action" } },
  { id: "frame", name: "Frame Dial", tooltip: "Crop on a dial: turn to preview an aspect ratio, push to apply it, tap to clear.", controllers: ["Encoder"], pi: null, encoder: { Rotate: "Preview ratio", Push: "Apply crop", Touch: "Clear crop" } },
  { id: "apply", name: "Quick Apply", tooltip: "Apply a develop preset, add to a collection, or add a keyword, by name.", controllers: ["Keypad"], pi: "apply" },
  { id: "bank", name: "Bank Key", tooltip: "Jump to a bank of controls: Sort, Tone, Balance, Colour, Detail or Shape.", controllers: ["Keypad"], pi: "bank" },
];

export const uuidFor = (id) => `${brand.uuid}.${id}`;
