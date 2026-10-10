import { action, DialDownEvent, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, TouchTapEvent, WillAppearEvent, WillDisappearEvent, type Action } from "@elgato/streamdeck";

import { bridge } from "../bridge";
import { brand, commandCanvas, commandImage, commandsById, isActive } from "../render";
import { throttle } from "../throttle";

type Settings = { command?: string; advance?: boolean; title?: string; accent?: string };

const ADVANCING = /^(pick|reject|rate[1-5]|red|yellow|green|blue|purple)$/;

/** Any Lightroom command on a key: flag, rate, tag, move around, switch view, undo and so on. */
@action({ UUID: `${brand.uuid}.key` })
export class KeyAction extends SingletonAction<Settings> {
	private visible = new Map<string, Action<Settings>>();

	constructor() {
		super();
		const repaint = throttle(() => this.visible.forEach((a) => void this.paint(a)));
		bridge.on("state", repaint);
	}

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

	override onKeyDown(ev: KeyDownEvent<Settings>): void {
		this.run(ev.payload.settings, ev.action);
	}

	override onDialDown(ev: DialDownEvent<Settings>): void {
		this.run(ev.payload.settings, ev.action);
	}

	override onTouchTap(ev: TouchTapEvent<Settings>): void {
		this.run(ev.payload.settings, ev.action);
	}

	private run({ command, advance }: Settings, act: { showAlert(): Promise<void> }): void {
		if (!command) return;
		// Keyboard-shortcut commands don't need the bridge; everything else does.
		if (!command.startsWith("key_") && !bridge.ready(act)) return;
		bridge.command(command);
		if (advance && ADVANCING.test(command)) bridge.command("next");
	}

	private async paint(a: Action<Settings>): Promise<void> {
		const { command, title, accent } = await a.getSettings();
		const cmd = commandsById.get(command ?? "");
		const color = accent ?? brand.colors.pencilYellow;
		if (a.isDial()) {
			await a.setFeedback({ canvas: commandCanvas(cmd, color) });
		} else if (a.isKey()) {
			await a.setImage(commandImage(cmd, { active: cmd ? isActive(cmd.id, bridge.state) : false, accent: color, title }));
		}
	}
}
