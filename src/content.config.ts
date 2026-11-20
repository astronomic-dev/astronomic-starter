/**
 * Build-time content collections for the Markdown adapter.
 * Data lives in `content/` at the project root. See
 * the Markdown adapter README in @astronomic/content.
 */
import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const term = z.object({ slug: z.string(), label: z.string() });
const menuItem: z.ZodType<{ label: string; href: string; target?: string; children?: unknown[] }> = z.lazy(() =>
	z.object({
		label: z.string(),
		href: z.string(),
		target: z.string().optional(),
		children: z.array(menuItem).optional(),
	}),
);

export const collections = {
	posts: defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/posts" }),
		schema: ({ image }) =>
			z.object({
				title: z.string(),
				date: z.coerce.date(),
				excerpt: z.string().optional(),
				image: image().optional(),
				imageAlt: z.string().optional(),
				tags: z.array(z.string()).default([]),
				categories: z.array(z.string()).default([]),
				/** The writer, inline: name, role and photo. */
				author: z
					.object({ name: z.string(), role: z.string().optional(), image: image().optional(), imageAlt: z.string().optional() })
					.optional(),
				draft: z.boolean().default(false),
				/** Hide from search engines: robots noindex, left out of the sitemap and the search index. */
				noindex: z.boolean().optional(),
			}),
	}),
	pages: defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/pages" }),
		schema: z.object({
			title: z.string(),
			draft: z.boolean().default(false),
			/** Hide from search engines: robots noindex, left out of the sitemap and the search index. */
			noindex: z.boolean().optional(),
		}),
	}),
	guides: defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/guides" }),
		schema: z.object({
			title: z.string(),
			excerpt: z.string().optional(),
			/** The series (a slug of content/series/) and this guide's part in it: 1, 2, ... */
			series: z.object({ ref: reference("series"), part: z.number().int().positive() }),
			draft: z.boolean().default(false),
			/** Hide from search engines: robots noindex, left out of the sitemap and the search index. */
			noindex: z.boolean().optional(),
		}),
	}),
	/** A series names a set of guides. It has no page of its own. */
	series: defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/series" }),
		schema: z.object({
			title: z.string(),
			description: z.string().optional(),
			draft: z.boolean().default(false),
		}),
	}),
	/** One entry per taxonomy: `{ id: "category", terms: [...] }`. */
	taxonomies: defineCollection({
		loader: file("content/taxonomies.json", {
			parser: (text) => Object.entries(JSON.parse(text)).map(([id, terms]) => ({ id, terms })),
		}),
		schema: z.object({ terms: z.array(term) }),
	}),
	/** One entry per menu: `{ id: "primary", items: [...] }`. */
	menus: defineCollection({
		loader: file("content/menus.json", {
			parser: (text) => Object.entries(JSON.parse(text)).map(([id, items]) => ({ id, items })),
		}),
		schema: z.object({ items: z.array(menuItem) }),
	}),
	/** A single entry with id "site". */
	site: defineCollection({
		loader: file("content/site.json", {
			parser: (text) => [{ id: "site", ...JSON.parse(text) }],
		}),
		schema: ({ image }) =>
			z.object({
				title: z.string(),
				tagline: z.string().optional(),
				logo: image().optional(),
				logoAlt: z.string().optional(),
			}),
	}),
};
