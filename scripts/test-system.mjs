#!/usr/bin/env node
/**
 * `pnpm test:system [source ...]` (default: markdown emdash mixed)
 *
 * Checks the design system pages (`astronomicSystem()` in astro.config.mjs)
 * for each source, in two builds:
 *   1. No leak: a normal build (no ASTRONOMIC_SYSTEM). /system and its three
 *      sub-pages return 404, no `system` dir is written to the out dir, and
 *      the home page has no link to /system (the footer link is off).
 *   2. Render: a build with ASTRONOMIC_SYSTEM=1. All four pages return 200
 *      with their `data-system-page` marker, foundations has at least 10
 *      `data-token` swatches, and if the config sets `sections` the sections
 *      page does not show the "no sections file" stub. The home page links to
 *      /system. If the config sets `screens`, /system shows one preview per
 *      listed screen, and each screen answers with its status (200, or the
 *      `status` it lists, e.g. 404).
 * Builds into dist-system-off-<source> and dist-system-on-<source>, removes
 * them at the end. Never modifies source files. EmDash needs a seeded data.db.
 */
import { runSystem } from "@astronomic/theme-core/scripts/system.mjs";
import config from "./theme-tests.mjs";

await runSystem(config);
