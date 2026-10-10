import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { bankKeyImage, banks, brand } from "../render";

type Settings = { to?: string };

// The profile shipped for each device type (see scripts/profiles.mjs). Bank order is page order inside it.
const PROFILE_BY_DEVICE: Record<number, string> = { 0: "mk2", 1: "mini", 2: "xl", 7: "plus", 9: "neo", 13: "plusxl" };

/** Jumps to a named bank (page) of the Lightroom Control Deck profile for this device. */
@action({ UUID: `${brand.uuid}.bank` })
export class BankAction extends SingletonAction<Settings> {
	override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
		return this.draw(ev);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> | void {
		return this.draw(ev);
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const index = banks.findIndex((b) => b.id === ev.payload.settings.to);
		const profile = PROFILE_BY_DEVICE[ev.action.device.type];
		if (index < 0 || !profile) return void ev.action.showAlert();
		try {
			await streamDeck.profiles.switchToProfile(ev.action.device.id, `profiles/lightroom-control-deck-${profile}`, index);
		} catch {
			await ev.action.showAlert();
		}
	}

	private async draw(ev: WillAppearEvent<Settings> | DidReceiveSettingsEvent<Settings>): Promise<void> {
		if (!ev.action.isKey()) return;
		const index = banks.findIndex((b) => b.id === ev.payload.settings.to);
		const bank = banks[index];
		await ev.action.setImage(bankKeyImage(Math.max(index, 0), banks.length, bank?.name ?? "Choose", bank?.accent ?? brand.colors.pencilYellow));
	}
}
