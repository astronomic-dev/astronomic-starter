/** The starter's conformance options: model field checks and queries to try. */
import type { CheckOptions } from "@astronomic/content";
import { body, fields, nonEmpty, optImage, optStr, sortedTerms } from "@astronomic/theme-core/conformance";
import { byText } from "@astronomic/theme-core/content";
import type { Guide } from "./model";

// The starter's rules: a required string (title, term slug and label) is not
// empty, an image may be missing (the model has `image?`), and terms sort by
// label in theme-core's text order.
const str = nonEmpty;
const isImage = optImage;
const terms = sortedTerms({ str: nonEmpty, compare: byText });

/** A post's inline author: none, or a name with an optional role and photo. */
const author = (v: unknown) => {
	if (v === undefined) return true;
	const a = v as Record<string, unknown>;
	return nonEmpty(a.name) && optStr(a.role) && optImage(a.image);
};

/** A guide's series: a slug and a title, and a whole part number from 1. */
const seriesPart = (v: unknown) => {
	const s = v as { ref?: Record<string, unknown>; part?: unknown } | undefined;
	return nonEmpty(s?.ref?.slug) && nonEmpty(s?.ref?.title) && Number.isInteger(s?.part) && (s?.part as number) > 0;
};

export const checks: CheckOptions = {
	// Every model collection must exist on the selected source.
	expect: ["posts", "pages", "guides", "series"],
	collections: {
		posts: {
			validate: (e) =>
				fields(e, {
					title: str,
					date: (v) => v === undefined || v instanceof Date,
					excerpt: optStr,
					image: isImage,
					body,
					tags: terms,
					categories: terms,
					author,
				}),
			queries: [{ tag: "tips" }, { category: "design" }],
		},
		pages: { validate: (e) => fields(e, { title: str, body }) },
		guides: {
			validate: (e) => fields(e, { title: str, excerpt: optStr, body, series: seriesPart }),
			queries: [{ series: "getting-started" }],
		},
		series: { validate: (e) => fields(e, { title: str, description: optStr }) },
	},
	taxonomies: ["tag", "category"],
	menus: ["primary"],
};

/** First-level routes the site owns: its pages, its share cards (og) and its site files (feed, sitemap, robots). A page with one of these slugs would never be reachable. */
export const SITE_ROUTES = ["posts", "guides", "category", "tag", "search", "404", "og", "rss.xml", "sitemap.xml", "robots.txt"];

/** Every guide's series exists, and no two guides share a part in one series. */
export function guideProblems(guides: Guide[], series: { slug: string }[]): string[] {
	const problems: string[] = [];
	const known = new Set(series.map((s) => s.slug));
	const parts = new Map<string, string>();
	for (const g of guides) {
		const { ref, part } = g.series;
		if (!known.has(ref.slug)) problems.push(`guide "${g.slug}": no series "${ref.slug}"`);
		const key = `${ref.slug}#${part}`;
		const other = parts.get(key);
		if (other) problems.push(`series "${ref.slug}": part ${part} is both "${other}" and "${g.slug}"`);
		parts.set(key, g.slug);
	}
	return problems;
}
