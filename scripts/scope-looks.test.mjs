/** The committed src/styles/looks.scoped.css matches what scripts/scope-looks.mjs writes, and is scoped. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { looks, OUT, scopedCss } from "./scope-looks.mjs";

const committed = readFileSync(OUT, "utf8");

test("looks.scoped.css is up to date (run pnpm looks:scope)", () => {
	assert.equal(committed, scopedCss());
});

test("every look is in it, and every :root is scoped to a look", () => {
	assert.deepEqual(looks(), ["clean", "ink", "modern", "playful", "soft"]);
	for (const name of looks()) {
		assert.match(committed, new RegExp(`:root\\[data-look="${name}"\\] \\{`), `${name}: light block`);
		assert.match(committed, new RegExp(`:root\\[data-look="${name}"\\]\\[data-theme="dark"\\] \\{`), `${name}: dark block`);
		assert.match(committed, new RegExp(`:root\\[data-look="${name}"\\]:not\\(\\[data-theme="light"\\]\\) \\{`), `${name}: system dark block`);
	}
	assert.doesNotMatch(committed.replace(/\/\*[\s\S]*?\*\//g, ""), /:root(?!\[data-look=")/);
	assert.doesNotMatch(committed, /@import/);
});
