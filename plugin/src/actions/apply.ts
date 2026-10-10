import { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { bridge } from "../bridge";
import { applyImage, brand } from "../render";

type Settings = { type?: string; name?: string; accent?: string };

/** One key that applies a develop preset, adds the selection to a collection, or adds a keyword, by name. */
@action({ UUID: `${brand.uuid}.apply` })
export class ApplyAction extends SingletonAction<Settings> {
	override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
		return this.draw(ev);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> | void {
		return this.draw(ev);
	}

	override onKeyDown(ev: KeyDownEvent<Settings>): void {
		const { type = "preset", name } = ev.payload.settings;
		if (name && bridge.ready(ev.action)) bridge.item(type, name);
	}

	private async draw(ev: WillAppearEvent<Settings> | DidReceiveSettingsEvent<Settings>): Promise<void> {
		const { type = "preset", name = "", accent } = ev.payload.settings;
		if (ev.action.isKey()) await ev.action.setImage(applyImage(type, name, accent ?? brand.colors.pencilYellow));
	}
}
