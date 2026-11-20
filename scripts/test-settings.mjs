#!/usr/bin/env node
/**
 * `pnpm test:settings [case ...]` (default: every case): real builds per setting (theme-core's settings.mjs).
 *
 *  1. mode-switch: the case turns the switch on itself (`modeSwitch = true` in src/theme.look.ts for the build, then
 *     put back). Every page has the light and dark switch in the navbar, a second in the phone menu's panel (shown
 *     below 375px in place of the bar's), and the no-flash script first in <head>.
 *  2. no-mode-switch: `modeSwitch = false` in src/theme.look.ts (changed for the build, then put back). No switch
 *     and no mode script on any page.
 *  3. mode-switch-missing: no `modeSwitch` in src/theme.look.ts at all (a file from before the setting; the line is
 *     taken out for the build, whatever its value, then put back). It counts as on: every page as in case 1.
 *
 * The two forms on a placeholder address (src/utils/placeholders.ts). Each case but the hosted demo's stands for a copy
 * someone downloaded: it moves src/demo-brand aside for the run, as the release leaves it out.
 *
 *  4. demo-form: SITE_URL not set. Demo forms, which send no request, script or no script (the browser check needs the
 *     repo's Playwright; a downloaded copy checks the page only).
 *  5. hosted-demo: the demo-brand folder at a real address. Demo forms.
 *  6. live-no-form: a real address. No form on a placeholder action and no placeholder email: /contact says it is still
 *     being set up, no sign-up on /posts. With a real email: that email on /contact.
 *  7. live-real-action: a real address and real actions. The forms, as they are, with no placeholder email beside them.
 *  8. emdash-server: an EmDash production server. On a placeholder action, no form with no address or a real one, and
 *     one line in the log for each form; a real action is left as it is; with the demo-brand folder, demo forms. It reads
 *     a copy of ./data.db (`pnpm seed:emdash`), and a downloaded copy with no data.db skips it and says so.
 *
 * Serves each build on port 4399 (CONTENT_TEST_PORT sets another). The cases change the `forms` addresses in src/site.ts
 * for their builds, with a backup beside it, and put it and the folder back on success, failure, Ctrl-C and SIGTERM. Do
 * not build in this folder while it runs.
 */
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { createHarness, text } from "@astronomic/theme-core/scripts/harness.mjs";
import { modeSwitchCases, runSettings } from "@astronomic/theme-core/scripts/settings.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const paths = ["/", "/posts", "/posts/welcome", "/about", "/search"];

const cases = modeSwitchCases({ on: {}, off: {}, paths, inMenu: 1 });
cases["mode-switch-missing"] = { modeSwitch: null, check: cases["mode-switch"].check };

// ---------------------------------------------------------------------------
// The forms on a placeholder address

const PLACEHOLDER = { contact: "https://example.com/contact-form", newsletter: "https://example.com/newsletter/subscribe" };
const REAL = { contact: "https://forms.starter.test/contact", newsletter: "https://news.starter.test/subscribe" };
const REAL_SITE = "https://starter.test";
const REAL_EMAIL = ["hello", "starter.test"].join("@");
const DEMO_WORDS = "This is a demo, so nothing was sent.";
const NO_CHANNEL = "We are still setting up our email and contact form.";
const LOG_LINES = ["forms.contact in src/site.ts posts to a placeholder address", "forms.newsletter in src/site.ts posts to a placeholder address", "contact.email in src/site.ts is on a placeholder address"];

const h = createHarness({ root });
const siteFile = join(root, "src/site.ts");
const siteBackup = `${siteFile}.test-settings-forms-backup`;
const marker = join(root, "src/demo-brand");
const markerAside = join(root, "src/demo-brand.test-settings-aside");
/** The repo has the folder, and a downloaded copy does not. */
const inRepo = existsSync(marker) || existsSync(markerAside);

