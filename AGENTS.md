# Astronomic Starter

This file tells a coding agent (Claude Code, Cursor, or another coding agent) how this project works. Read it before you change anything. `README.md` has the full setup notes, and the online docs are at https://astronomic.dev/docs/starter.

Claude Code reads this file when the project has no `CLAUDE.md`. If you also want a `CLAUDE.md`, make its first line `@AGENTS.md` so this file still loads.

## What this is

A free (MIT) Astro 7 starter for a small product site, with a blog and guides. It is built from the free parts of Astronomic UI (`packages/ui`) in the kit's default look, Minimal (Geist, neutral grays). It has a home page, a blog with categories and tags, guides in series, About, Contact, other pages, search, a feed, a sitemap and share images. Styling is Tailwind CSS v4. Content comes from Markdown files by default, or from EmDash (a CMS built on Astro, with an admin UI). Pages read content only through one content model, so both sources give the same site.

The demo is a product site for Astronomic UI. That name is only in the home hero, the footer and the site title. Every other text is short placeholder copy for the site owner to replace.

## Commands

Use pnpm. Node version: `.nvmrc`.

```sh
pnpm install
pnpm dev             # dev server at http://localhost:4321 (Markdown source)
pnpm build           # Markdown: a static site in dist/ (then Pagefind indexes it)
pnpm preview         # serve the build (site search works here, not in dev)
pnpm check           # astro check: type-check
pnpm seed:emdash     # EmDash: load seed/seed.json and the dates in seed/dates.json into ./data.db (--reset starts over)
pnpm start           # EmDash: run the server build (node ./dist/server/entry.mjs)
pnpm test:adapter    # build the selected source and check its content and pages
pnpm test:parity     # build every source and compare content and pages
pnpm test:no-emdash  # a Markdown build needs no EmDash package
pnpm test:settings   # build with the light and dark switch on and off; check the pages
pnpm test:system     # the /system pages: off in a build by default, on with ASTRONOMIC_SYSTEM=1
pnpm looks:scope     # rebuild src/styles/looks.scoped.css (the home's look demo) from src/styles/looks/
pnpm test:looks      # check looks.scoped.css is current
```

## Folder map

Most of the layout you can read from the project. These are the parts that are easy to get wrong:

