#!/usr/bin/env node
/**
 * `pnpm test:adapter`
 *
 * Tests the selected content source: CONTENT_SOURCE if set, otherwise the one
 * astro.config.mjs selects. Builds it with the conformance route into a temp
 * out dir, serves it, prints /_conformance.json problems and page assertion
 * problems (head tags, rich text, search), exits 1 on any.
 * Works for any source in src/content/sources/. Never modifies source files.
 *
 *   pnpm test:adapter
 *   CONTENT_SOURCE=my-cms pnpm test:adapter
 */
import { runAdapter } from "@astronomic/theme-core/scripts/adapter.mjs";
import config from "./theme-tests.mjs";

await runAdapter(config);
