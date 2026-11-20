/**
 * Every screen the starter provides, for the design system overview
 * (/system). Each one shows as a live preview of the real page. Paths use the
 * demo content; change a slug here if you rename or remove that entry.
 */
import type { Screen } from "virtual:astronomic-system";

export const screens: Screen[] = [
	{ name: "Home", path: "/", description: "The product page: hero, features, steps, the latest posts and the call to action." },
	{ name: "Blog", path: "/posts", description: "Every post, newest first, with the category filter, pages and the newsletter sign-up." },
	{ name: "Post", path: "/posts/welcome", description: "One post with its byline, tags and author." },
	{ name: "Category", path: "/category/design", description: "The posts in one category." },
	{ name: "Tag", path: "/tag/tips", description: "The posts with one tag." },
	{ name: "Guides", path: "/guides", description: "Every guide series and its parts." },
	{ name: "Guide", path: "/guides/install", description: "One part of a series, with the parts beside it and the pager." },
	{ name: "About", path: "/about", description: "The about page with the numbers, the team and the quotes." },
	{ name: "Contact", path: "/contact", description: "The contact details beside the message form." },
	{ name: "Page", path: "/privacy", description: "A plain page from the pages collection." },
	{ name: "Not found", path: "/no-such-page", description: "The 404 page for any address that does not exist.", status: 404 },
	{
		name: "Search",
		path: "/search?q=preset",
		description: "Results for a search from the header.",
		note: "In a static build the results load in the browser (Pagefind); in a server build (EmDash) the server finds them.",
	},
];
