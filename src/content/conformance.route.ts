/** Injected only by the content tests (CONTENT_CONFORMANCE=1). Not part of normal builds. */
import type { APIRoute } from "astro";
import source from "astronomic:content/source";
import { checkAdapter, type ContentAdapter } from "@astronomic/content";
import { reservedRoutes, sortProblems } from "@astronomic/theme-core/conformance";
import { compareTerms } from "@astronomic/theme-core/content";
import type { Model, PostQuery, Settings } from "./model";
import { checks, guideProblems, SITE_ROUTES } from "./conformance";
import { compareGuides, comparePages, comparePosts, compareSeries } from "./rules";

export const GET: APIRoute = async () => {
	const ctx = { cache() {} };
	const problems = await checkAdapter(source, checks);
	// Every source lists site terms A to Z by label (theme-core's sortTermsByLabel).
	for (const tax of checks.taxonomies ?? [])
		problems.push(...sortProblems(`taxonomies.list("${tax}")`, (await source.taxonomies?.list(tax, ctx)) ?? [], compareTerms));
	// Every list follows the shared sort rules (src/content/rules.ts).
	const c = (source as unknown as ContentAdapter<Model, Settings>).collections;
	const pages = (await c.pages.list(undefined, ctx)).items;
	problems.push(...reservedRoutes(pages, SITE_ROUTES));
	problems.push(...sortProblems("pages", pages, comparePages));
	const series = (await c.series.list(undefined, ctx)).items;
	const guides = (await c.guides.list(undefined, ctx)).items;
	problems.push(...sortProblems("series", series, compareSeries));
	problems.push(...sortProblems("guides", guides, compareGuides));
	for (const s of series) problems.push(...sortProblems(`guides (series ${s.slug})`, (await c.guides.list({ series: s.slug }, ctx)).items, compareGuides));
	problems.push(...guideProblems(guides, series));
	for (const sort of ["date-desc", "date-asc", "title"] as const) {
		const q: PostQuery = { sort };
		problems.push(...sortProblems(`posts (${sort})`, (await c.posts.list(q, ctx)).items, (a, b) => comparePosts(a, b, q)));
	}
	return Response.json({ adapter: source.name, problems });
};
