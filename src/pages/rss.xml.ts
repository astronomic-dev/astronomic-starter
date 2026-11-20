/**
 * The posts' RSS feed: the newest 50 posts, each with its excerpt (no full
 * text). The title is the site title and the description its tagline; edit
 * them here.
 */
import { feedItems, rssResponse } from "@astronomic/theme-core/feeds";
import type { APIRoute } from "astro";
import { type Post, useContent } from "~/content";
import { siteOrigin } from "../utils/public-pages";

export const GET: APIRoute = async (context) => {
	const content = useContent();
	// `seo: true`: each post's noindex, so hidden posts stay out of the feed.
	const [settings, { items: posts }] = await Promise.all([content.settings(), content.posts.list({ seo: true })]);
	const items = feedItems<Post, Post>(
		posts.filter((post) => !post.seo?.noindex),
		{
			item: (post) => ({
				title: post.title,
				path: `/posts/${post.slug}`,
				date: post.date,
				description: post.excerpt,
				categories: post.categories.map((category) => category.label),
			}),
		},
	);
	return rssResponse({ site: siteOrigin(context), title: settings.title, description: settings.tagline || settings.title, items });
};
