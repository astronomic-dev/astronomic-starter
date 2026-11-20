/**
 * The one entry point pages use:
 *
 *   const content = useContent(Astro);
 *   const { items } = await content.posts.list({ limit: 10 });
 *
 * The source is chosen in astro.config.mjs (`contentSource(...)`).
 */
import source from "astronomic:content/source";
import { createThemeContent, searchMode } from "@astronomic/theme-core/content";
import { DEFAULT_SETTINGS, type Model, type Settings } from "./model";

export type * from "@astronomic/content";
export type * from "./model";

// `content.search` is the source's request search: hidden in a static build,
// which searches with Pagefind instead (see `searchKind`).
export const useContent = createThemeContent<Model, Settings>(source, DEFAULT_SETTINGS, { output: import.meta.env.CONTENT_OUTPUT });

/**
 * The search the site offers: "request" (a server build whose source
 * searches), "static" (a static build: Pagefind, see `staticSearch()` in
 * astro.config.mjs) or undefined (no search box, no results).
 */
export const searchKind = (content: { search?: unknown }) => searchMode(content.search, import.meta.env.CONTENT_OUTPUT);

/**
 * Spread on a part of an entry page that static search leaves out: content about other entries (the post
 * sidebar). Empty unless the build searches statically.
 */
export const searchIgnore = (content: { search?: unknown }): { "data-pagefind-ignore"?: "" } =>
	searchKind(content) === "static" ? { "data-pagefind-ignore": "" } : {};
