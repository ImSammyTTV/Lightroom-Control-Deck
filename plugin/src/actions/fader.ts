import { action, DialDownEvent, DialRotateEvent, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, TouchTapEvent, WillAppearEvent, WillDisappearEvent, type Action } from "@elgato/streamdeck";

import { bridge, type SliderValue } from "../bridge";
import { brand, faderCanvas, paramsById, sliderKeyImage, type Reading } from "../render";
import { throttle } from "../throttle";

type Settings = { param?: string; accent?: string };

/** Any Develop slider on a dial (turn to move, push to reset), or on a key (press to reset). */
@action({ UUID: `${brand.uuid}.fader` })
export class FaderAction extends SingletonAction<Settings> {
	private visible = new Map<string, Action<Settings>>();
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
		const { param } = ev.payload.settings;
		if (param) bridge.adjust(param, ev.payload.ticks);
	}

	override onDialDown(ev: DialDownEvent<Settings>): void {
		this.reset(ev.payload.settings, ev.action);
	}

	override onTouchTap(ev: TouchTapEvent<Settings>): void {
		this.reset(ev.payload.settings, ev.action);
	}

	override onKeyDown(ev: KeyDownEvent<Settings>): void {
		this.reset(ev.payload.settings, ev.action);
	}

	private reset({ param }: Settings, act: { showAlert(): Promise<void> }): void {
		if (param && bridge.ready(act)) bridge.reset(param);
	}

	private watch({ param }: Settings): void {
		if (param) bridge.watch(param);
	}

	private async paint(a: Action<Settings>): Promise<void> {
		const { param, accent } = await a.getSettings();
		const p = paramsById.get(param ?? "");
		const r = param ? this.readings.get(param) : undefined;
		const color = accent ?? brand.colors.pencilYellow;
		if (a.isDial()) await a.setFeedback({ canvas: faderCanvas(p, r, color) });
		else if (a.isKey()) await a.setImage(sliderKeyImage(p, r, 0, color));
	}
}
