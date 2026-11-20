/**
 * Injected only by the content tests (CONTENT_CONFORMANCE=1). Not part of
 * normal builds. Returns every collection's mapped data in a normalized form,
 * so `pnpm test:parity` can compare sources field by field: each list, each
 * entry through `get(slug)`, `slugs()` and `count()`, and the filtered and
 * sorted queries (posts by tag, category, sort and page; the guides of each
 * series), each guide's series slug, title and part (`guideSeries`: the
 * normalized form drops `ref`), and the path, title and label of each share
 * card (`cards`, from publicPages). The normalized form is theme-core's
 * (`normalizeSnapshot`).
 */
import { normalizeSnapshot, type SnapshotCollection, snapshotCollections, snapshotList } from "@astronomic/theme-core/conformance";
import type { APIRoute } from "astro";
import source from "astronomic:content/source";
import { publicPages } from "../utils/public-pages";
import type { Guide } from "./model";

type Obj = Record<string, unknown>;

export const GET: APIRoute = async () => {
	const ctx = { cache() {} };
	const cols = source.collections as unknown as Record<string, SnapshotCollection>;
	const { collections, entries, slugs } = await snapshotCollections(cols, ctx);

	// The filtered queries the pages and the home sections run.
	const list = snapshotList(cols, ctx);
	const queries: Obj = {
		"posts.page1": await list("posts", { limit: 2 }),
		"posts.page2": await list("posts", { limit: 2, offset: 2 }),
		"posts.title": await list("posts", { sort: "title" }),
		"posts.date-asc": await list("posts", { sort: "date-asc" }),
	};
	for (const tax of ["tag", "category"] as const)
		for (const t of (await source.taxonomies?.list(tax, ctx)) ?? []) queries[`posts.${tax}.${t.slug}`] = await list("posts", { [tax]: t.slug });
	for (const s of (await cols.series.list(undefined, ctx)).items) queries[`guides.series.${s.slug}`] = await list("guides", { series: s.slug });
	const guides = (await cols.guides.list(undefined, ctx)).items as unknown as Guide[];
	const guideSeries = Object.fromEntries(guides.map((g) => [g.slug, { slug: g.series.ref.slug, title: g.series.ref.title, part: g.series.part }]));

	const site = {
		settings: normalizeSnapshot(await source.settings?.get(ctx)),
		menus: Object.fromEntries(await Promise.all(["primary"].map(async (m) => [m, normalizeSnapshot((await source.menus?.get(m, ctx)) ?? [])]))),
		taxonomies: Object.fromEntries(
			await Promise.all(["tag", "category"].map(async (t) => [t, normalizeSnapshot((await source.taxonomies?.list(t, ctx)) ?? [])])),
		),
	};
	const cards = (await publicPages()).filter((p) => p.card).map(({ path, title, label }) => ({ path, title, label }));
	return Response.json({ adapter: source.name, collections, entries, slugs, queries, guideSeries, site, cards });
};
