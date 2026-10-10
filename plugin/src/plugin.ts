import streamDeck from "@elgato/streamdeck";

import { ApplyAction } from "./actions/apply";
import { BankAction } from "./actions/bank";
import { BrowseAction } from "./actions/browse";
import { FaderAction } from "./actions/fader";
import { FrameAction } from "./actions/frame";
import { KeyAction } from "./actions/key";
import { NudgeAction } from "./actions/nudge";
import { WheelAction } from "./actions/wheel";
import { bridge } from "./bridge";

bridge.start();
bridge.on("connection", (up: boolean) => streamDeck.logger.info(`Lightroom bridge ${up ? "connected" : "disconnected"}`));

for (const a of [new KeyAction(), new FaderAction(), new NudgeAction(), new WheelAction(), new BrowseAction(), new FrameAction(), new ApplyAction(), new BankAction()]) {
	streamDeck.actions.registerAction(a);
}
streamDeck.connect();
