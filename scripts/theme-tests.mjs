/**
 * The starter's settings for the content tests (the runners in
 * @astronomic/theme-core/scripts): the project root, the pages parity checks
 * with their expected status, the starter's own page checks, and what parity
 * leaves out of <main> (the sidebar and the forms, each marked data-parity-skip: they differ by
 * design). The scripts in this folder (`pnpm test:*`) pass this to their runner.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { attrs, headProblems, mainH2s, modeProblems } from "@astronomic/theme-core/scripts/harness.mjs";
import { modeSwitch } from "../src/utils/mode-switch.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
/**
 * Test-only content (not in a released copy): a page and a post with "hide
 * from search engines" set, a post with a photo, posts on the same day, two
 * guides with the same series title and part, whose slug order differs from
 * their file and creation order (the sort rules break ties by slug).
 */
const fixtures = new URL("../fixtures/edge-cases/", import.meta.url);
/** The fixture page's path, from its file name (no released file names it). */
const NOINDEX_PAGE = existsSync(fixtures) ? `/${readdirSync(new URL("pages/", fixtures)).find((f) => f.endsWith(".md")).replace(/\.md$/, "")}` : undefined;

/** The fixture post with a photo (its front matter names an image), from its file; it shares the photo, not a card. */
const PHOTO_POST = existsSync(fixtures)
	? (() => {
			const dir = new URL("posts/", fixtures);
			const text = readdirSync(dir)
				.filter((f) => f.endsWith(".md"))
				.map((f) => readFileSync(new URL(f, dir), "utf8"))
				.find((t) => /^image:/m.test(t));
			const slug = text?.match(/^slug:\s*(.+)$/m)?.[1].trim();
			return slug ? `/posts/${slug}` : undefined;
		})()
	: undefined;

/** Path -> expected status. The removed Projects and Services routes stay in the list as 404s. */
const pages = {
	"/": 200,
	"/posts": 200,
	"/posts/welcome": 200,
	"/posts/start-with-a-preset": 200,
	"/posts/fast-pages-by-default": 200,
	"/guides": 200,
	"/guides/install": 200,
	"/guides/pick-a-preset": 200,
	"/guides/build-a-page": 200,
	"/about": 200,
	"/contact": 200,
	"/privacy": 200,
	"/category/design": 200,
	"/tag/tips": 200,
	"/tag/launch": 200,
	"/posts/nope": 404,
	"/guides/nope": 404,
	"/projects": 404,
	"/projects/northwind-rebrand": 404,
	"/services/web-design": 404,
	"/no-such-page": 404,
	...(NOINDEX_PAGE ? { [NOINDEX_PAGE]: 200 } : {}),
	...(PHOTO_POST ? { [PHOTO_POST]: 200 } : {}),
};
/** Every path in `pages`, for the checks that run on each page. */
const PATHS = Object.keys(pages);
/** `pages` under another name, for assertPages (which keeps the fetched pages in its own `pages`). */
const PAGES = pages;

/** The site URL the test builds use (astro.config.mjs's default; SITE_URL is not set). */
const SITE = "https://example.com";

/**
 * The fixture entries of a collection: `{ slug, title, noindex }` from each file's front matter. By default the
 * listed ones (not noindex), ordered by slug: they tie with each other (same date) and are
 * older than every demo entry, so they come after the demo entries, by slug. `{ noindex: true }` gives the hidden
 * ones instead. Read from the files, so no released file names them.
 */
