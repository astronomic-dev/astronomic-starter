/**
 * The mixed source: an example of `compose()`. Posts, pages, settings, menus
 * and taxonomies come from Markdown (`content/`); guides and their series come
 * from EmDash. A guide's series is an EmDash reference, so both collections
 * come from the same part.
 *
 * Runtime: EmDash needs its integration and server output, so `mixed.setup.mjs`
 * and `mixed.live.ts` re-export EmDash's.
 *
 * Search: neither part brings one (search is a site-level part and comes from
 * the base, which has none), so this source adds a simple one over the posts,
 * pages and guides (a series has no page of its own).
 */
import { compose, defineAdapter, from } from "@astronomic/content";
import type { ContentContext, SearchHit } from "@astronomic/content";
import { type SearchGroup, simpleSearch } from "@astronomic/theme-core/content";
import type { Model, Settings } from "../model";
import emdashSource from "./emdash";
import markdownSource from "./markdown";

const composed = compose<Model, Settings>()({
	base: markdownSource,
	parts: [from(emdashSource, ["guides", "series"])],
	expect: ["posts", "pages", "guides", "series"],
});

const SEARCHED = ["posts", "pages", "guides"] as const;
const href = (collection: string, slug: string) => (collection === "pages" ? `/${slug}` : `/${collection}/${slug}`);

/** Case-insensitive match on title and excerpt across the searched collections, in their order. */
async function search(q: string, ctx?: ContentContext): Promise<SearchHit[]> {
	if (!q.trim()) return [];
	type Item = { slug: string; title: string; excerpt?: string };
	const groups = await Promise.all(
		SEARCHED.map(async (collection): Promise<SearchGroup<Item>> => ({
			collection,
			items: (await composed.collections[collection].list(undefined, ctx)).items as Item[],
			title: (e) => e.title,
			excerpt: (e) => e.excerpt,
			href: (slug) => href(collection, slug),
			slug: (e) => e.slug,
		})),
	);
	return simpleSearch(groups, q);
}

export default defineAdapter<Model, Settings>()({ ...composed, name: "mixed", search });
