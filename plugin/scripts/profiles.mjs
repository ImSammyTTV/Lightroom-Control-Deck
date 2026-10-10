// Builds one .streamDeckProfile per device (a page per bank) and returns the manifest "Profiles" entries.
import { zipSync, strToU8 } from "fflate";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

import { actions, uuidFor } from "./actions.mjs";
import { brand, banks } from "./brand.mjs";
import { buildBank, devices } from "./layouts.mjs";

const PLUGIN = { Name: brand.name, UUID: brand.uuid, Version: brand.version };
const nameOf = Object.fromEntries(actions.map((a) => [a.id, a.name]));

function make(spec, accent, nextBankId) {
  if (!spec || spec === "-") return null;
  let kind = "key", settings;
  if (spec === "@bank") { kind = "bank"; settings = { to: nextBankId }; }
  else if (spec === "frame") { kind = "frame"; settings = { accent }; }
  else if (spec.startsWith("wheel:")) { kind = "wheel"; settings = { wheel: spec.slice(6), accent }; }
  else if (spec.startsWith("browse:")) { kind = "browse"; settings = { mode: spec.slice(7), accent }; }
  else if (spec.startsWith("f:")) { kind = "fader"; settings = { param: spec.slice(2), accent }; }
  else if (spec.startsWith("up:") || spec.startsWith("down:")) { kind = "nudge"; settings = { param: spec.split(":")[1], direction: spec.startsWith("up") ? "1" : "-1", step: "2", accent }; }
  else settings = spec.endsWith("*") ? { command: spec.slice(0, -1), advance: true, accent } : { command: spec, accent };
  return { ActionID: randomUUID(), LinkedTitle: true, Name: nameOf[kind], Plugin: PLUGIN, Resources: null, Settings: settings, State: 0, States: [{}], UUID: uuidFor(kind) };
}

function page(deviceId, bankIndex) {
  const bank = banks[bankIndex];
  const next = banks[(bankIndex + 1) % banks.length];
  const { rows, dials } = buildBank(deviceId, bank.id);
  const keys = {};
  rows.forEach((row, r) => row.forEach((s, c) => { const a = make(s, bank.accent, next.id); if (a) keys[`${c},${r}`] = a; }));
  const encoders = {};
  dials.forEach((s, i) => { const a = make(s, bank.accent, next.id); if (a) encoders[`${i},0`] = a; });
  return {
    Controllers: [
      { Actions: Object.keys(keys).length ? keys : null, Type: "Keypad" },
      { Actions: Object.keys(encoders).length ? encoders : null, Type: "Encoder" },
    ],
    Icon: "",
    Name: bank.name,
  };
}

const empty = { Controllers: [{ Actions: null, Type: "Keypad" }, { Actions: null, Type: "Encoder" }], Icon: "", Name: "" };
const json = (o) => strToU8(JSON.stringify(o));

export function buildProfiles(dir) {
  mkdirSync(dir, { recursive: true });
  const entries = [];
  for (const [id, dev] of Object.entries(devices)) {
    const profileId = randomUUID().toUpperCase();
    const defaultPage = randomUUID();
    const pageIds = banks.map(() => randomUUID());
    const root = `Profiles/${profileId}.sdProfile`;
    const files = {
      "package.json": json({ AppVersion: "7.3.1.22604", DeviceModel: dev.model, DeviceSettings: null, FormatVersion: 1, OSType: "Windows", OSVersion: "10.0.22631", RequiredPlugins: [brand.uuid] }),
      [`${root}/manifest.json`]: json({
        Device: { Model: dev.model, UUID: "" },
        Name: `${brand.name} (${dev.title})`,
        Pages: { Current: "00000000-0000-0000-0000-000000000000", Default: defaultPage, Pages: pageIds },
        Version: "3.0",
      }),
      [`${root}/Profiles/${defaultPage.toUpperCase()}/manifest.json`]: json(empty),
    };
    banks.forEach((_, i) => { files[`${root}/Profiles/${pageIds[i].toUpperCase()}/manifest.json`] = json(page(id, i)); });
    const file = `${brand.slug}-${id}`;
    writeFileSync(`${dir}/${file}.streamDeckProfile`, zipSync(files));
    entries.push({ Name: `profiles/${file}`, DeviceType: dev.type, AutoInstall: true, DontAutoSwitchWhenInstalled: true, Readonly: false });
  }
  return entries;
}
