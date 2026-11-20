/**
 * The starter's sort rules, on theme-core's helpers. Every source imports
 * these, so all of them order lists the same way, and the conformance route
 * tests against the same code.
 */
import { ascLast, byText, compareByTitle, descLast } from "@astronomic/theme-core/content";
import type { Guide, GuideQuery, Post, PostQuery } from "./model";

/** Pages: title, then slug. */
export const comparePages = compareByTitle;

const time = (d?: Date) => d?.getTime();

/** Posts: `date-desc` (default), `date-asc` (undated last either way) or `title`; then slug. */
export function comparePosts(a: Post, b: Post, q: PostQuery = {}): number {
	const first =
		q.sort === "title" ? byText(a.title, b.title) : q.sort === "date-asc" ? ascLast(time(a.date), time(b.date)) : descLast(time(a.date), time(b.date));
	return first || byText(a.slug, b.slug);
}

/** Series: title, then slug. */
export const compareSeries = compareByTitle;

/** Guides: series title, then part, then slug. */
export const compareGuides = (a: Guide, b: Guide) =>
	byText(a.series.ref.title, b.series.ref.title) || a.series.part - b.series.part || byText(a.slug, b.slug);

/** True when the guide is in the series the query names (or the query names none). */
export const matchGuide = (g: Guide, q: GuideQuery) => !q.series || g.series.ref.slug === q.series;
