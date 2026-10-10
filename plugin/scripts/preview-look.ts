// Renders a contact sheet of keys and strip cards to judge the visual identity: npx -y tsx scripts/preview-look.ts <out.png>
import sharp from "sharp";
import { commandImage, commandsById, bankKeyImage, faderCanvas, paramsById, ratingCanvas, tagCanvas, browseCanvas, loupeCanvas, frameCanvas, wheelCanvas, sliderKeyImage, banks } from "../src/render";
const svgOf = (u: string) => decodeURIComponent(u.slice(u.indexOf(",") + 1));
const png = async (u: string, w: number, h: number) => `data:image/png;base64,${(await sharp(Buffer.from(svgOf(u)), { density: 200 }).resize(w, h).png().toBuffer()).toString("base64")}`;
const acc = (i: number) => banks[i].accent;
(async () => {
	const keys: [string, boolean, number][] = [["reject", false, 0], ["unflag", false, 0], ["pick", true, 0], ["rate3", true, 0], ["red", true, 0], ["view_loupe", false, 0], ["autoTone", false, 1], ["undo", false, 1], ["key_ba_h", false, 1], ["crop_16x9", true, 5], ["mask_subject", false, 5], ["module_develop", true, 1]];
	let body = "", x = 30;
	for (const [id, active, b] of keys) { body += `<image x="${x}" y="30" width="130" height="130" href="${await png(commandImage(commandsById.get(id), { active, accent: acc(b) }), 260, 260)}"/>`; x += 150; }
	body += `<image x="${x}" y="30" width="130" height="130" href="${await png(bankKeyImage(1, 6, "Colour", acc(3)), 260, 260)}"/>`;
	const exp = { v: 0.45, min: -5, max: 5 };
	const cards = [faderCanvas(paramsById.get("Exposure2012"), exp, acc(1)), faderCanvas(paramsById.get("Highlights2012"), { v: -40, min: -100, max: 100 }, acc(1)), ratingCanvas(3), tagCanvas("red"), browseCanvas(1), loupeCanvas(acc(0)), frameCanvas("16:9", acc(5)), wheelCanvas("Shadows", "hue", { hue: { v: 215, min: 0, max: 360 }, sat: { v: 30, min: 0, max: 100 }, lum: { v: 0, min: -100, max: 100 } }, acc(3)), wheelCanvas("Midtones", "sat", { hue: { v: 40, min: 0, max: 360 }, sat: { v: 55, min: 0, max: 100 }, lum: { v: 5, min: -100, max: 100 } }, acc(3))];
	let cx = 30; for (const c of cards) { body += `<image x="${cx}" y="190" width="${cx > 1600 ? 200 : 200}" height="100" href="${await png(c, 400, 200)}"/>`; cx += 214; if (cx > 1800) cx = 30; }
	body += `<image x="30" y="310" width="130" height="130" href="${await png(sliderKeyImage(paramsById.get("Exposure2012"), exp, 1, acc(1)), 260, 260)}"/>`;
	const W = 2060, H = 460;
	await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0e0e10"/>${body}</svg>`)).png().toFile(process.argv[2]);
	console.log("written");
})();
