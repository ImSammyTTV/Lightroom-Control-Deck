import { action, DidReceiveSettingsEvent, KeyDownEvent, KeyUpEvent, SingletonAction, WillAppearEvent, WillDisappearEvent, type Action } from "@elgato/streamdeck";

import { bridge, type SliderValue } from "../bridge";
import { brand, paramsById, sliderKeyImage, type Reading } from "../render";
import { throttle } from "../throttle";

type Settings = { param?: string; direction?: string; step?: string; accent?: string };

/** A key that nudges a slider up or down; hold to keep going. Shows the live value. */
@action({ UUID: `${brand.uuid}.nudge` })
export class NudgeAction extends SingletonAction<Settings> {
	private visible = new Map<string, Action<Settings>>();
	private readings = new Map<string, Reading>();
	private timers = new Map<string, ReturnType<typeof setInterval>>();

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
		if (ev.payload.settings.param) bridge.watch(ev.payload.settings.param);
		return this.paint(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		this.visible.delete(ev.action.id);
		this.stop(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> | void {
		if (ev.payload.settings.param) bridge.watch(ev.payload.settings.param);
		return this.paint(ev.action);
	}

	override onKeyDown(ev: KeyDownEvent<Settings>): void {
		const { param, direction, step } = ev.payload.settings;
		if (!param || !bridge.ready(ev.action)) return;
		const ticks = Number(direction ?? 1) * Number(step ?? 2);
		bridge.adjust(param, ticks);
		this.stop(ev.action.id);
		this.timers.set(ev.action.id, setInterval(() => bridge.adjust(param, ticks), 120));
	}

	override onKeyUp(ev: KeyUpEvent<Settings>): void {
		this.stop(ev.action.id);
	}

	private stop(id: string): void {
		clearInterval(this.timers.get(id));
		this.timers.delete(id);
	}

	private async paint(a: Action<Settings>): Promise<void> {
		if (!a.isKey()) return;
		const { param, direction, accent } = await a.getSettings();
		await a.setImage(sliderKeyImage(paramsById.get(param ?? ""), param ? this.readings.get(param) : undefined, Number(direction ?? 1), accent ?? brand.colors.pencilYellow));
	}
}
