/** A post as the kit's posts family wants it, and the term links. */
import type { PostItem } from "@astronomic/ui/components/PostCard.astro";
import type { Post, Term } from "~/content";

export const postHref = (slug: string) => `/posts/${slug}`;
export const categoryHref = (slug: string) => `/category/${slug}`;
export const tagHref = (slug: string) => `/tag/${slug}`;
export const guideHref = (slug: string) => `/guides/${slug}`;

/** The post's first category as the card's topic. */
export const topicOf = (post: Pick<Post, "categories">) =>
	post.categories[0] ? { label: post.categories[0].label, href: categoryHref(post.categories[0].slug) } : undefined;

/** An author's photo for the kit's Avatar: a plain <img> (no imageComponent there), so the string src. */
export const authorImage = (author: Post["author"]) =>
	author?.image ? { src: author.image.src, width: author.image.width, height: author.image.height } : undefined;

/** A post as a kit PostItem. The photo's src is the content image itself (KitImage draws it). */
export function postItem(post: Post): PostItem {
	return {
		href: postHref(post.slug),
		title: post.title,
		date: post.date,
		excerpt: post.excerpt,
		image: post.image ? { src: post.image, width: post.image.width, height: post.image.height } : undefined,
		topic: topicOf(post),
		author: post.author ? { name: post.author.name, image: authorImage(post.author) } : undefined,
	};
}

/** Terms as kit FilterNav links, the current one marked. */
export const termLinks = (terms: Term[], href: (slug: string) => string, current?: string) =>
	terms.map((t) => ({ label: t.label, href: href(t.slug), current: t.slug === current }));
