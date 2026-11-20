# Astronomic Starter

A free Astro + EmDash starter for a small product site, with a blog and guides. It is built from the free parts of Astronomic UI, in its default look.

Content comes from Markdown files in `content/` by default. EmDash is supported as a second source; switch in `astro.config.mjs` (`contentSource(...)`).

```sh
pnpm install
pnpm dev            # Markdown source
pnpm check          # type-check
pnpm build
```

To try EmDash, load the demo content into a local database with `pnpm seed:emdash`, then run `CONTENT_SOURCE=emdash pnpm dev`. The admin is at `http://localhost:4321/_emdash/admin`.

The shared UI, content and theme code is in `packages/`. It is part of this repo, so you can change it as you need.

Design system: run `pnpm dev`, then open `/system`. A build adds it only with `ASTRONOMIC_SYSTEM=1`.

## What is inside

| Page | Path | What it shows |
| --- | --- | --- |
| Home | `/` | A hero beside a preview of the parts, a "Works with" strip, features, screenshots, the steps beside a look demo, the latest posts and a closing call to action |
| Blog | `/posts`, `/posts/page/2`, ... | Posts, newest first, with category filters, and a newsletter form on the first page |
| Post | `/posts/<slug>` | The post, with its cover photo, a byline and a short box about its writer |
| Category, tag | `/category/<slug>`, `/tag/<slug>` | Posts in one category or with one tag |
| Guides | `/guides` | Every guide, grouped by series |
| Guide | `/guides/<slug>` | The guide, the parts of its series, and links to the parts before and after it |
| About | `/about` | Your page text beside a drawing, a few numbers, your team and customer quotes |
| Contact | `/contact` | Your page text, your email and a message form |
| Page | `/<slug>` | Any other page, such as `/privacy` |
| Search | `/search` | Search across posts, guides and pages |

## Make it yours

The demo is a product site for Astronomic UI. Our name is in three places: the hero on the home page, the footer and the site title. Everything else is short placeholder text for you to replace.

1. **Site name and tagline.** Markdown: `content/site.json`. EmDash: Settings in the admin. The site name shows in the nav bar and in each page's title.
2. **Our name in the hero and the footer.** Search the project for `Astronomic UI` and replace it. The hero and the footer's "Built with Astronomic UI" line are in `src/site.ts`.
3. **The home page text.** The words of every home section are in `home` in `src/site.ts`: the hero and the preview beside it, features, screenshots, steps and the call to action. The screenshots in `src/assets/kit/` show our demo: replace them with pictures of your product.
4. **About and Contact.** Their text is a page in your content (`content/pages/about.md` and `content/pages/contact.md`, or Pages in EmDash). The numbers, the team and the customer quotes on About, and the email on Contact, are in `src/site.ts`. The quotes are placeholders ("Your customer's words go here."): put in real quotes from your customers, or remove the section. The drawing on About is `public/images/about.svg`.
5. **The menu.** Markdown: `content/menus.json`. EmDash: Menus in the admin. The button at the end of the nav bar is `navAction` in `src/site.ts`.
6. **The forms.** The newsletter form on the blog and the message form on Contact post to the addresses in `forms` in `src/site.ts`. Set each to your newsletter tool's or form service's address. Until you do, they use placeholder addresses on `example.com`. Before your site is live, a form shows its demo message and sends nothing. On a live site, no form appears on a placeholder address: Contact shows the details alone, the blog has no sign-up, and the log gets one line for each.
7. **The demo content.** Replace or delete the posts, guides and pages in `content/` (or in EmDash).
8. **The blog photos.** The posts' cover photos are free stock photos (CC0, from Wikimedia Commons), credited in `content/media/CREDITS.md`. Replace them with your own: put each photo in `content/media/` and name it in its post's `image:` line, with a short `imageAlt:`. In EmDash, set each post's featured image.
9. **The look demo.** Remove it once you have picked your look (see "Change the look").

## Change the look

The site uses Astronomic UI's default look, Minimal: the Geist typeface and neutral grays. Five other looks change the colors, corners, shadows and fonts. To use one, open `src/styles/global.css` and uncomment one line: remove the `/*` and `*/` around it.