| Path | What it holds |
| --- | --- |
| `src/site.ts` | Every word that is page code (home sections, the blog's sign-up, About and Contact extras, the nav button, the footer) and where the two forms post (`forms`). The site title and tagline are in `content/site.json` |
| `src/content/adapters/_template.ts` | A starting point for connecting another backend |
| `src/utils/public-pages.ts` | The public page list (sitemap, share images) and `siteOrigin()`. Entries and terms join it by themselves; a new fixed page goes in by hand |
| `src/assets/kit/` | The home page's screenshots (replace them with pictures of your product) |

`packages/ui`, `packages/content` and `packages/theme-core` are part of this repo. You may change them, but prefer changes in the starter's own files.

## Content: Markdown or EmDash

- **Markdown (default).** Edit the files in `content/`. Images go in `content/media/`. The build is a static site.
- **EmDash.** Run `pnpm seed:emdash` once. Then change `"markdown"` to `"emdash"` in the `contentSource(...)` line of `astro.config.mjs` (or use `CONTENT_SOURCE=emdash` for one run), then `pnpm dev`. The admin is at `http://localhost:4321/_emdash/admin`. Data lives in `data.db` and `uploads/`. The build is a Node server app; run it with `pnpm start`.
- **Mixed.** `contentSource("mixed")` reads posts and pages from Markdown, and guides and series from EmDash.
- Markdown mirrors the seed. Change both together; `pnpm test:parity` compares them. After a seed change, run `pnpm seed:emdash --reset`.
- To add a field, change `src/content/model.ts` first, then map it in every source in `src/content/sources/`, then run `pnpm test:adapter` and `pnpm test:parity`. To add a collection, follow `guides`.
- A new top-level route goes in `SITE_ROUTES` in `src/content/conformance.ts`, so a page slug cannot take it.

Set the public URL with `SITE_URL` (or the `site` line in `astro.config.mjs`) before a real build. The feed, sitemap, robots.txt and share images use it. On EmDash, set it when the server runs too (`SITE_URL=https://<your-domain> pnpm start`): without it, links use the address the server sees for each request (`http://localhost:<port>` unless `security.allowedDomains` names the domain) and the log has one line.

## Using the kit components

- Import parts from `@astronomic/ui/components/<Name>.astro`. Each family has a base part and named variants as their own files: `Hero`, `HeroSplit`, `HeroCentered`, `HeroCover`; `Features`, `FeatureGridSplit`, `FeatureRows`; `CtaBand`, `CtaBandSplit`; `Footer`, `FooterColumns`; and so on. Read the part's `Props` at the top of its file.
- Build pages from `Section`, `SectionHead`, `Container`, `Split`, `Prose` and the family parts. To change how a part looks, pick another variant or pass other props. Do not copy a part into `src/components/` to restyle it, and do not write a local component that does what a kit part does.
- Components take plain props, never CMS objects. Pages get data from `useContent(Astro)` and pass plain values down.
- Rich text renders through `src/components/RichText.astro`, and content images through `ContentImage.astro`.
- Only free kit parts are in this starter. Do not add parts from other kits.
- Run `pnpm dev` and open `/system` to see the kit's tokens and parts.

## Looks, tokens and dark mode

- **The look** is one line in `src/styles/global.css`. Minimal is the default and needs no line. Uncomment at most one of `clean`, `modern`, `playful`, `soft`, `ink`. Each file in `src/styles/looks/` loads one kit preset and binds its fonts. Every look's fonts are already declared in `astro.config.mjs`, from the pinned Fontsource packages in `package.json`, so a look needs no extra font package. Do not add a separate brand stylesheet.
- **The look demo** on the home page (`LookSwitch`, `LookCode`) only shows looks; it does not set the site's look. After changing a file in `src/styles/looks/`, run `pnpm looks:scope`. `README.md` says how to remove the demo.
- **Tokens.** Style with token-based classes only (`bg-bg`, `text-fg`, `text-muted`, `bg-accent`, `rounded-control`, `font-display`, ...). Do not hard-code colors, radii or fonts.
- **Dark mode** swaps the token values. Never use Tailwind's `dark:` variant. The moon button is the kit's `ModeToggle` in `Base.astro`; its script (`modeScript`) must stay first in `<head>`, before any stylesheet. `modeSwitch: false` in `src/theme.look.ts` removes both.
- If you change the look or the kit's colors, update the share image colors in `src/share-card.ts` too.

## Rules to keep

- Keep the site accessible: real headings in order, a visible focus ring, and labels on form fields and buttons. Text must keep 4.5:1 contrast in light and dark. Under reduced motion, nothing moves.
- Every content photo needs alt text: `imageAlt` beside a post's `image` in Markdown, the media item's alt text in EmDash. Decorative images get an empty alt and `aria-hidden`.
- Pages read content only through `useContent(Astro)`. Never import EmDash in pages or components, so the Markdown build keeps working.
- Adapters throw on backend errors; `get()` returns `undefined` only for "not found". Optional source parts (menus, search, head components) may be missing; always fall back.
- Every dynamic route exports `getStaticPaths` and loads its data from `Astro.params`. Paginate with numbered paths (`/posts/page/2`), not query strings.
- Keep `satori` at exactly `0.35.0`, and keep it, `@resvg/resvg-js` and `sharp` in the site's own `dependencies`.
- Guides stay out of the blog list and the feed.
- The testimonials are placeholders. Put in real quotes from the owner, or remove the section; never invent praise.
- Text for site visitors is US English.

## Check your work

1. `pnpm check` and `pnpm build` pass.
2. After content or model changes: `pnpm test:adapter` and `pnpm test:parity`.
3. After look changes: `pnpm test:looks` (run `pnpm looks:scope` first if it fails). After layout or nav changes: `pnpm test:settings`.
4. Open the changed pages in `pnpm dev` in light and dark mode, at phone width, and with reduced motion on.