function fixtureEntries(collection, { noindex = false } = {}) {
	if (!existsSync(fixtures)) return [];
	const dir = new URL(`${collection}/`, fixtures);
	const field = (text, name) => text.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
	return readdirSync(dir)
		.filter((f) => f.endsWith(".md"))
		.map((f) => {
			const text = readFileSync(new URL(f, dir), "utf8");
			return { slug: field(text, "slug"), title: field(text, "title"), noindex: field(text, "noindex") === "true" };
		})
		.filter((e) => e.noindex === noindex)
		.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

/**
 * Every page /sitemap.xml lists, in its order, for every source (the parity check of the public page list), with
 * the test-only fixtures when they are loaded. Not listed: search, 404, noindex entries, paged pages.
 */
function sitemapPaths(fixturesLoaded) {
	const f = (collection) => (fixturesLoaded ? fixtureEntries(collection).map((e) => `/${collection}/${e.slug}`) : []);
	return [
		"/", "/posts",
		"/posts/fast-pages-by-default", "/posts/start-with-a-preset", "/posts/welcome", ...f("posts"),
		"/guides", "/guides/install", "/guides/pick-a-preset", "/guides/build-a-page", ...f("guides"),
		"/about", "/contact", "/privacy",
		"/category/design", "/category/news", "/category/product",
		"/tag/launch", "/tag/performance", "/tag/presets", "/tag/tips",
	];
}

/** The titles /rss.xml has, newest first, with the test-only fixtures when they are loaded. */
const feedTitles = (fixturesLoaded) => [
	"Fast pages by default",
	"Start every page with a preset",
	"Welcome to the blog",
	...(fixturesLoaded ? fixtureEntries("posts").map((e) => e.title) : []),
];

/** Problems with /robots.txt, /sitemap.xml, /sitemap-<collection>.xml and /rss.xml. */
async function siteFileProblems(kind, h) {
	const problems = [];
	const robots = await fetch(`${h.base}/robots.txt`);
	const robotsText = await robots.text();
	// The content type comes from the server; the test's static file server sends none.
	const typeOk = (res, re) => kind !== "server" || re.test(res.headers.get("content-type") ?? "");
	if (robots.status !== 200 || !typeOk(robots, /^text\/plain/)) problems.push(`/robots.txt: status ${robots.status}, type ${robots.headers.get("content-type")}`);
	else {
		if (!robotsText.includes(`Sitemap: ${SITE}/sitemap.xml`)) problems.push(`/robots.txt: no "Sitemap: ${SITE}/sitemap.xml"`);
		if (kind === "server" && !robotsText.includes("Disallow: /_emdash/")) problems.push("/robots.txt: no Disallow: /_emdash/ on a server build");
		if (kind !== "server" && robotsText.includes("Disallow:")) problems.push("/robots.txt: a Disallow line on a static build");
	}

	const sitemap = await fetch(`${h.base}/sitemap.xml`);
	const xml = await sitemap.text();
	if (sitemap.status !== 200) problems.push(`/sitemap.xml: status ${sitemap.status}`);
	else {
		const want = sitemapPaths(h.fixturesLoaded);
		const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
		const paths = locs.map((loc) => (loc.startsWith(SITE) ? loc.slice(SITE.length) || "/" : loc));
		if (paths.join("\n") !== want.join("\n")) problems.push(`/sitemap.xml: the pages differ from the expected list:\n    got:  ${paths.join(" ")}\n    want: ${want.join(" ")}`);
		for (const path of paths) {
			const res = await fetch(h.base + path, { redirect: "manual" });
			if (res.status !== 200) problems.push(`/sitemap.xml lists ${path}, which returns ${res.status}`);
		}
		if (NOINDEX_PAGE && paths.includes(NOINDEX_PAGE)) problems.push(`/sitemap.xml lists the noindex page ${NOINDEX_PAGE}`);
		if (h.fixturesLoaded)
			for (const post of fixtureEntries("posts", { noindex: true }))
				if (paths.includes(`/posts/${post.slug}`)) problems.push(`/sitemap.xml lists the noindex post /posts/${post.slug}`);
	}
	for (const path of ["/sitemap-posts.xml", "/sitemap-pages.xml", "/sitemap-guides.xml"]) {
		const res = await fetch(h.base + path);
		if (res.status !== 404) problems.push(`${path}: status ${res.status}, expected 404 (the theme owns the sitemap)`);
	}

	const rss = await fetch(`${h.base}/rss.xml`);
	const feed = await rss.text();
	if (rss.status !== 200 || !typeOk(rss, /^application\/rss\+xml/)) problems.push(`/rss.xml: status ${rss.status}, type ${rss.headers.get("content-type")}`);
	else {
		const titles = [...feed.matchAll(/<item>[\s\S]*?<title>([^<]*)<\/title>/g)].map((m) => m[1]);
		const want = feedTitles(h.fixturesLoaded);
		if (titles.join("\n") !== want.join("\n")) problems.push(`/rss.xml: item titles ${titles.join(" | ")}, want ${want.join(" | ")}`);
		const links = [...feed.matchAll(/<item>[\s\S]*?<link>([^<]*)<\/link>/g)].map((m) => m[1]);
		if (links.length !== want.length || links.some((l) => !l.startsWith(`${SITE}/posts/`))) problems.push(`/rss.xml: item links ${links.join(" ")}`);
		if (feed.includes("/posts/page/")) problems.push("/rss.xml: links a paged posts page");
		if (h.fixturesLoaded)
			for (const post of fixtureEntries("posts", { noindex: true }))
				if (feed.includes(`/posts/${post.slug}<`) || titles.includes(post.title)) problems.push(`/rss.xml: has the noindex post /posts/${post.slug}`);
		if (h.fixturesLoaded && !fixtureEntries("posts", { noindex: true }).length) problems.push("fixtures: no noindex post to check the feed and sitemap with");
		if (!feed.includes("<category>News</category>")) problems.push("/rss.xml: no category News (the welcome post's category label)");
	}
	return problems;
}

/** The head's <meta>/<link> tags as [tag, attrs]. */
const headTags = (html) => [...(html.match(/<head[\s\S]*?<\/head>/)?.[0] ?? "").matchAll(/<(meta|link)\b[^>]*>/gi)].map((m) => [m[1].toLowerCase(), attrs(m[0])]);
const metas = (tags, key) => tags.filter(([t, a]) => t === "meta" && (a.property === key || a.name === key)).map(([, a]) => a.content);

/** The kind of image the bytes are (by signature), or undefined. */
function imageKind(bytes) {
	const b = new Uint8Array(bytes);
	const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
	if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
	if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
	if (ascii(4, 8) === "ftyp") return "avif";
	if (ascii(0, 4) === "GIF8") return "gif";
	return undefined;
}

/** The share card path of a page (theme-core's shareImagePath). */
const cardPath = (path) => (path === "/" ? "/og/card.png" : `/og${path}/card.png`);

/**
 * The card colors in src/share-card.ts match the kit's light tokens: each `"#hex", // --ui-name` line there is
 * checked against the value of --ui-name in @astronomic/ui/tokens.css (its first, light :root block).
 */
let coloursChecked = false;
function cardColourProblems() {
	// The files are the same for every build: check them once per run.
	if (coloursChecked) return [];
	coloursChecked = true;
	const problems = [];
	const file = new URL("../src/share-card.ts", import.meta.url);
	if (!existsSync(file)) return ["src/share-card.ts: missing"];
	const card = readFileSync(file, "utf8");
	const tokens = readFileSync(fileURLToPath(import.meta.resolve("@astronomic/ui/tokens.css")), "utf8");
	const light = tokens.match(/:root\s*\{[^}]*\}/)?.[0] ?? "";
	const pairs = [...card.matchAll(/"(#[0-9a-fA-F]{3,8})",?\s*\/\/\s*(--ui-[\w-]+)/g)];
	if (pairs.length !== 4) problems.push(`src/share-card.ts: ${pairs.length} colours named by a token comment (expected 4: bg, fg, muted, accent)`);
	for (const [, value, token] of pairs) {
		const want = light.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1].trim();
		if (!want || want.toLowerCase() !== value.toLowerCase()) problems.push(`src/share-card.ts: ${token} is ${value}, tokens.css has ${want ?? "(none)"}`);
	}
	return problems;
}