```css
@import "./looks/soft.css";
```

| Look | Line to uncomment | Fonts |
| --- | --- | --- |
| Minimal (default) | none (keep every look line commented out) | Geist |
| Clean | `./looks/clean.css` | Inter |
| Modern | `./looks/modern.css` | Plus Jakarta Sans |
| Playful | `./looks/playful.css` | Bricolage Grotesque and Nunito |
| Soft | `./looks/soft.css` | Figtree |
| Ink | `./looks/ink.css` | Newsreader and Libre Franklin |

Uncomment one line at most. Every look's fonts are already declared in `astro.config.mjs` and loaded from `src/layouts/Base.astro`, so there is no font package to add. A page downloads only the fonts its look uses.

How it works: each file in `src/styles/looks/` loads one Astronomic UI preset, which sets the design tokens (colors, corners, shadows, spacing, type), and points the type tokens at its fonts. The line comes after the kit's own tokens, so its values win, and every part on every page reads them.

The share cards keep their own font and colors (see "Share images"). If you pick another look, update the colors there too.

### The look demo on the home page

The "Try a look" buttons on the home page put each look on that one page, so visitors can compare them. They do not change your site's look or save a choice: that is the line in `global.css`. The demo's Minimal button shows the look `global.css` sets, so keep `global.css` on Minimal while the demo is on the page. If you change a file in `src/styles/looks/` while the demo is there, run `pnpm looks:scope` to update the demo's copy (`src/styles/looks.scoped.css`).

Once you have picked your look, remove the demo:

1. In `src/pages/index.astro`, remove the `LookSwitch` and `LookCode` imports and tags. Put something else beside the steps, or remove the `Split` around them.
2. In `src/system/Sections.astro`, remove the look demo section and the same imports.
3. Delete `src/components/LookSwitch.astro`, `src/components/LookCode.astro`, `src/styles/looks.scoped.css`, `scripts/scope-looks.mjs` and `scripts/scope-looks.test.mjs`, and the `looks:scope` and `test:looks` scripts in `package.json`.
4. In `src/site.ts`, remove `home.look`, and change the "Pick a look" step's text.

Nothing else sets or reads `data-look` on `<html>`, so the site then has one look: the one in `global.css`. You can also remove the fonts of the looks you do not use from `astro.config.mjs` and from the list in `src/layouts/Base.astro`.

## Guides

Guides are how-to pages, in series. Each guide belongs to one series and has a part number. The guide page lists the other parts of its series and links to the part before and after it. Guides are not in the blog list or the feed.

**Markdown.** A series is a file in `content/series/`. Its file name is its slug:

```md
---
title: Getting started
description: Install the site, pick a look and build your first page, in three short guides.
---
```

A guide is a file in `content/guides/`. Its file name is its slug. Under `series`, `ref` names the series' slug and `part` is the guide's part number:

```md
---
title: Install the site
excerpt: Get the site running on your computer in a few minutes.
series:
  ref: getting-started
  part: 1
---

The guide's text, in Markdown.
```

Parts in a series are listed by `part`, then by slug. On `/guides`, the series are in title order.

**EmDash.** In the admin, open Series and add a series (a title and a description). Then open Guides, add a guide, pick its series and enter its part in the series.

To add a second series, add a series file (or a Series entry) and give its guides that slug.

## Light and dark mode

Light and dark mode follow the visitor's system setting. The moon button in the nav bar lets them pick: one press shows the other mode, and a press back to the mode their system shows lets the site follow the system again. On a phone the button sits in the bar, beside the menu button. On a screen narrower than 375px it moves into the menu, as a "Dark mode" button.

