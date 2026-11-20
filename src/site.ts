/**
 * The site's own words: everything a page says that is not content. Replace them with yours.
 *
 * Content (posts, guides, pages, the menu, the site name) lives in content/ (Markdown) or in EmDash. This file holds
 * the words the page code shows around it: the home page's sections, the blog list's sign-up, the About and Contact
 * extras, the footer, and where the two forms post. Keep "Astronomic UI" only where you want it: here it is in the
 * hero and the footer (the site name, in the nav bar and the page titles, is in the content).
 */
import type { FeatureIconItem } from "@astronomic/ui/components/FeatureGridIcons.astro";
import type { FooterColumn } from "@astronomic/ui/components/FooterColumns.astro";
import type { LogoStripItem } from "@astronomic/ui/components/LogoStrip.astro";
import type { StatItem } from "@astronomic/ui/components/Stats.astro";
import type { StepsItem } from "@astronomic/ui/components/StepItem.astro";
import type { TeamMemberItem } from "@astronomic/ui/components/TeamMember.astro";
import type { TestimonialItem } from "@astronomic/ui/components/Testimonial.astro";
import Blocks from "./icons/blocks.svg";
import FileText from "./icons/file-text.svg";
import Moon from "./icons/moon.svg";
import Palette from "./icons/palette.svg";
import Search from "./icons/search.svg";
import Smartphone from "./icons/smartphone.svg";

/**
 * Where the forms post. Each is a placeholder, so nothing is sent until you set yours: your newsletter tool's form URL
 * (Kit, Buttondown, Mailchimp, ...) and your form service's URL. Until then a preview's form only says it is a demo, and a
 * live site leaves the form out (src/utils/placeholders.ts): /contact shows the email if it is real, and /posts has no sign-up.
 */
export const forms = {
	newsletter: { action: "https://example.com/newsletter/subscribe", emailName: "email" },
	contact: { action: "https://example.com/contact-form" },
	/** A hidden field bots fill in and people do not: name it as your form service expects. */
	honeypot: { name: "website" },
	/** What a form on a placeholder address says when it is sent. */
	demoSent: "This is a demo, so nothing was sent.",
};

/** The button at the end of the nav bar. */
export const navAction = { label: "Get started", href: "/guides/install" };

export const home = {
	hero: {
		eyebrow: "Free starter",
		heading: "Build your next site with Astronomic UI",
		text: "Free Astro parts that fit together. Replace our words with yours, keep the parts, and change the look with one line.",
		actions: [
			{ label: "Get started", href: "/guides/install" },
			{ label: "Read the blog", href: "/posts" },
		],
		/** The kit preview beside the heading (src/components/KitPreview.astro): real parts in the current look. Words only; replace or remove it. */
		preview: {
			badge: "New",
			heading: "Get the monthly notes",
			text: "One email a month. No spam.",
			emailLabel: "Email",
			emailPlaceholder: "you@example.com",
			submitLabel: "Subscribe",
			secondaryLabel: "Later",
			stat: { value: "6", label: "Looks" },
			person: "Nora Whitfield",
		},
	},
	logos: {
		label: "Works with",
		// Names as text (no logos): the marks belong to their owners.
		items: [
			{ name: "Astro", href: "https://astro.build" },
			{ name: "EmDash", href: "https://emdashcms.com" },
			{ name: "Tailwind CSS", href: "https://tailwindcss.com" },
		] satisfies LogoStripItem[],
	},
	features: {
		eyebrow: "What you get",
		heading: "Everything a small site needs",
		text: "Each part is made to work with the others, on any screen, in light and dark.",
		items: [
			{ title: "Parts that fit", text: "Navigation, sections, forms and footers share one set of design tokens.", icon: Blocks },
			{ title: "A new look in one line", text: "Switch from Minimal to Soft, Ink or another preset with one line of CSS.", icon: Palette },
			{ title: "Light and dark", text: "Every page reads well in both, and visitors can pick.", icon: Moon },
			{ title: "Your content, your way", text: "Write in Markdown files, or edit in EmDash.", icon: FileText },
			{ title: "Search built in", text: "Search works on a static site and on a server.", icon: Search },
			{ title: "Ready for phones", text: "Each part sizes to its own box, from a phone to a wide screen.", icon: Smartphone },
		] satisfies FeatureIconItem[],
	},
	/**
	 * Pictures of the parts in use, beside short text (FeatureRows). The pictures are in src/assets/kit/ (the page
	 * imports them); replace them with your product's.
	 */
	inUse: {
		eyebrow: "Screenshots",
		heading: "See it in use",
		text: "Real pages from this starter: three looks, dark mode and a phone.",
		items: [
			{
				title: "One set of parts, many looks",
				text: "The same home page in Ink, Playful and Soft. Only the look line changed.",
				alt: "The home page in three looks, Ink, Playful and Soft, in overlapping browser windows",
			},
			{
				title: "Dark mode on every page",
				text: "Visitors pick light or dark, and every part follows. Photos keep their own color.",
				alt: "A blog post in dark mode, with its cover photo of a laptop keyboard",
			},
			{
				title: "Made for phones",
				text: "Each part sizes to its own box, so pages read well on a small screen.",
				alt: "Two phone screens: the home page in the Playful look, and the install guide",
			},
		],
	},
	/**
	 * The "get started" band: the steps down the start column, the demo look switch and the code beside them. Step 2
	 * points at the switch. The switch (src/components/LookSwitch.astro) and the code (src/components/LookCode.astro)
	 * read `look`; the band's heading and the steps are here.
	 */
	steps: {
		eyebrow: "Get started",
		heading: "From install to launch",
		text: "Three short steps. The look is one line of CSS, and every page follows it: type, color, corners and spacing.",
		items: [
			{ title: "Install", text: "Copy the starter, install the packages, and start the dev server." },
			{ title: "Pick a look", text: "Try each one with the buttons here. On your site, the look is one line in src/styles/global.css." },
			{ title: "Ship", text: "Replace our words with yours, then deploy." },
		] satisfies StepsItem[],
	},
	look: {
		/** The file the code sample shows, and the look its marked line turns on when the switch cannot run. */
		file: "src/styles/global.css",
		example: "soft",
		/** The demo switch: try each look on this page. It does not save the choice. */
		switchLabel: "Try a look",
		looks: [
			{ id: "minimal", name: "Minimal" },
			{ id: "clean", name: "Clean" },
			{ id: "modern", name: "Modern" },
			{ id: "playful", name: "Playful" },
			{ id: "soft", name: "Soft" },
			{ id: "ink", name: "Ink" },
		],
	},
	posts: { eyebrow: "Latest posts", heading: "From the blog", viewAll: { label: "All posts", href: "/posts" }, empty: "No posts yet." },
	cta: {
		heading: "Start building today",
		text: "Follow the three-part guide and have your first page up in an afternoon.",
		actions: [
			{ label: "Start the guide", href: "/guides/install" },
			{ label: "Contact us", href: "/contact" },
		],
	},
};

