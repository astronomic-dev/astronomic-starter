/**
 * Keeps a visitor's details away from a placeholder address. example.com is a real server, so the sample forms must never
 * post to it. On a site that is not live, a form only pretends: it "posts" to a data URL and says so. On a live site or a
 * production server, no form renders on a placeholder address, and no email shows on one: /contact shows what is left, or
 * says the site is still being set up, and /posts has no sign-up.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { forms } from "../site";

/** A URL's host. A relative action resolves on a stand-in base, so `//example.com/x` counts as example.com and `/x` as the site's own. */
const hostOf = (value: string) => {
	try {
		return new URL(value, "https://site.invalid").hostname;
	} catch {
		return "";
	}
};

/** True for example.com, example.org and example.net with their subdomains, and for anything on the `.example` top-level domain, with or without the root's trailing dot. */
export const placeholderHost = (host: string) => /(^|\.)example(\.(com|org|net))?\.?$/i.test(host);

/** True for a URL on a placeholder host. */
export const isPlaceholderUrl = (value: string) => placeholderHost(hostOf(value));

/** True for an email address on a placeholder host, such as `name@example.com`. */
export const isPlaceholderEmail = (value: string) => placeholderHost(value.trim().split("@").at(-1) ?? "");

/** True on a server build's server. Not in `astro dev`, and not in a static build. */
const onProductionServer = () => !import.meta.env.DEV && import.meta.env.CONTENT_OUTPUT !== "static";

/**
 * True in the hosted demo's copy: only it has the demo-brand folder (the release leaves it out of every other copy). The
 * demo is sample content at a real address, on purpose.
 */
export const hostedDemo = (root = process.cwd()) => existsSync(join(root, "src/demo-brand"));

/** True for an address where the site is really being put live: not a placeholder (SITE_URL not set), and not this machine. */
const isRealOrigin = (origin: string) => {
	try {
		const { hostname } = new URL(origin);
		return !placeholderHost(hostname) && !["localhost", "127.0.0.1", "[::1]"].includes(hostname);
	} catch {
		return false;
	}
};

/**
 * True for a site that is really live: not the hosted demo, and at a real address. A production server counts whatever
 * its address says: it may not know it (no SITE_URL, behind a proxy), and a real visitor's message must never be dropped
 * as a demo's.
 */
export const siteIsLive = (origin: string) => !hostedDemo() && (onProductionServer() || isRealOrigin(origin));

/** What the page's form needs. A demo form adds the script's sending and the demo's words. */
export type FormSending = { action: string; enhance?: "fetch"; successText?: string };

/**
 * What a form's sending needs. A demo form "posts" to a data URL: the kit's script gets a JSON answer in the browser and
 * takes its success path (the form reset, the demo's words in the status), and no request leaves the page. With no script
 * nothing is sent either: some browsers stay on the page, and some open the data URL, whose body holds the same words.
 * Any other form is left as it is.
 */
export const formSending = (action: string, live: boolean): FormSending =>
	!live && isPlaceholderUrl(action) ? { action: `data:application/json,${encodeURIComponent(JSON.stringify({ note: forms.demoSent }))}`, enhance: "fetch", successText: forms.demoSent } : { action };

/** The addresses named so far, so a page load does not repeat the line. */
const warned = new Set<string>();

/**
 * The email a page may show, or nothing: a placeholder email on a live site, which also gets one line in the log.
 * `setting` names it in that line.
 */
export function siteEmail(setting: string, email: string, origin: string, warn: (text: string) => void = console.warn): string | undefined {
	if (!siteIsLive(origin) || !isPlaceholderEmail(email)) return email;
	if (!warned.has(email)) {
		warned.add(email);
		warn(`Starter setup: ${setting} in src/site.ts is on a placeholder address (${email}), so this live site leaves it out. Set a real address.`);
	}
	return undefined;
}

/**
 * The form a page may draw, or nothing: a placeholder action on a live site, which also gets one line in the log.
 * `setting` names it in that line.
 */
export function siteForm(setting: string, action: string, origin: string, warn: (text: string) => void = console.warn): FormSending | undefined {
	const live = siteIsLive(origin);
	if (!live || !isPlaceholderUrl(action)) return formSending(action, live);
	if (!warned.has(action)) {
		warned.add(action);
		warn(`Starter setup: ${setting} in src/site.ts posts to a placeholder address (${action}), so this live site leaves that form out. Set a real address.`);
	}
	return undefined;
}