- The choice is saved in the visitor's browser (`localStorage`, key `aui-theme`) and applies on every page. A small script at the top of `<head>` in `src/layouts/Base.astro` (`modeScript`) puts it on `<html>` before the page paints, so a visitor who chose dark never sees a light page first.
- Without JavaScript the button is hidden, and the site follows the system setting.
- **Turn the button off:** set `modeSwitch` to `false` in `src/theme.look.ts`. The button and its script are gone, and the site follows each visitor's system setting. A choice a visitor saved before is no longer read, so nobody is left stuck in a mode they cannot change.
- **Force one mode:** turn the button off, then set `data-theme="light"` or `data-theme="dark"` on `<html>` in `src/layouts/Base.astro`.

## Site URL

Set your site's public address before you build. The feed, the sitemap, robots.txt and the share images need it for their links. Set the `SITE_URL` environment variable (for example `SITE_URL=https://<your-domain> pnpm build`), or edit the `site` line in `astro.config.mjs`. EmDash reads `SITE_URL` too; on a server build it also applies when the site runs. If `EMDASH_SITE_URL` is set, it wins on a server build. Set it when the server runs: `SITE_URL=https://<your-domain> pnpm start`, with your own domain in place of `<your-domain>`. Without it, the links use the address the server sees for each request, which is `http://localhost` with the port unless `security.allowedDomains` in `astro.config.mjs` names your domain, and the log has one line asking for `SITE_URL`. Until you set it, a static build's links point at `https://example.com`, and an EmDash server's use the address the server sees for each request, usually `http://localhost`.

## Search

With Markdown (a static build), search uses Pagefind. `pnpm build` runs it after the build and writes the index to `dist/pagefind/`. Search works on the built site, not in `pnpm dev`: run `pnpm build`, then `pnpm preview` to try it. The index holds posts and guides, each with its summary, and pages. A page hidden from search engines (`noindex: true` in its Markdown, or "hide from search engines" in EmDash's SEO panel) is not in the index.

Pagefind installs a program for your system. It supports macOS (Apple silicon and Intel), Linux (x64 and arm64), Windows (x64 and arm64) and FreeBSD (x64).

With EmDash (a server build), the search page asks EmDash on each request.

## Feed, sitemap and robots

These files are in `src/pages/`:

- `rss.xml.ts`: the posts feed at `/rss.xml`. The newest 50 posts, each with its title, date, categories and excerpt (not the full text). Hidden posts are left out. Guides are not in the feed.
- `sitemap.xml.ts`: `/sitemap.xml`. The home page, the blog and guide lists, every post, guide and page, and the first page of each category and tag. Search, 404, paged lists and hidden pages are left out.
- `sitemap-[collection].xml.ts`: answers "not found". It stops EmDash from adding its own sitemaps.
- `robots.txt.ts`: `/robots.txt`. It allows everything and names the sitemap. With EmDash it also keeps crawlers out of `/_emdash/`.

With EmDash, the robots.txt setting in the admin does not apply. Edit `robots.txt.ts` instead.

With EmDash, a request in edit mode (the editor's toolbar cookie) or with a preview link gets `Cache-Control: private, no-store` on every response, the feed and sitemap included, so a shared cache never keeps an editor's view (`privateResponses()` in `astro.config.mjs`). One limit: if you add Astro's route cache, a page it already holds is served before this check runs, so an editor can get that cached public copy (public content, never the editor's view).

## Share images

Every public page gets a share image: a 1200 x 630 card with the page title, its kind and the site name, at `/og/…/card.png` (`/og/card.png` for the home page, which shows the tagline). A post with its own image uses that image instead. With EmDash, an entry's SEO image (in its SEO panel) comes before both.

The card's font (Geist SemiBold) and colors are in `src/share-card.ts`. The colors copy the UI kit's light colors in the Minimal look; if you pick another look or change the kit's colors, change them there too.

With EmDash, each card is drawn once per server process and then kept. A card requested in edit mode or with a preview link is private (`Cache-Control: private, no-store`).

The cards are drawn with `satori` and `@resvg/resvg-js`. Keep both in the site's own `dependencies`: resvg has a native program that cannot be bundled. Keep `satori` at exactly `0.35.0`; 0.35.2 fails in Node 26.

## License

MIT. See `LICENSE`.

Parts of this starter come from the EmDash starter template. See `LICENSE-EMDASH`.
