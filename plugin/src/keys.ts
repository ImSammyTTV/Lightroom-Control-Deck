import { execFile } from "node:child_process";

type Combo = { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean };

// Lightroom Classic's default shortcuts (Ctrl on Windows maps to Cmd on Mac, Alt to Option).
const shortcuts: Record<string, Combo> = {
	key_before: { key: "\\" },
	key_ba_h: { key: "y" },
	key_ba_v: { key: "y", alt: true },
	key_clipping: { key: "j" },
	key_snapshot: { key: "n", ctrl: true },
	key_stamp: { key: "v", ctrl: true, alt: true },
	key_sync: { key: "s", ctrl: true, shift: true },
	key_editps: { key: "e", ctrl: true },
	key_export: { key: "e", ctrl: true, shift: true },
};

export function sendShortcut(id: string): void {
	const c = shortcuts[id];
	if (!c) return;
	if (process.platform === "win32") {
		const keys = `${c.ctrl ? "^" : ""}${c.shift ? "+" : ""}${c.alt ? "%" : ""}${c.key}`;
		const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys}')`;
		execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script], { windowsHide: true }, () => {});
	} else if (process.platform === "darwin") {
		const mods = [c.ctrl && "command down", c.shift && "shift down", c.alt && "option down"].filter(Boolean).join(", ");
		const key = c.key === "\\" ? "\\\\" : c.key;
		execFile("osascript", ["-e", `tell application "System Events" to keystroke "${key}"${mods ? ` using {${mods}}` : ""}`], () => {});
	}
}