/**
 * Share head tags on every page of the parity list that returns 200: one absolute og:image under SITE that serves an
 * image, og:url, og:type, one twitter:card and one RSS alternate link. A page with an entry photo shares the photo
 * (with its alt); a public page without one shares its own card, a PNG; the noindex page shares the home card.
 */
async function shareProblems(kind, h) {
	const problems = [...cardColourProblems()];
	/** Posts are articles; every other page is a website. */
	const isArticle = (path) => /^\/posts\/(?!page\/)[^/]+$/.test(path);
	const checked = new Map();
	let photos = 0;
	for (const [path, status] of Object.entries(pages)) {
		if (status !== 200) continue;
		const page = await h.get(path);
		const tags = headTags(page.html);
		const main = page.html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";
		// The entry's photo: the image the page loads first (ContentImage with priority).
		const photo = main.match(/<img\b[^>]*\bfetchpriority=["']high["'][^>]*>/)?.[0];
		const images = metas(tags, "og:image");
		if (images.length !== 1) {
			problems.push(`${path}: ${images.length} og:image tags (expected 1)`);
			continue;
		}
		const image = images[0];
		if (!image.startsWith(`${SITE}/`)) problems.push(`${path}: og:image ${image} is not under ${SITE}/`);
		else {
			const url = new URL(image);
			const target = url.pathname + url.search;
			if (!checked.has(target)) {
				const res = await fetch(h.base + target, { redirect: "manual" });
				const bytes = res.status === 200 ? await res.arrayBuffer() : new ArrayBuffer(0);
				checked.set(target, { status: res.status, type: res.headers.get("content-type") ?? "", kind: imageKind(bytes) });
			}
			const got = checked.get(target);
			// The content type comes from the server; the test's static file server sends none.
			if (got.status !== 200 || !got.kind || (kind === "server" && !/^image\//.test(got.type)))
				problems.push(`${path}: og:image ${target} returns ${got.status} ${got.type || "(no type)"} ${got.kind ?? "(not an image)"}`);
			if (photo) {
				photos++;
				if (target.startsWith("/og/")) problems.push(`${path}: og:image is a card (${target}), not the entry's photo`);
				const alt = metas(tags, "og:image:alt");
				if (alt.length !== 1 || !alt[0] || attrs(photo).alt !== alt[0]) problems.push(`${path}: og:image:alt ${JSON.stringify(alt)} is not the photo's alt`);
			} else {
				const want = path === NOINDEX_PAGE ? cardPath("/") : cardPath(path);
				if (target !== want) problems.push(`${path}: og:image ${target} is not the card ${want}`);
				else if (got.kind !== "png" || (kind === "server" && got.type !== "image/png")) problems.push(`${path}: the card is not a PNG (${got.type} ${got.kind})`);
			}
		}
		const ogUrl = metas(tags, "og:url");
		const want = new URL(path, SITE).href;
		if (ogUrl.length !== 1 || ogUrl[0] !== want) problems.push(`${path}: og:url ${JSON.stringify(ogUrl)}, expected ${want}`);
		const type = metas(tags, "og:type");
		const wantType = isArticle(path) ? "article" : "website";
		if (type.length !== 1 || type[0] !== wantType) problems.push(`${path}: og:type ${JSON.stringify(type)}, expected ${wantType}`);
		const card = metas(tags, "twitter:card");
		if (card.length !== 1) problems.push(`${path}: ${card.length} twitter:card tags (expected 1)`);
		const feeds = tags.filter(([t, a]) => t === "link" && a.rel === "alternate" && a.type === "application/rss+xml");
		if (feeds.length !== 1 || feeds[0][1].href !== `${SITE}/rss.xml`) problems.push(`${path}: ${feeds.length} RSS alternate links (expected 1, href ${SITE}/rss.xml)`);
		for (const name of ["twitter:title", "twitter:description", "twitter:image"])
			if (metas(tags, name).length > 1) problems.push(`${path}: ${name} appears ${metas(tags, name).length} times`);
	}
	if (h.fixturesLoaded && !photos) problems.push(`share: no page with a photo was checked (the fixture post ${PHOTO_POST} should show one)`);
	// A path that is no public page has no card.
	const missing = await fetch(`${h.base}/og/no-such-page/card.png`, { redirect: "manual" });
	if (missing.status !== 404) problems.push(`/og/no-such-page/card.png: status ${missing.status}, expected 404`);
	// The noindex page has no card of its own (it shares the home card).
	if (h.fixturesLoaded) {
		const res = await fetch(h.base + cardPath(NOINDEX_PAGE), { redirect: "manual" });
		if (res.status !== 404) problems.push(`${cardPath(NOINDEX_PAGE)}: status ${res.status}, expected 404 (a noindex page has no card)`);
	}
	// The home card's title is the site's tagline; the site name stays in its footer line. Fixed pages have no label.
	const snap = await h.snapshot();
	const tagline = snap.site?.settings?.tagline;
	if (snap.error) problems.push(`share cards: ${snap.error}`);
	else {
		const home = snap.cards?.find((c) => c.path === "/");
		if (!tagline || home?.title !== tagline) problems.push(`/: the home card's title ${JSON.stringify(home?.title)} is not the tagline ${JSON.stringify(tagline)}`);
		for (const path of ["/", "/posts", "/guides"]) {
			const c = snap.cards?.find((x) => x.path === path);
			if (!c || c.label !== undefined) problems.push(`${path}: card ${JSON.stringify(c)} (expected one, with no label)`);
		}
	}
	return problems;
}

/**
 * The model as every source maps it (src/content/snapshot.route.ts): each demo guide's series and part, and the
 * guides in their sort order (series title, part, slug), with the fixture guides last, by slug: they tie on series
 * title and part. And the welcome post's inline author.
 */
async function modelProblems(h) {
	const snap = await h.snapshot();
	if (snap.error) return [`snapshot: ${snap.error}`];
	const problems = [];
	for (const [slug, part] of [["install", 1], ["pick-a-preset", 2], ["build-a-page", 3]]) {
		const want = { slug: "getting-started", title: "Getting started", part };
		const got = snap.guideSeries?.[slug];
		if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`guide "${slug}": series ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
	}
	const order = (snap.collections?.guides ?? []).map((g) => g.slug);
	const want = ["install", "pick-a-preset", "build-a-page", ...(h.fixturesLoaded ? fixtureEntries("guides").map((e) => e.slug) : [])];
	if (order.join() !== want.join()) problems.push(`guides: order [${order.join(", ")}], want [${want.join(", ")}]`);
	// A post's inline author, the same from every source.
	const author = snap.entries?.posts?.welcome?.author;
	const wantAuthor = { name: "Nora Whitfield", role: "Founder" };
	if (JSON.stringify(author) !== JSON.stringify(wantAuthor)) problems.push(`post "welcome": author ${JSON.stringify(author)}, want ${JSON.stringify(wantAuthor)}`);
	return problems;
}

/** The EmDash edit-mode cookie (EmDash reads it in its request-context middleware). */
const EDIT_COOKIE = "emdash-edit-mode=true";
const PRIVATE = "private, no-store";
/** Signs of edit-mode output that must never reach an anonymous visitor: EmDash's toolbar and edit attributes. */
const EDIT_OUTPUT = /id="emdash-toolbar"|data-emdash-ref/;

/**
 * Private responses (server builds): edit-mode and preview-token requests get `private, no-store` on every
 * response, the feed, the sitemap and the card PNG included, while anonymous ones stay public. Run first, so the
 * editor-first URLs have had no request yet on this server: each gets an edit-mode request, then an anonymous one,
 * which must not be a route cache hit of it nor carry edit-mode output.
 */
async function privateResponseProblems(kind, h) {
	if (kind !== "server") return [];
	const problems = [];
	const ask = async (path, cookie) => {
		const res = await fetch(h.base + path, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });
		const type = res.headers.get("content-type") ?? "";
		const body = /^(text|application\/(xml|rss|json))/.test(type) ? await res.text() : "";
		return { status: res.status, cache: res.headers.get("cache-control") ?? "", hit: res.headers.get("x-astro-cache") ?? "", body };
	};
	// Editor first, then anonymous: HTML, XML, JSON and PNG.
	for (const path of ["/about", "/rss.xml", "/_snapshot.json", "/og/card.png"]) {
		const edit = await ask(path, EDIT_COOKIE);
		if (edit.cache !== PRIVATE) problems.push(`${path} in edit mode (first request): Cache-Control is "${edit.cache}", not "${PRIVATE}"`);
		const anon = await ask(path);
		if (anon.status !== 200) problems.push(`${path} after edit mode: status ${anon.status}`);
		if (anon.hit === "HIT") problems.push(`${path} after edit mode: a route cache hit`);
		if (anon.cache.includes("private")) problems.push(`${path} after edit mode: anonymous Cache-Control is "${anon.cache}"`);
		if (EDIT_OUTPUT.test(anon.body)) problems.push(`${path} after edit mode: anonymous response carries edit-mode output`);
	}
	// Edit mode and a preview token on the site files; anonymous ones keep their public cache headers.
	for (const [path, publicCache] of [
		["/sitemap.xml", "public, max-age=3600"],
		["/rss.xml", "public, max-age=3600"],
		["/og/card.png", "public, max-age=86400"],
	]) {
		const edit = await ask(path, EDIT_COOKIE);
		if (edit.cache !== PRIVATE) problems.push(`${path} in edit mode: Cache-Control is "${edit.cache}", not "${PRIVATE}"`);
		const preview = await ask(`${path}?_preview=x`);
		if (preview.cache !== PRIVATE) problems.push(`${path}?_preview=x: Cache-Control is "${preview.cache}", not "${PRIVATE}"`);
		const anon = await ask(path);
		if (anon.cache !== publicCache) problems.push(`${path} anonymous: Cache-Control is "${anon.cache}", not "${publicCache}"`);
	}
	return problems;
}

/**
 * Behavior checks for the served build: head tags, rendered rich text, and
 * search (the source's request search on server builds, Pagefind on static ones). `kind` is the
 * value `serve()` returned ("server" or "static"); `h` is the harness.
 * Returns problems.
 */
async function assertPages(kind, h) {
	const get = h.get;
	const problems = [];
	const pages = {};
	// First, before any other request reaches the editor-first URLs.
	problems.push(...(await privateResponseProblems(kind, h)));
	for (const path of ["/", "/posts/welcome"]) pages[path] = await get(path);

	for (const path of ["/", "/posts/welcome"]) problems.push(...headProblems(path, pages[path].html));

	// The light and dark switch on every page (the 404 page too): one in the nav bar, named, hidden without
	// JavaScript, 44px on touch, and the no-flash script first in <head>; a second one in the phone menu's panel (shown
	// below 375px in place of the bar's). With modeSwitch off (src/theme.look.ts): no switch and no script.
	const count = modeSwitch ? 1 : 0;
	for (const path of PATHS) problems.push(...modeProblems(path, (await get(path)).html, { count, inMenu: count }));

	for (const [path, h2] of [
		["/posts/welcome", "What to do next"],
	]) {
		if (pages[path].status !== 200) problems.push(`${path}: status ${pages[path].status}`);
		else if (!mainH2s(pages[path].html).includes(h2)) problems.push(`${path}: <main> has no <h2> "${h2}"`);
	}

	// The test-only noindex page: one robots meta (the product's; EmDash's own is dropped) and no search index body.
	if (h.fixturesLoaded) {
		const page = await h.get(NOINDEX_PAGE);
		const robots = [...page.html.matchAll(/<meta\b[^>]*\bname=["']robots["'][^>]*>/g)].map((m) => m[0]);
		if (page.status !== 200) problems.push(`${NOINDEX_PAGE}: status ${page.status}`);
		else if (robots.length !== 1 || !/content=["']noindex["']/.test(robots[0])) problems.push(`${NOINDEX_PAGE}: expected one <meta name="robots" content="noindex">, found ${robots.length ? robots.join(" ") : "none"}`);
		if (/data-pagefind-body/.test(page.html)) problems.push(`${NOINDEX_PAGE}: has data-pagefind-body (it must stay out of the search index)`);
	}

	problems.push(...(await siteFileProblems(kind, h)));
	problems.push(...(await shareProblems(kind, h)));
	problems.push(...(await modelProblems(h)));

	// On any build, a visitor's details never go to a placeholder address (src/utils/placeholders.ts; test:settings has the cases).
	for (const path of ["/contact", "/posts"]) if (/<form\b[^>]*\baction=["'](https?:)?\/\/([^"'/]+\.)?example(\.(com|org|net))?[/"'.]/i.test((await h.get(path)).html)) problems.push(`${path}: a form posts to a placeholder address`);

	const hasForm = /<form\b[^>]*\baction\s*=\s*["']\/search["']/.test(pages["/"].html);
	if (!hasForm) problems.push(`/: no header search form (form[action="/search"]) on a ${kind} build`);
	else if (!/<form\b[^>]*\baria-label\s*=\s*["']Site search["']/.test(pages["/"].html)) problems.push(`/: the header search form has no aria-label="Site search"`);
	// Search mode: the source's request search on a server build, Pagefind on a static one.
	const searchPart = (html) => html.match(/<div\b[^>]*\bdata-search-page\b[^>]*>/)?.[0] ?? "";
	const indexed = (html) => /<main\b[^>]*\bdata-pagefind-body\b/.test(html);
	// The title comes before the live regions (the count, "no results"), outside them; the count is its own live region.
	const headerOutsideLive = (path, html) => {
		const part = html.slice(Math.max(0, html.search(/<div\b[^>]*\bdata-search-page\b/)));
		const h1 = part.indexOf("<h1");
		if (h1 < 0 || /aria-live/.test(part.slice(0, h1))) problems.push(`${path}: the <h1> is missing or inside a live region`);
		if (!/<p\b[^>]*data-count-text[^>]*aria-live="polite"/.test(part)) problems.push(`${path}: no [data-count-text] with aria-live="polite"`);
	};
	const entryPages = ["/posts/welcome", "/about", "/guides/install"];
	for (const path of ["/about", "/guides/install"]) pages[path] = await get(path);
	// A guide's body renders its own headings.
	if (pages["/guides/install"].status !== 200) problems.push(`/guides/install: status ${pages["/guides/install"].status}`);
	else if (!mainH2s(pages["/guides/install"].html).includes("Choose where content lives")) problems.push(`/guides/install: <main> has no <h2> "Choose where content lives"`);
	// The test-only noindex entries stay out of the static index.
	const hidden = h.fixturesLoaded ? [NOINDEX_PAGE, ...fixtureEntries("posts", { noindex: true }).map((e) => `/posts/${e.slug}`)] : [];
	if (kind === "server") {
		// A guide's title: guides are searchable.
		const s = await get("/search?q=preset");
		if (s.status !== 200) problems.push(`/search?q=preset: status ${s.status}`);
		else {
			if (!/href\s*=\s*["']\/guides\/pick-a-preset\/?["']/.test(s.html)) problems.push(`/search?q=preset: no link to /guides/pick-a-preset`);
			const input = s.html.match(/<input\b[^>]*\bid\s*=\s*["']site-search["'][^>]*>/)?.[0] ?? "";
			if (!/\bvalue\s*=\s*["']preset["']/.test(input)) problems.push(`/search?q=preset: the header search box does not hold the query`);
			headerOutsideLive("/search?q=preset", s.html);
			const part = searchPart(s.html);
			if (!/data-mode="request"/.test(part) || !/data-state="results"/.test(part))
				problems.push(`/search?q=preset: expected data-search-page with data-mode="request" and data-state="results", found ${part || "none"}`);
		}
		for (const path of entryPages) if (/data-pagefind-body|data-pagefind-meta/.test(pages[path].html)) problems.push(`${path}: search index markup on a server build`);
	} else {
		const s = await get("/search");
		if (h.pageText(s.html).includes("Search is not available")) problems.push(`/search: says search is not available on a static build`);
		if (!/data-mode="static"/.test(searchPart(s.html))) problems.push(`/search: no data-search-page with data-mode="static"`);
		headerOutsideLive("/search", s.html);
		const pf = await fetch(`${h.base}/pagefind/pagefind.js`);
		if (pf.status !== 200) problems.push(`/pagefind/pagefind.js: status ${pf.status}`);
		for (const path of entryPages) if (!indexed(pages[path].html)) problems.push(`${path}: <main> has no data-pagefind-body (static search must index it)`);
		if (indexed(pages["/"].html)) problems.push(`/: <main> has data-pagefind-body (only entry pages are indexed)`);
		if (indexed(s.html)) problems.push(`/search: <main> has data-pagefind-body (only entry pages are indexed)`);
		for (const path of hidden) if (/data-pagefind-body|data-pagefind-meta/.test((await get(path)).html)) problems.push(`${path}: noindex entry has search index markup`);
	}

	// "Astronomic UI" in the home hero and every footer, nowhere else in <main> (light branding: the site's own name
	// is content, in the nav bar and the titles). One <h1> on every page.
	const BRAND = "Astronomic UI";
	/** The text of the first <tag> element: tags removed, spaces collapsed. */
	const part = (html, tag) => (html.match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`))?.[0] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
	if (!part((await get("/")).html, "h1").includes(BRAND)) problems.push(`/: the hero's <h1> does not say "${BRAND}"`);
	for (const [path, status] of Object.entries(PAGES)) {
		const html = (await get(path)).html;
		const h1s = (html.match(/<h1\b/g) ?? []).length;
		if (h1s !== 1) problems.push(`${path}: ${h1s} <h1> (expected 1)`);
		if (status !== 200) continue;
		// The site footer: the page's last <footer> (a kit part in <main> may have its own).
		if (!part(html.slice(html.lastIndexOf("<footer")), "footer").includes(BRAND)) problems.push(`${path}: the footer does not say "${BRAND}"`);
		const inMain = part(html, "main").split(BRAND).length - 1;
		const want = path === "/" ? 1 : 0;
		if (inMain !== want) problems.push(`${path}: <main> says "${BRAND}" ${inMain} times (expected ${want})`);
	}
	return problems;
}

export default {
	root,
	pages,
	assertPages,
	fixtures,
	snapshot: true,
	paritySkip: "data-parity-skip",
};
