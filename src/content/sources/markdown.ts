/**
 * The Markdown source: maps the files in `content/` into the starter model.
 * Collections are defined in src/content.config.ts.
 */
import { markdownKit, type MarkdownEntry } from "@astronomic/content/markdown";
import { defineAdapter } from "@astronomic/content";
import { byLabelTaxonomies } from "@astronomic/theme-core/content";
import type { Guide, GuideQuery, Model, Page, Post, PostQuery, Series, Settings } from "../model";
import { compareGuides, comparePages, comparePosts, compareSeries, matchGuide } from "../rules";

/** Frontmatter `noindex: true` as the entry's SEO. */
const seoOf = (e: MarkdownEntry) => (e.data.noindex ? { noindex: true } : undefined);

/** One config: `h.terms()` and `taxonomies.list()` read the same collection. */
const md = markdownKit();

const posts = md.collection<Post, PostQuery>({
	collection: "posts",
	map: async (e, h) => ({
		slug: e.id,
		title: e.data.title,
		date: e.data.date,
		excerpt: e.data.excerpt ?? h.excerpt(e),
		image: h.image(e.data.image, e.data.imageAlt),
		body: h.richText(e),
		tags: await h.terms(e.data.tags, "tag"),
		categories: await h.terms(e.data.categories, "category"),
		author: e.data.author && {
			name: e.data.author.name,
			role: e.data.author.role,
			image: h.image(e.data.author.image, e.data.author.imageAlt ?? e.data.author.name),
		},
		ref: { source: "markdown", collection: e.collection, id: e.id },
		seo: seoOf(e),
	}),
	filter: (p, q) =>
		(!q.tag || p.tags.some((t) => t.slug === q.tag)) &&
		(!q.category || p.categories.some((t) => t.slug === q.category)),
	sort: comparePosts,
});

const pages = md.collection<Page>({
	collection: "pages",
	map: (e, h) => ({
		slug: e.id,
		title: e.data.title,
		body: h.richText(e),
		ref: { source: "markdown", collection: e.collection, id: e.id },
		seo: seoOf(e),
	}),
	sort: comparePages,
});

const series = md.collection<Series>({
	collection: "series",
	map: (e) => ({
		slug: e.id,
		title: e.data.title,
		description: e.data.description,
		ref: { source: "markdown", collection: e.collection, id: e.id },
	}),
	sort: compareSeries,
});

/**
 * A reference whose target does not exist keeps its slug, so the conformance check can report it. Astro's
 * `reference()` usually stops the build first.
 */
const slugOf = (target: { id: string } | string | undefined) => (typeof target === "string" ? target : target?.id);

const guides = md.collection<Guide, GuideQuery>({
	collection: "guides",
	map: async (e, h) => {
		const slug = slugOf(e.data.series.ref) ?? "";
		const found = await h.lookup(series, slug);
		return {
			slug: e.id,
			title: e.data.title,
			excerpt: e.data.excerpt,
			body: h.richText(e),
			series: { ref: { slug, title: found?.title ?? slug }, part: e.data.series.part },
			ref: { source: "markdown", collection: e.collection, id: e.id },
			seo: seoOf(e),
		};
	},
	filter: matchGuide,
	sort: compareGuides,
});

export default defineAdapter<Model, Settings>()({
	name: "markdown",
	collections: { posts, pages, guides, series },
	...md.site,
	// Terms A to Z by label, as every source lists them (the file keeps its own order).
	taxonomies: byLabelTaxonomies(md.site.taxonomies),
	renderers: md.renderers,
});
