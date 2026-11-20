---
title: Install the site
excerpt: Get the site running on your computer in a few minutes.
series:
  ref: getting-started
  part: 1
---

You need Node 22.18 or later and pnpm.

## Install

- Get the files and open the folder in a terminal.
- Run `pnpm install` to add the packages.
- Run `pnpm dev` and open the address it prints.

## Choose where content lives

The site reads the Markdown files in `content/` by default. To use EmDash instead, change the content source in `astro.config.mjs`, then load the demo content with `pnpm seed:emdash`.
