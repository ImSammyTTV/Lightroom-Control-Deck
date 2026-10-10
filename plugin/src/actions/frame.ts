import { action, DialDownEvent, DialRotateEvent, DidReceiveSettingsEvent, SingletonAction, TouchTapEvent, WillAppearEvent, WillDisappearEvent, type Action } from "@elgato/streamdeck";

import { bridge } from "../bridge";
import model from "../generated/model.json";
import { brand, frameCanvas } from "../render";

type Settings = { accent?: string };

const RATIOS: string[] = model.cropRatios;
const show = (r: string) => r.replace("x", ":");

/** Crop on a dial: turn to preview an aspect ratio on the strip, push to apply it, tap to clear the crop. */
@action({ UUID: `${brand.uuid}.frame` })
export class FrameAction extends SingletonAction<Settings> {
	private index = 0;
	private visible = new Map<string, Action<Settings>>();

	override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
		this.visible.set(ev.action.id, ev.action);
		return this.paint(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		this.visible.delete(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> | void {
		return this.paint(ev.action);
	}

	override onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> | void {
		this.index = (this.index + (ev.payload.ticks > 0 ? 1 : -1) + RATIOS.length) % RATIOS.length;
		return this.paint(ev.action);
	}

	override onDialDown(ev: DialDownEvent<Settings>): void {
		if (bridge.ready(ev.action)) bridge.command(`crop_${RATIOS[this.index]}`);
	}

	override onTouchTap(ev: TouchTapEvent<Settings>): void {
		if (bridge.ready(ev.action)) bridge.command("resetCrop");
	}

	private async paint(a: Action<Settings>): Promise<void> {
		if (!a.isDial()) return;
		const { accent } = await a.getSettings();
		await a.setFeedback({ canvas: frameCanvas(show(RATIOS[this.index]), accent ?? brand.colors.pencilYellow) });
	}
}
