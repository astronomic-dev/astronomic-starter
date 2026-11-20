#!/usr/bin/env node
/**
 * `pnpm seed:emdash [--reset]`
 *
 * Loads seed/seed.json (the EmDash schema and demo content) into ./data.db, with the demo photos, then sets each
 * post's publish date from seed/dates.json (`{ slug: ISO time }`). An EmDash seed publishes every entry at the time
 * it runs, and the Markdown posts in content/ have fixed dates: the content tests compare the two sources, dates
 * included.
 *
 * The demo photos live in content/media/ (shared with the Markdown source), and an EmDash seed only downloads
 * `$media` from public URLs, so seed.json holds ready media values that point at `uploads/demo/...`. The script:
 *   1. copies content/media/** to uploads/demo/** (the storage keys seed.json uses),
 *   2. runs `emdash seed seed/seed.json`,
 *   3. adds each demo photo to the media library,
 *   4. sets the posts' publish dates.
 *
 * --reset deletes data.db and uploads/demo first. Without it, the script stops if data.db exists.
 *
 * Steps 3 and 4 write EmDash's internal tables directly: `media`, and `published_at` and `created_at` in
 * `ec_posts`. Written for EmDash 1.1.0, checked against 1.4.0; check this file when you upgrade EmDash. Needs Node 22.5+ (`node:sqlite`).
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const db = join(cwd, "data.db");
const uploads = join(cwd, "uploads");

if (existsSync(db)) {
	if (!process.argv.includes("--reset")) {
		console.error("data.db exists. Run with --reset to replace it (this deletes its content).");
		process.exit(1);
	}
	for (const suffix of ["", "-wal", "-shm"]) rmSync(`${db}${suffix}`, { force: true });
	rmSync(join(uploads, "demo"), { recursive: true, force: true });
}

// 1. Demo photos, at the storage keys seed.json uses ("demo/<path under content/media>").
cpSync(join(cwd, "content/media"), join(uploads, "demo"), { recursive: true, filter: (src) => !src.endsWith(".md") });

// 2. Schema and content.
const seeded = spawnSync(join(cwd, "node_modules/.bin/emdash"), ["seed", "seed/seed.json", "--database", db, "--uploads-dir", uploads], { cwd, stdio: "inherit" });
if (seeded.status !== 0) {
	console.error(`emdash seed failed (exit ${seeded.status ?? "signal"}).`);
	process.exit(1);
}

// 3. Media library rows for the photos the content uses; 4. publish dates.
const seed = JSON.parse(readFileSync(join(cwd, "seed/seed.json"), "utf8"));
const media = new Map();
(function walk(value) {
	if (Array.isArray(value)) return value.forEach(walk);
	if (!value || typeof value !== "object") return;
	if (value.provider === "local" && typeof value.meta?.storageKey === "string") media.set(value.id, value);
	Object.values(value).forEach(walk);
})(seed.content);
const dates = JSON.parse(readFileSync(join(cwd, "seed/dates.json"), "utf8"));
const sqlite = new DatabaseSync(db);
try {
	const insert = sqlite.prepare(
		`INSERT OR IGNORE INTO media (id, filename, mime_type, size, width, height, alt, storage_key, status, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?)`,
	);
	const now = new Date().toISOString();
	for (const m of media.values()) {
		const file = join(uploads, m.meta.storageKey);
		if (!existsSync(file)) throw new Error(`Missing demo photo: ${m.meta.storageKey}`);
		insert.run(m.id, m.filename, m.mimeType, statSync(file).size, m.width ?? null, m.height ?? null, m.alt ?? null, m.meta.storageKey, now);
	}
	const setDate = sqlite.prepare("UPDATE ec_posts SET published_at = ?, created_at = ? WHERE slug = ?");
	for (const [slug, date] of Object.entries(dates)) {
		if (Number.isNaN(Date.parse(date))) throw new Error(`seed/dates.json: "${slug}": "${date}" is not a time`);
		if (setDate.run(date, date, slug).changes !== 1) throw new Error(`seed/dates.json: no post "${slug}" after seeding`);
	}
} catch (err) {
	console.error(err.message);
	process.exit(1);
} finally {
	sqlite.close();
}
console.log(`\nDemo photos: ${media.size}. Publish dates: ${Object.keys(dates).length}.`);
