/**
 * The starter's share card: theme-core's look-free card (label, title, site
 * name) in the kit's light colors and Geist. Used by
 * src/pages/og/[...path]/card.png.ts; build time or server only.
 */
import { cardTree, fontFromDataUrl, type ShareCard, type ShareFont, type ShareLook } from "@astronomic/theme-core/share";
import type { PublicPage } from "./utils/public-pages";
// satori reads WOFF, TTF and OTF, not WOFF2. Geist 600 from @fontsource/geist 5.3.0
// (files/geist-latin-600-normal.woff; OFL, see OFL.txt). One weight: satori uses the nearest.
import geist from "./assets/fonts/geist-latin-600.woff?inline";

/**
 * The kit's light tokens from @astronomic/ui/tokens.css (an image cannot read CSS variables). If you change a token
 * or add a preset, change these too; the content tests check them against tokens.css.
 */
const colors: ShareLook["colors"] = {
	bg: "#ffffff", // --ui-bg
	fg: "#171717", // --ui-fg
	muted: "#666666", // --ui-muted
	accent: "#171717", // --ui-accent
};

export const fonts: ShareFont[] = [{ name: "Geist", data: fontFromDataUrl(geist), weight: 600, style: "normal" }];

/** The card's public input for one page, and the look. No label when it would repeat the title or the site name. */
export function cardInput(page: PublicPage, siteName: string): { card: ShareCard; look: ShareLook } {
	const label = page.label && page.label !== page.title && page.label !== siteName ? page.label : undefined;
	return { card: { title: page.title, label, siteName }, look: { colors, fontFamily: "Geist" } };
}

/** The card tree for one public page. */
export function card(page: PublicPage, siteName: string) {
	const { card, look } = cardInput(page, siteName);
	return cardTree(card, look);
}
