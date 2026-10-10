import { action, DialDownEvent, DialRotateEvent, DidReceiveSettingsEvent, SingletonAction, TouchTapEvent, WillAppearEvent, WillDisappearEvent, type Action } from "@elgato/streamdeck";

import { bridge } from "../bridge";
import { brand, browseCanvas, browseHeader, loupeCanvas, ratingCanvas, tagCanvas } from "../render";
import { throttle } from "../throttle";

type Mode = "browse" | "stars" | "tag" | "loupe";
type Settings = { mode?: Mode; accent?: string };

import model from "../generated/model.json";

/** Solid card grey, for the gaps around the previews and for an empty slot. */
const GREY = `data:image/svg+xml;charset=utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#232529"/></svg>')}`;
const jpeg = (data: string): string => (data ? `data:image/jpeg;base64,${data}` : GREY);
const BG = model.browseBg as Record<string, string[]>;
const TAGS = ["none", "red", "yellow", "green", "blue", "purple"];

/**
 * One dial for working through a shoot. Each mode keeps push and tap useful:
 *   browse: turn = next / previous photo, push = pick, tap = reject
 *   stars:  turn = more / fewer stars,    push = next photo, tap = clear stars
 *   tag:    turn = cycle colour tag,      push = clear tag
 *   loupe:  turn = zoom in / out,         push or tap = fit / 1:1
 */
@action({ UUID: `${brand.uuid}.browse` })
export class BrowseAction extends SingletonAction<Settings> {
	private visible = new Map<string, Action<Settings>>();
	private layouts = new Map<string, string>();

	constructor() {
		super();
		const repaint = throttle(() => this.visible.forEach((a) => void this.paint(a)));
		bridge.on("state", repaint);
		bridge.on("thumb", repaint);
	}

	override onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> | void {
		this.visible.set(ev.action.id, ev.action);
		return this.paint(ev.action);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		this.visible.delete(ev.action.id);
		this.layouts.delete(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> | void {
		return this.paint(ev.action);
	}

	override onDialRotate(ev: DialRotateEvent<Settings>): void {
		const mode = ev.payload.settings.mode ?? "browse";
		const up = ev.payload.ticks > 0;
		if (!bridge.ready(ev.action)) return;
		if (mode === "tag") {
			const i = Math.max(TAGS.indexOf(bridge.state.label), 0);
			const next = TAGS[(i + (up ? 1 : -1) + TAGS.length) % TAGS.length];
			bridge.command(next === "none" ? "noLabel" : `setlabel_${next}`);
			return;
		}
		const cmd = { browse: up ? "next" : "prev", stars: up ? "ratingUp" : "ratingDown", loupe: up ? "zoomIn" : "zoomOut" }[mode];
		for (let n = 0; n < Math.abs(ev.payload.ticks); n++) bridge.command(cmd);
	}

	override onDialDown(ev: DialDownEvent<Settings>): void {
		if (!bridge.ready(ev.action)) return;
		bridge.command({ browse: "pick", stars: "next", tag: "noLabel", loupe: "zoomToggle" }[ev.payload.settings.mode ?? "browse"]);
	}

	override onTouchTap(ev: TouchTapEvent<Settings>): void {
		if (!bridge.ready(ev.action)) return;
		const mode = ev.payload.settings.mode ?? "browse";
		if (mode === "browse") bridge.command("reject");
		else if (mode === "stars") bridge.command("rate0");
		else if (mode === "loupe") bridge.command("zoomToggle");
	}

	private async paint(a: Action<Settings>): Promise<void> {
		if (!a.isDial()) return;
		const { mode = "browse", accent } = await a.getSettings();
		const s = bridge.state;
		const color = accent ?? brand.colors.pencilYellow;
		const { p, c, n } = bridge.thumbs;
		const withPhoto = mode === "browse" && c.data !== "";
		const combo = [p, c, n].map((x) => (x.portrait ? "P" : "L")).join("");
		const layout = withPhoto ? `layouts/browse-${combo}.json` : "layouts/card.json";
		if (this.layouts.get(a.id) !== layout) {
			this.layouts.set(a.id, layout);
			await a.setFeedbackLayout(layout);
		}
		if (withPhoto) {
			await a.setFeedback({ head: browseHeader(s.flag, s.rating), prev: jpeg(p.data), cur: jpeg(c.data), next: jpeg(n.data), ...Object.fromEntries(BG[combo].map((key) => [key, GREY])) });
			return;
		}
		const canvas = { browse: browseCanvas(s.flag, s.rating), stars: ratingCanvas(s.rating, color), tag: tagCanvas(s.label), loupe: loupeCanvas(color) }[mode];
		await a.setFeedback({ canvas });
	}
}
