#!/usr/bin/env node
/**
 * `pnpm test:no-emdash`
 *
 * Proves a Markdown build does not need `emdash`, `@emdash-cms/*` or
 * `@astrojs/node` (ADR 0003, blocker 1):
 *   1. Static: astro.config.mjs and everything it imports at top level, plus
 *      the markdown source's setup file, import none of them.
 *   2. Build: CONTENT_SOURCE=markdown under a guard that fails on any
 *      resolution of them: a Node resolve hook (config, setup files,
 *      integrations) plus a Vite plugin that astro.config.mjs adds when
 *      CONTENT_FORBID is set (bundled code; Vite does not resolve via Node).
 *   3. Self-check: the same guard must FAIL every source that uses EmDash
 *      (emdash, mixed), so a passing Markdown build means something (each is
 *      skipped if its source file does not exist).
 * Never modifies source files.
 */
import { runNoEmdash } from "@astronomic/theme-core/scripts/no-emdash.mjs";
import config from "./theme-tests.mjs";

await runNoEmdash(config);
