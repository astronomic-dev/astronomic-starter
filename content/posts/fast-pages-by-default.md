---
title: Fast pages by default
date: 2026-10-15
excerpt: Plain HTML, small scripts and well-sized images keep the site quick.
image: ../media/posts/fast-pages-by-default.webp
imageAlt: A laptop keyboard and trackpad on a white marble desk
categories: [product]
tags: [performance, tips]
author:
  name: Marcus Delgado
  role: Engineer
---

Most pages on this site are plain HTML. They load quickly on any phone and any connection.

## What keeps it fast

- Pages ship as HTML, with no app to download first.
- Scripts load only where a part needs them.
- Images get the right size for each screen.

## Check it yourself

Run `pnpm build`, then `pnpm preview`, and open the network panel in your browser. Most pages load very little JavaScript.
