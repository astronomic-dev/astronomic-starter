/**
 * Connect any backend. Copy this file to `src/content/sources/my-cms.ts`,
 * fill in the TODOs, then select it in astro.config.mjs:
 *
 *   const content = await contentSource("my-cms", import.meta.url);
 *
 * If it needs server output or integrations, add `my-cms.setup.mjs` next to it
 * (see `emdash.setup.mjs`). Check it with `CONTENT_SOURCE=my-cms pnpm test:adapter`.
 *
 * Rules:
 * - Map your data into the model in `src/content/model.ts`. Pages only see that.
 * - Throw on backend errors. Return `undefined` from `get` only when not found.
 * - Tag rich text with its format and register a renderer for it.
 * - Leave out `menus`, `settings`, `taxonomies`, `search` if you do not have them.
 * - Order lists by the shared rules in `src/content/rules.ts` (the content tests check them),
 *   and list taxonomy terms A to Z by label (wrap them in `byLabelTaxonomies`).
 */
import { type Collection, defineAdapter, type ListResult } from "@astronomic/content";
import TrustedHtml from "@astronomic/content/TrustedHtml.astro";
import type { Guide, GuideQuery, Model, Page, Post, PostQuery, Series, Settings } from "../model";
import { compareGuides, comparePages, comparePosts, compareSeries, matchGuide } from "../rules";

// TODO: replace with calls to your API. Sanitize HTML here if it is not trusted.
async function fetchAll<T>(_type: string): Promise<T[]> {
	return [];
}

/** In-memory collection. Push filtering, sorting and paging to your API when you can. */
function collection<E extends { slug: string }, Q>(
	type: string,
	filter: (e: E, q: Q) => boolean = () => true,
	sort: (a: E, b: E, q: Q) => number = () => 0,
): Collection<E, Q> {
	const query = async (q?: Q) => (await fetchAll<E>(type)).filter((e) => !q || filter(e, q)).sort((a, b) => sort(a, b, q ?? ({} as Q)));
	return {
		async list(q) {
			const all = await query(q);
			const offset = q?.offset ?? 0;
			const items = all.slice(offset, q?.limit ? offset + q.limit : undefined);
			return { items, total: all.length, hasMore: offset + items.length < all.length } satisfies ListResult<E>;
		},
		get: async (slug) => (await query()).find((e) => e.slug === slug),
		slugs: async (q) => (await query(q)).map((e) => e.slug),
	};
}

export default defineAdapter<Model, Settings>()({
	name: "my-cms",
	collections: {
		posts: collection<Post, PostQuery>(
			"post",
			(p, q) => (!q.tag || p.tags.some((t) => t.slug === q.tag)) && (!q.category || p.categories.some((t) => t.slug === q.category)),
			comparePosts,
		),
		pages: collection<Page, object>("page", undefined, comparePages),
		guides: collection<Guide, GuideQuery>("guide", matchGuide, compareGuides),
		series: collection<Series, object>("series", undefined, compareSeries),
	},
	// Entries use `{ format: "html", value: "<p>...</p>" }`.
	renderers: { richText: { html: TrustedHtml } },
});
