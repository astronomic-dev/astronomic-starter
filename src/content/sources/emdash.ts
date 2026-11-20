/**
 * The EmDash source: maps EmDash collections into the starter model.
 * Schema and demo content: seed/seed.json (`pnpm seed:emdash`). Setup: emdash.setup.mjs.
 *
 * EmDash has no object fields, so a post's author is three flat fields (`author_name`, `author_role`,
 * `author_image`) and a guide's part is a flat field (`series_part`) beside its `series` reference.
 * Guides are listed in memory (references cannot be filtered in EmDash 1.1), by the same rules as the Markdown
 * source.
 */
import { emdashCollection, emdashComponents, emdashHooks, emdashRenderers, emdashSite, type EmDashHelpers } from "@astronomic/content/emdash";
import { defineAdapter } from "@astronomic/content";
import { byLabelTaxonomies } from "@astronomic/theme-core/content";
import type { Guide, GuideQuery, Model, Page, Post, PostQuery, Series, Settings } from "../model";
import { compareGuides, comparePages, compareSeries, matchGuide } from "../rules";

/** Text or undefined: EmDash stores empty fields as "" or null. */
const text = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** A post's inline author: none without a name. */
function authorOf(data: Record<string, unknown>, h: EmDashHelpers): Post["author"] {
	const name = text(data.author_name);
	return name ? { name, role: text(data.author_role), image: h.image(data.author_image) } : undefined;
}

const posts = emdashCollection<Post, PostQuery>({
	collection: "posts",
	taxonomies: ["tag", "category"],
	where: (q) => ({ tag: q.tag, category: q.category }),
	// Paged by EmDash; the slug breaks ties, as in the other sources. The `title`
	// and `date-asc` orders come from SQL, so SQLite's collation (case, accents)
	// and its NULLs-first ascending order can differ from theme-core's byText and
	// ascLast (src/content/rules.ts): a title starting in lowercase, for example,
	// would show as a sort order problem in the content tests' conformance check.
	orderBy: (q): Record<string, "asc" | "desc"> =>
		q.sort === "title" ? { title: "asc", slug: "asc" } : { published_at: q.sort === "date-asc" ? "asc" : "desc", slug: "asc" },
	map: async (e, h) => ({
		slug: e.id,
		title: e.data.title ?? e.id,
		date: e.data.publishedAt ?? undefined,
		excerpt: e.data.excerpt?.trim() || h.excerpt(e.data.content),
		image: h.image(e.data.featured_image),
		body: h.richText(e.data.content),
		tags: h.terms("tag"),
		categories: h.terms("category"),
		author: authorOf(e.data, h),
		ref: h.ref(),
		edit: h.edit({ title: "title", excerpt: "excerpt", image: "featured_image", body: "content" }),
		seo: await h.seo(),
	}),
});

const pages = emdashCollection<Page>({
	collection: "pages",
	// Sorted in code with the shared rule (the database's collation may order text differently).
	sort: comparePages,
	map: async (e, h) => ({
		slug: e.id,
		title: e.data.title ?? e.id,
		body: h.richText(e.data.content),
		ref: h.ref(),
		edit: h.edit({ title: "title", body: "content" }),
		seo: await h.seo(),
	}),
});

const series = emdashCollection<Series>({
	collection: "series",
	sort: compareSeries,
	map: (e, h) => ({
		slug: e.id,
		title: text(e.data.title) ?? e.id,
		description: text(e.data.description),
		ref: h.ref(),
		edit: h.edit({ title: "title", description: "description" }),
	}),
});

const guides = emdashCollection<Guide, GuideQuery>({
	collection: "guides",
	references: ["series"],
	filter: matchGuide,
	sort: compareGuides,
	map: async (e, h) => {
		const s = h.reference("series");
		return {
			slug: e.id,
			title: text(e.data.title) ?? e.id,
			excerpt: text(e.data.excerpt),
			body: h.richText(e.data.content),
			// A guide with no series or part maps to an empty one, which the conformance check reports.
			series: { ref: s ? { slug: s.id, title: text(s.data.title) ?? s.id } : { slug: "", title: "" }, part: num(e.data.series_part) ?? 0 },
			ref: h.ref(),
			edit: h.edit({ title: "title", excerpt: "excerpt", body: "content" }),
			seo: await h.seo(),
		};
	},
});

const site = emdashSite({
	search: {
		// A series has no page of its own, so it is not searched.
		collections: ["posts", "pages", "guides"],
		href: (collection, slug) => (collection === "pages" ? `/${slug}` : `/${collection}/${slug}`),
	},
});

export default defineAdapter<Model, Settings>()({
	name: "emdash",
	collections: { posts, pages, guides, series },
	...site,
	// Terms A to Z by label with theme-core's text order, not the database's collation.
	taxonomies: byLabelTaxonomies(site.taxonomies),
	renderers: emdashRenderers,
	hooks: emdashHooks,
	components: emdashComponents,
});