const restoreSite = () => {
	if (!existsSync(siteBackup)) return;
	copyFileSync(siteBackup, siteFile);
	rmSync(siteBackup, { force: true });
};
const restoreMarker = () => {
	if (existsSync(markerAside)) renameSync(markerAside, marker);
};
const downloadedCopy = () => {
	if (existsSync(marker)) renameSync(marker, markerAside);
};
/** Sets the two forms' addresses in src/site.ts for a build, whatever they are now. */
function setForms({ contact, newsletter }) {
	if (!existsSync(siteBackup)) copyFileSync(siteFile, siteBackup);
	const from = readFileSync(siteBackup, "utf8");
	const to = from.replace(/(\bnewsletter: \{ action: )"[^"]*"/, `$1"${newsletter}"`).replace(/(\bcontact: \{ action: )"[^"]*"/, `$1"${contact}"`);
	if (!to.includes(contact) || !to.includes(newsletter)) throw new Error("src/site.ts: the forms' addresses are not where this test looks");
	writeFileSync(siteFile, to);
}
/** Sets the contact email in src/site.ts for a build, over the forms' addresses of setForms. */
function setEmail(email) {
	const from = readFileSync(siteFile, "utf8");
	const to = from.replace(/(\n\temail: )"[^"]*"/, `$1"${email}"`);
	if (!to.includes(`email: "${email}"`)) throw new Error("src/site.ts: the contact email is not where this test looks");
	writeFileSync(siteFile, to);
}

const servers = new Set();
const stopServers = () => {
	for (const child of servers) child.kill("SIGKILL");
	servers.clear();
};
let tempDb;
process.on("exit", () => {
	stopServers();
	restoreSite();
	restoreMarker();
	if (tempDb) rmSync(tempDb, { recursive: true, force: true });
});

/** The forms that post away from the header's and the search page's own. */
const postForms = (html) => [...html.matchAll(/<form\b[^>]*>/g)].map((m) => m[0]).filter((tag) => !/\saction="\/search"/.test(tag));

/** Demo forms: a data URL, and no page names the placeholder address. */
async function demoFormProblems() {
	const problems = [];
	for (const [path, action] of [["/contact", PLACEHOLDER.contact], ["/posts", PLACEHOLDER.newsletter]]) {
		const { status, html } = await h.get(path);
		if (status !== 200) problems.push(`${path} answers ${status}`);
		const tags = postForms(html);
		if (tags.length !== 1 || !/\saction="data:/.test(tags[0])) problems.push(`${path}: expected one form on a data URL: ${tags.join(" ") || "none"}`);
		if (html.includes(action)) problems.push(`${path}: the page names ${action}`);
	}
	if (!(await h.get("/contact")).html.includes("mailto:hello@example.com")) problems.push("/contact: a demo lost its sample email");
	return problems;
}

/** No form on a live site and no placeholder email: /contact says it is still being set up, nothing on /posts, and no demo words. */
async function noFormProblems() {
	const problems = [];
	for (const path of ["/contact", "/posts"]) {
		const { status, html } = await h.get(path);
		if (status !== 200) problems.push(`${path} answers ${status}`);
		const tags = postForms(html);
		if (tags.length) problems.push(`${path}: a form on a live site: ${tags.join(" ")}`);
		if (/<input\b[^>]*type="email"/.test(html)) problems.push(`${path}: an email field on a live site`);
		if (text(html).includes(DEMO_WORDS)) problems.push(`${path}: a live site says it is a demo`);
	}
	const contact = (await h.get("/contact")).html;
	if (/mailto:|@example\.com/.test(contact)) problems.push("/contact: a live site shows a placeholder email");
	if (!text(contact).includes(NO_CHANNEL)) problems.push("/contact: with no form and no email, the page does not say it is still being set up");
	return problems;
}

/** Real actions, left as they are, and no demo. */
async function realFormProblems() {
	const problems = [];
	for (const [path, action] of [["/contact", REAL.contact], ["/posts", REAL.newsletter]]) {
		const { html } = await h.get(path);
		const tags = postForms(html);
		if (tags.length !== 1 || !tags[0].includes(`action="${action}"`)) problems.push(`${path}: expected one form posting to ${action}: ${tags.join(" ") || "none"}`);
		else if (/data-enhance/.test(tags[0])) problems.push(`${path}: a real form is enhanced`);
		if (text(html).includes(DEMO_WORDS)) problems.push(`${path}: a real form says it is a demo`);
	}
	const contact = (await h.get("/contact")).html;
	if (/mailto:|hello@example\.com/.test(contact)) problems.push("/contact: a real form with a placeholder email beside it");
	if (text(contact).includes(NO_CHANNEL)) problems.push("/contact: a real form, and the page says it is still being set up");
	return problems;
}

/** Sends each demo form in a browser: its words show, it resets, and no request leaves the page, script or no script. */
async function browserProblems() {
	const problems = [];
	const require = createRequire(join(root, "../../tooling/package.json"));
	const { chromium } = require("@playwright/test");
	const browser = await chromium.launch();
	try {
		for (const javaScriptEnabled of [true, false]) {
			for (const path of ["/contact", "/posts"]) {
				const label = `${path}, ${javaScriptEnabled ? "script" : "no script"}`;
				const context = await browser.newContext({ javaScriptEnabled });
				const page = await context.newPage();
				const sent = [];
				page.on("request", (request) => {
					if (!request.url().startsWith("data:") && (request.method() === "POST" || !request.url().startsWith(h.base))) sent.push(request.url());
				});
				await page.goto(`${h.base}${path}`, { waitUntil: "load" });
				const form = page.locator('form:has(input[name="email"])');
				for (const [name, value] of [['input[name="name"]', "Sample Name"], ['input[name="email"]', "name@example.com"], ['textarea[name="message"]', "A sample message."]]) {
					if (await form.locator(name).count()) await form.locator(name).fill(value);
				}
				// A browser refuses the data URL with no script, so a wait for a navigation would never end.
				await form.locator('button[type="submit"]').click({ noWaitAfter: true });
				if (javaScriptEnabled) {
					const status = form.locator('[data-form-status][data-state="success"]');
					const shown = await status.waitFor({ timeout: 4000 }).then(
						() => true,
						() => false,
					);
					if (!shown || !(await status.innerText()).includes(DEMO_WORDS)) problems.push(`${label}: the demo form does not say it is a demo`);
					if ((await form.locator('input[name="email"]').inputValue()) !== "") problems.push(`${label}: the demo form does not reset`);
				} else {
					await page.waitForTimeout(500);
					if (page.url().replace(/\/$/, "") !== `${h.base}${path}`) problems.push(`${label}: the demo form left the page (${page.url()})`);
					if (!(await page.locator("main").innerText()).includes(DEMO_WORDS)) problems.push(`${label}: the page does not say the form is a demo`);
				}
				if (sent.length) problems.push(`${label}: the demo form sent a request: ${sent.join(" ")}`);
				await context.close();
			}
		}
	} finally {
		await browser.close();
	}
	return problems;
}

/** Builds the Markdown source, serves it and runs `check`. */
async function staticCase(name, env, check) {
	const dir = h.tempDir(`dist-settings-${name}`);
	if ((await h.build(dir, { source: "markdown", env: { SITE_URL: "", ...env } })) !== 0) return ["the build failed"];
	const server = await h.serve(dir);
	try {
		return await check();
	} finally {
		server.stop();
		rmSync(dir, { recursive: true, force: true });
	}
}

/** Runs the built EmDash server with this env, runs `check(log)` and stops it. */
async function onServer(dir, env, check) {
	const log = { text: "" };
	const child = spawn(process.execPath, [join(dir, "server/entry.mjs")], {
		cwd: root,
		env: { ...process.env, CONTENT_SOURCE: "emdash", PORT: String(h.port), HOST: "127.0.0.1", ...env },
		stdio: ["ignore", "pipe", "pipe"],
	});
	servers.add(child);
	const exited = new Promise((resolve) => child.once("exit", resolve));
	for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => (log.text += chunk));
	try {
		for (let i = 0; ; i++) {
			try {
				await fetch(h.base);
				break;
			} catch {
				if (i >= 120) return [`the server did not start\n${log.text.slice(-2000)}`];
				await new Promise((r) => setTimeout(r, 250));
			}
		}
		return await check(log);
	} finally {
		child.kill("SIGKILL");
		servers.delete(child);
		await exited;
	}
}

const placeholderCases = {
	async "demo-form"() {
		downloadedCopy();
		setForms(PLACEHOLDER);
		return staticCase("demo-form", {}, async () => [...(await demoFormProblems()), ...(inRepo ? await browserProblems() : [])]);
	},
	async "hosted-demo"() {
		if (!inRepo) return console.log("skipped: a downloaded copy has no hosted demo folder"), [];
		restoreMarker();
		setForms(PLACEHOLDER);
		return staticCase("hosted-demo", { SITE_URL: REAL_SITE }, demoFormProblems);
	},
	async "live-no-form"() {
		downloadedCopy();
		setForms(PLACEHOLDER);
		const problems = await staticCase("live-no-form", { SITE_URL: REAL_SITE }, noFormProblems);
		setEmail(REAL_EMAIL);
		problems.push(
			...(await staticCase("live-real-email", { SITE_URL: REAL_SITE }, async () => {
				const contact = (await h.get("/contact")).html;
				const out = [];
				if (postForms(contact).length) out.push("/contact: a form on a placeholder address");
				if (!contact.includes(`mailto:${REAL_EMAIL}`)) out.push("/contact: a real email is gone");
				if (text(contact).includes(NO_CHANNEL)) out.push("/contact: a real email, and the page says it is still being set up");
				return out;
			})),
		);
		return problems;
	},
	async "live-real-action"() {
		downloadedCopy();
		setForms(REAL);
		return staticCase("live-real-action", { SITE_URL: REAL_SITE }, realFormProblems);
	},
	async "emdash-server"() {
		const source = join(root, "data.db");
		if (!existsSync(source)) {
			if (!inRepo) return console.log("skipped: no data.db (run pnpm seed:emdash to check the EmDash server)"), [];
			return ["no data.db: run pnpm seed:emdash"];
		}
		tempDb = mkdtempSync(join(tmpdir(), "starter-settings-db-"));
		const file = join(tempDb, "data.db");
		const from = new DatabaseSync(source, { readOnly: true });
		from.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`);
		from.close();
		const database = { EMDASH_DATABASE_URL: `file:${file}` };
		const noAddress = { ...database, SITE_URL: "", EMDASH_SITE_URL: "" };
		const atRealSite = { ...database, SITE_URL: REAL_SITE, EMDASH_SITE_URL: "" };
		const dir = h.tempDir("dist-settings-emdash-server");
		const problems = [];
		downloadedCopy();
		setForms(PLACEHOLDER);
		if ((await h.build(dir, { source: "emdash", env: noAddress })) !== 0) return ["the build failed"];
		// No address at all: a live server may not know its own, and it must still draw no form.
		problems.push(
			...(await onServer(dir, noAddress, async (log) => {
				const out = await noFormProblems();
				await h.get("/contact");
				for (const line of LOG_LINES) if (log.text.split(line).length !== 2) out.push(`the server's log has "${line}" ${log.text.split(line).length - 1} times, expected once`);
				return out;
			})),
		);
		problems.push(...(await onServer(dir, atRealSite, noFormProblems)));
		if (inRepo) {
			restoreMarker();
			problems.push(...(await onServer(dir, atRealSite, demoFormProblems)));
			downloadedCopy();
		}
		setForms(REAL);
		if ((await h.build(dir, { source: "emdash", env: noAddress })) !== 0) return [...problems, "the build failed"];
		problems.push(...(await onServer(dir, atRealSite, realFormProblems)));
		rmSync(dir, { recursive: true, force: true });
		return problems;
	},
};

