/**
 * The starter's content model. Plain types; every source maps into these.
 * Each collection declares its entry type and the queries pages may run.
 *
 * `guides` is the starter's collection beyond a blog: its own entry and query types, a reference to another
 * collection (`series`) in both sources, a sort in code (series title, part, slug) and, in the `mixed` source,
 * the part that comes from EmDash. Agency (themes/agency) proves Agency-style collections (taxonomies other than
 * the posts', featured filters) in a real theme.
 */
import type { ContentImage, EntryMeta, RichText, SiteSettings, Term } from "@astronomic/content";

export type Post = EntryMeta & {
	slug: string;
	title: string;
	date?: Date;
	/** Plain text. Sources derive it when they have none. */
	excerpt?: string;
	image?: ContentImage;
	body: RichText;
	/** Sorted by label. */
	tags: Term[];
	/** Sorted by label. */
	categories: Term[];
	/** Inline writer for the byline and AuthorBox; no authors collection. */
	author?: { name: string; role?: string; image?: ContentImage };
};

/** Default sort: newest first. */
export type PostQuery = {
	tag?: string;
	category?: string;
	sort?: "date-desc" | "date-asc" | "title";
};

export type Page = EntryMeta & {
	slug: string;
	title: string;
	body: RichText;
};

/** The series a guide belongs to: enough to name it, without loading the series entry. */
export type SeriesRef = { slug: string; title: string };

export type Series = EntryMeta & {
	slug: string;
	title: string;
	/** Plain text. */
	description?: string;
};

export type Guide = EntryMeta & {
	slug: string;
	title: string;
	/** Plain text. */
	excerpt?: string;
	body: RichText;
	/** The series and this guide's part in it (1, 2, ...). */
	series: { ref: SeriesRef; part: number };
};

/** Sort: series title, then part, then slug. */
export type GuideQuery = { series?: string };

export type Model = {
	posts: { entry: Post; query: PostQuery };
	pages: { entry: Page };
	guides: { entry: Guide; query: GuideQuery };
	series: { entry: Series };
};

export type Settings = SiteSettings;

export const DEFAULT_SETTINGS: Settings = { title: "Astronomic UI", tagline: "A fast, simple site for your product." };
