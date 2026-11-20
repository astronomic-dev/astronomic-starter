/**
 * Route helpers shared by the dynamic pages.
 *
 * Every dynamic route exports `getStaticPaths`. Static builds (Markdown) use
 * it to prerender; server builds (EmDash) ignore it and render per request.
 * These helpers only ask for slugs and counts, never full entries. The
 * generic parts come from theme-core; the page size and param are the starter's.
 */
import { pagedPaths, slugParams, termPagePaths } from "@astronomic/theme-core/routes";
import { useContent } from "~/content";

export { pageHref, parsePage } from "@astronomic/theme-core/routes";

export const PER_PAGE = 20;

export async function slugPaths(name: "posts" | "pages" | "guides") {
	return slugParams(await useContent()[name].slugs());
}

/** Pages entries with their own route file (src/pages/<slug>.astro): [slug].astro leaves them out. */
export const PAGE_ROUTES = new Set(["about", "contact"]);

export async function postPages() {
	return pagedPaths(await useContent().posts.count(), { perPage: PER_PAGE, param: "page" });
}

/** `/category/<slug>`, `/category/<slug>/2`, ... for every term, empty ones too. */
export async function termPages(taxonomy: "category" | "tag") {
	const content = useContent();
	const terms = await content.terms(taxonomy);
	const counted = await Promise.all(terms.map(async (term) => ({ slug: term.slug, count: await content.posts.count({ [taxonomy]: term.slug }) })));
	return termPagePaths(counted, { perPage: PER_PAGE, param: "page", first: true });
}