// ---------------------------------------------------------------------------
// The run

const asked = process.argv.slice(2);
const unknown = asked.filter((name) => !(name in cases) && !(name in placeholderCases));
if (unknown.length) {
	console.error(`Unknown case(s): ${unknown.join(", ")}. Cases: ${[...Object.keys(cases), ...Object.keys(placeholderCases)].join(", ")}`);
	process.exit(1);
}
for (const left of [siteBackup, markerAside]) {
	if (!existsSync(left)) continue;
	console.error(`FAIL: ${left} is there (a run was stopped hard). Put it back by hand, then run again.`);
	process.exit(1);
}

const askedMode = asked.filter((name) => name in cases);
if (!asked.length || askedMode.length) {
	process.argv.splice(2, process.argv.length, ...askedMode);
	await runSettings({ root, cases });
}

const failures = [];
for (const name of asked.length ? asked.filter((n) => n in placeholderCases) : Object.keys(placeholderCases)) {
	console.log(`\n--- ${name}`);
	let problems;
	try {
		problems = await placeholderCases[name]();
	} catch (err) {
		problems = [err.message];
	} finally {
		stopServers();
		restoreSite();
		restoreMarker();
	}
	if (problems.length) failures.push(name);
	console.log(problems.length ? `FAIL  ${name}\n      ${problems.join("\n      ")}` : `ok    ${name}`);
}
h.cleanup();
if (failures.length) {
	console.log(`\nFAIL  ${failures.length} case(s): ${failures.join("; ")}`);
	process.exitCode = 1;
} else if (!process.exitCode) {
	console.log("\nOK");
}
