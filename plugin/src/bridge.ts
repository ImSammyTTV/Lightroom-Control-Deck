import { EventEmitter } from "node:events";
import net from "node:net";

import { sendShortcut } from "./keys";

import model from "./generated/model.json";

// Lightroom's sockets listen on both ports; this plugin connects to them as a client.
// Commands go to LR_COMMAND_PORT; Lightroom pushes slider values and photo state back on LR_STATUS_PORT.
const LR_COMMAND_PORT = model.brand.commandPort;
const LR_STATUS_PORT = model.brand.statusPort;

export type PhotoState = { rating: number; flag: number; label: string; module: string };
export type SliderValue = { param: string; value: number; min: number; max: number };

class Bridge extends EventEmitter {
	private client?: net.Socket;
	private connected = false;
	private watched = new Set<string>();
	/** Latest rating / pick flag (1 pick, -1 reject, 0 none) / colour label / module of the selected photo. */
	state: PhotoState = { rating: 0, flag: 0, label: "none", module: "" };
	/** Previews of the previous, selected and next photo (base64 JPEG). Empty when there isn't one. */
	thumbs: Record<"p" | "c" | "n", { data: string; portrait: boolean }> = { p: { data: "", portrait: false }, c: { data: "", portrait: false }, n: { data: "", portrait: false } };

	start(): void {
		this.connectStatus();
		this.connectCommands();
	}

	/** Run a named command (see scripts/catalog.mjs). */
	command(id: string): void {
		if (id.startsWith("key_")) sendShortcut(id);
		else this.send(`cmd:${id}`);
	}

	/** Apply a develop preset, add to a collection, or add a keyword, by name. */
	item(type: string, name: string): void {
		this.send(`item:${type}:${name}`);
	}

	/** Nudge a develop slider by a number of dial ticks. */
	adjust(param: string, ticks: number): void {
		this.send(`adj:${param}:${ticks}`);
	}

	reset(param: string): void {
		this.send(`reset:${param}`);
	}

	/** Ask Lightroom to report this slider's value now and whenever it changes. */
	watch(param: string): void {
		this.watched.add(param);
		this.send(`watch:${param}`);
	}

	/** True while the Lightroom bridge is reachable; otherwise flashes the alert icon on the pressed key or dial. */
	ready(action: { showAlert(): Promise<void> }): boolean {
		if (this.connected) return true;
		void action.showAlert().catch(() => {});
		return false;
	}

	private send(line: string): void {
		if (this.connected) this.client?.write(`${line}\n`);
	}

	private connectCommands(): void {
		const socket = net.connect(LR_COMMAND_PORT, "127.0.0.1");
		this.client = socket;
		// We only write to this socket, but it must be drained or Node never sees Lightroom hang up (no 'end'/'close').
		socket.resume();
		socket.on("connect", () => {
			this.connected = true;
			this.emit("connection", true);
			this.watched.forEach((p) => this.send(`watch:${p}`));
		});
		const retry = () => {
			if (this.client !== socket) return;
			this.client = undefined;
			if (this.connected) this.emit("connection", false);
			this.connected = false;
			socket.destroy();
			setTimeout(() => this.connectCommands(), 2000);
		};
		socket.on("error", retry);
		socket.on("close", retry);
	}

	private connectStatus(): void {
		const socket = net.connect(LR_STATUS_PORT, "127.0.0.1");
		let buffer = "";
		socket.on("data", (chunk) => {
			buffer += chunk.toString("utf8");
			let i: number;
			while ((i = buffer.indexOf("\n")) >= 0) {
				this.handleStatus(buffer.slice(0, i).trim());
				buffer = buffer.slice(i + 1);
			}
		});
		let retried = false;
		const retry = () => {
			if (retried) return;
			retried = true;
			socket.destroy();
			setTimeout(() => this.connectStatus(), 2000);
		};
		socket.on("error", retry);
		socket.on("close", retry);
	}

	private handleStatus(line: string): void {
		const [kind, param, value, min, max] = line.split(":");
		if (kind === "thumb") {
			// thumb:<p|c|n>:<base64 JPEG, or - for none>
			if (param === "p" || param === "c" || param === "n") {
				const data = value && value !== "-" ? value : "";
				this.thumbs[param] = { data, portrait: data ? isPortraitJpeg(data) : false };
				this.emit("thumb");
			}
			return;
		}
		if (kind === "state") {
			// state:<rating>:<pickStatus>:<colorLabel>:<module>
			this.state = { rating: Number(param), flag: Number(value), label: ["red", "yellow", "green", "blue", "purple"].includes(min) ? min : "none", module: max ?? "" };
			this.emit("state", this.state);
			return;
		}
		// val:<param>:<value>:<min>:<max>
		if (kind !== "val") return;
		const msg: SliderValue = { param, value: Number(value), min: Number(min), max: Number(max) };
		if (Number.isFinite(msg.value)) this.emit("value", msg);
	}
}

export const bridge = new Bridge();

/** Reads the size out of a base64 JPEG (its start-of-frame marker) to tell portrait from landscape. */
function isPortraitJpeg(base64: string): boolean {
	const data = Buffer.from(base64.slice(0, 4000), "base64");
	for (let i = 2; i + 9 < data.length; ) {
		if (data[i] !== 0xff) { i++; continue; }
		const marker = data[i + 1];
		if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return data.readUInt16BE(i + 5) > data.readUInt16BE(i + 7);
		i += 2 + data.readUInt16BE(i + 2);
	}
	return false;
}