/** The blog list (/posts): the newsletter sign-up after the posts. It posts to forms.newsletter. */
export const blog = {
	newsletter: {
		heading: "Get updates",
		text: "New posts and releases, about once a month. No spam.",
		emailLabel: "Email",
		emailPlaceholder: "you@example.com",
		submitLabel: "Subscribe",
	},
};

export const about = {
	stats: {
		heading: "At a glance",
		text: "Replace these with your own numbers.",
		items: [
			{ value: "2026", label: "Founded" },
			{ value: "3", label: "People" },
			{ value: "100%", label: "Remote", text: "Across three US time zones." },
		] satisfies StatItem[],
	},
	image: { src: "/images/about.svg", alt: "A drawing of a web page made of blocks", width: 1200, height: 900 },
	team: {
		heading: "The team",
		text: "The people behind the product.",
		// The two writers on the blog (their posts' bylines), and one more.
		items: [
			{ name: "Nora Whitfield", role: "Founder" },
			{ name: "Marcus Delgado", role: "Engineer" },
			{ name: "Nadia Abernathy", role: "Customer support" },
		] satisfies TeamMemberItem[],
	},
	testimonials: {
		heading: "What customers say",
		text: "Replace these with real quotes from your customers, with their permission.",
		items: [
			{ quote: "Your customer's words go here. Say what changed for them, in their words.", name: "Customer Name", role: "Their role", company: "Their company", avatar: false },
			{ quote: "Your customer's words go here. One or two sentences read best.", name: "Customer Name", role: "Their role", company: "Their company", avatar: false },
			{ quote: "Your customer's words go here. Ask before you use their name.", name: "Customer Name", role: "Their role", company: "Their company", avatar: false },
		] satisfies TestimonialItem[],
	},
};

export const contact = {
	heading: "Send a message",
	/** The heading when the site has no form yet. */
	reachHeading: "Get in touch",
	/** What the page says on a live site with no form and no email yet (src/utils/placeholders.ts). */
	noChannel: "We are still setting up our email and contact form. Please check back soon.",
	text: "Questions, bug reports and ideas are all welcome.",
	email: "hello@example.com",
	submitLabel: "Send message",
};

export const footer = {
	columns: [
		{ heading: "Site", links: [{ label: "Blog", href: "/posts" }, { label: "Guides", href: "/guides" }, { label: "Search", href: "/search" }] },
		{ heading: "Company", links: [{ label: "About", href: "/about" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }] },
	] satisfies FooterColumn[],
	builtWith: { label: "Astronomic UI", href: "https://astronomic.dev" },
};
