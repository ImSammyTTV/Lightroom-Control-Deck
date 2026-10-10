import { action, DialDownEvent, DialRotateEvent, DidReceiveSettingsEvent, SingletonAction, TouchTapEvent, WillAppearEvent, WillDisappearEvent, type Action } from "@elgato/streamdeck";

import { bridge, type SliderValue } from "../bridge";
import model from "../generated/model.json";
import { brand, wheelCanvas, type Reading, type WheelMode } from "../render";
import { throttle } from "../throttle";

type Settings = { wheel?: string; accent?: string };

const MODES: WheelMode[] = ["hue", "sat", "lum"];
const wheelFor = (id?: string) => model.wheels.find((w) => w.id === id) ?? model.wheels[0];

/** A colour grading wheel on one dial: turn to adjust, push to cycle hue / saturation / luminance, tap to reset. */
@action({ UUID: `${brand.uuid}.wheel` })
export class WheelAction extends SingletonAction<Settings> {
	private visible = new Map<string, Action<Settings>>();
	private modes = new Map<string, WheelMode>();
	private readings = new Map<string, Reading>();

	constructor() {
		super();
		const repaint = throttle(() => this.visible.forEach((a) => void this.paint(a)));
		bridge.on("value", (m: SliderValue) => {
			this.readings.set(m.param, { v: m.value, min: m.min, max: m.max });
			repaint();
		});
	}

	override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
		this.visible.set(ev.action.id, ev.action);
		this.watch(ev.payload.settings);
		return this.paint(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		this.visible.delete(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> | void {
		this.watch(ev.payload.settings);
		return this.paint(ev.action);
	}

	override onDialRotate(ev: DialRotateEvent<Settings>): void {
		bridge.adjust(this.activeParam(ev.action.id, ev.payload.settings), ev.payload.ticks);
	}

	override onDialDown(ev: DialDownEvent<Settings>): Promise<void> | void {
		const next = MODES[(MODES.indexOf(this.modes.get(ev.action.id) ?? "hue") + 1) % MODES.length];
		this.modes.set(ev.action.id, next);
		return this.paint(ev.action);
	}

	override onTouchTap(ev: TouchTapEvent<Settings>): void {
		if (bridge.ready(ev.action)) bridge.reset(this.activeParam(ev.action.id, ev.payload.settings));
	}

	private activeParam(id: string, settings: Settings): string {
		return wheelFor(settings.wheel)[this.modes.get(id) ?? "hue"];
	}

	private watch(settings: Settings): void {
		const w = wheelFor(settings.wheel);
		[w.hue, w.sat, w.lum].forEach((p) => bridge.watch(p));
	}

	private async paint(a: Action<Settings>): Promise<void> {
		if (!a.isDial()) return;
		const { wheel, accent } = await a.getSettings();
		const w = wheelFor(wheel);
		const r = { hue: this.readings.get(w.hue), sat: this.readings.get(w.sat), lum: this.readings.get(w.lum) };
		await a.setFeedback({ canvas: wheelCanvas(w.label, this.modes.get(a.id) ?? "hue", r, accent ?? brand.colors.pencilYellow) });
	}
}
