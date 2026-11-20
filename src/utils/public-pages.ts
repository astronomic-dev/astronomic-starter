/**
 * The site's public pages, for the sitemap and the share cards: every
 * page a search engine should find, in a fixed order. Anonymous: it reads the
 * content with no request, so it never depends on who asks.
 *
 * Listed: the fixed pages, each post, guide and page, and each category and
 * tag (page 1, empty terms too, as the site builds them). Left out: search,
 * 404, entries with `seo.noindex`, a term whose every entry has it, and paged
 * pages. Entries pass through `view` (today every entry as it is).
 */
import { isShown as shownBy, shownEntries, listedPages, type PublicView } from "@astronomic/theme-core/feeds";
import { publicOrigin } from "@astronomic/theme-core/seo";
import type { Term } from "@astronomic/content";
import type { APIContext } from "astro";
import { useContent, type Guide, type Page, type Post } from "~/content";

export type PublicPage = {
	path: string;
	/** The share card's title: the page's title; on the home page the site's tagline (else the site name). */
	title: string;
	/** The kind shown on the share card (the collection or taxonomy); none on the fixed pages. */
	label?: string;
	lastmod?: Date;
	/** True when the page gets a made share card. */
	card: boolean;
};

type Entry = Post | Page | Guide;

export async function publicPages({ view = (entry: Entry) => entry }: { view?: PublicView<Entry> } = {}): Promise<PublicPage[]> {
	const content = useContent();
	const [settings, posts, guides, pages, categories, tags] = await Promise.all([
		content.settings(),
		// `seo: true`: each entry's noindex (an EmDash source looks it up per entry, so only these lists ask).
		content.posts.list({ seo: true }),
		content.guides.list({ seo: true }),
		content.pages.list({ seo: true }),
		content.terms("category"),
		content.terms("tag"),
	]);
	const site = settings.title;
	/** True when the entry is neither hidden from search engines nor by the view (theme-core's one meaning). */
	const isShown = (e: Entry) => shownBy(e, view);
	/** Terms without those whose entries are all hidden (an empty term stays; the term pages' `card` matches). */
	const listed = <E extends Entry>(terms: Term[], entries: E[], of: (e: E) => Term[]) => listedPages(terms, { entries, shown: isShown, of: (e) => of(e).map((t) => t.slug) });
	/** Entries through the view (each asked once), without those hidden from search engines. */
	const shown = <E extends Entry>(items: E[]): E[] => shownEntries(items, view) as E[];
	return [
		// The home card's title says what the site is about (the tagline); the card's footer line names the site.
		{ path: "/", title: settings.tagline || site, card: true },
		{ path: "/posts", title: "Posts", card: true },
		...shown(posts.items).map((p) => ({ path: `/posts/${p.slug}`, title: p.title, label: "Post", lastmod: p.date, card: true })),
		{ path: "/guides", title: "Guides", card: true },
		...shown(guides.items).map((g) => ({ path: `/guides/${g.slug}`, title: g.title, label: "Guide", card: true })),
		...shown(pages.items).map((p) => ({ path: `/${p.slug}`, title: p.title, label: "Page", card: true })),
		...listed(categories, posts.items, (p) => p.categories).map((t) => ({ path: `/category/${t.slug}`, title: t.label, label: "Category", card: true })),
		...listed(tags, posts.items, (p) => p.tags).map((t) => ({ path: `/tag/${t.slug}`, title: t.label, label: "Tag", card: true })),
	];
}

/** The site's public origin for a route file (SITE_URL at run time on a server build, else `site`). */
export const siteOrigin = ({ site, url }: Pick<APIContext, "site" | "url">) => publicOrigin({ site, url, output: import.meta.env.CONTENT_OUTPUT });
