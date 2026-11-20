import { satteri } from "@astrojs/markdown-satteri";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { contentSource } from "@astronomic/content/astro";
import { contentTests, privateResponses, staticSearch } from "@astronomic/theme-core/astro";
import { astronomicSystem } from "@astronomic/ui/system";

// The content source: the one switch. A name of a source in src/content/sources/
// ("markdown", "emdash", or your own). CONTENT_SOURCE overrides it (used by tests).
const content = await contentSource(process.env.CONTENT_SOURCE ?? "markdown", import.meta.url);

const SANS = ["ui-sans-serif", "system-ui", "sans-serif"];
// Fontsource's "latin" subset.
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD".split(",");

/**
 * One family from its @fontsource-variable package: the latin, upright, weight-axis file, served for the given weight
 * range. Its CSS variable is --font-<slug>.
 */
function fontsource(name, slug, weight, fallbacks) {
	return {
		provider: fontProviders.local(),
		name,
		cssVariable: `--font-${slug}`,
		fallbacks,
		options: {
			variants: [
				{ src: [`@fontsource-variable/${slug}/files/${slug}-latin-wght-normal.woff2`], weight, style: "normal", unicodeRange: LATIN },
			],
		},
	};
}

export default defineConfig({
	// The public URL. The feed, the sitemap, robots.txt and share cards need it. Set SITE_URL (EmDash reads the
	// same variable; on a server build it also wins at run time) or edit this line.
	site: process.env.SITE_URL || "https://example.com",
	// Static for build-time sources (Markdown), server for per-request ones (EmDash).
	output: content.output,
	adapter: content.adapter,
	// Show quotes as written, the same as CMS sources (no automatic curly quotes).
	markdown: { processor: satteri({ features: { smartPunctuation: false } }) },
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	// Geist is the default Astronomic UI ("Minimal") typeface. One variable file covers
	// the weights the look uses, 550 too. Geist has no italic face.
	// Rendered in Base.astro with <Font cssVariable="--font-geist" />
	// and bound to --ui-font-display / --ui-font-body in src/styles/fonts.css.
	// Every face comes from a Fontsource package pinned in package.json (its OFL license is in the package), read
	// from node_modules at build time: no font CDN, and the same files on every build.
	fonts: [
		fontsource("Geist", "geist", "400 700", SANS),
		// The presets' faces (src/styles/looks/*.css bind them). Declared here so a one-line look switch in
		// src/styles/global.css loads its font; a page downloads only the family it uses. Weights: each preset's
		// display, heading and button weights, body 400 and bold text.
		// Clean: Inter.
		fontsource("Inter", "inter", "400 700", SANS),
		// Modern: Plus Jakarta Sans.
		fontsource("Plus Jakarta Sans", "plus-jakarta-sans", "400 700", SANS),
		// Playful: Bricolage Grotesque (display) over Nunito (body and buttons).
		fontsource("Bricolage Grotesque", "bricolage-grotesque", "400 800", SANS),
		fontsource("Nunito", "nunito", "400 800", SANS),
		// Soft: Figtree.
		fontsource("Figtree", "figtree", "400 800", SANS),
		// Ink: Newsreader (display) over Libre Franklin (body and buttons).
		fontsource("Newsreader", "newsreader", "400 700", ["ui-serif", "Georgia", "serif"]),
		fontsource("Libre Franklin", "libre-franklin", "400 700", SANS),
	],
	integrations: [
		react(),
		// Design system pages at /system: in `astro dev`, and in a build with ASTRONOMIC_SYSTEM=1.
		astronomicSystem({
			name: "Starter",
			layout: "./src/system/Layout.astro",
			sections: "./src/system/Sections.astro",
			screens: "./src/system/screens.ts",
		}),
		...content.integrations,
		// The content tests (with CONTENT_CONFORMANCE set) inject two routes: the adapter
		// conformance check, and a normalized snapshot of every collection that
		// `pnpm test:parity` compares across sources.
		contentTests({ conformance: "./src/content/conformance.route.ts", snapshot: "./src/content/snapshot.route.ts" }),
		// Static builds: Pagefind indexes the entry pages after the build (dist/pagefind/), for /search.
		// Server builds keep the source's own search and skip this.
		staticSearch(),
		// Server builds: edit-mode and preview-token requests get private no-store on every response (pages, the
		// feed, the sitemap, cards), so an editor's view is never stored by a shared cache.
		privateResponses(),
	],
	vite: {
		plugins: [
			tailwindcss(),
			// `pnpm test:no-emdash` fails the build on any EmDash / @astrojs/node import.
			...(process.env.CONTENT_FORBID ? [(await import("@astronomic/theme-core/scripts/forbid.mjs")).forbidPlugin()] : []),
		],
		resolve: { alias: content.alias },
		define: content.define,
		// Pre-bundle React (EmDash's admin) so the dev server doesn't re-optimize
		// mid-load (which mixes React chunks and breaks hooks on first visit).
		optimizeDeps: {
			include: ["react", "react-dom", "react-dom/client"],
		},
	},
	devToolbar: { enabled: false },
});
