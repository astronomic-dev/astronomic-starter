#!/usr/bin/env node
/**
 * `pnpm test:parity [source ...]` (default: markdown emdash mixed)
 *
 * Builds each source into its own out dir (dist-<source>), runs conformance,
 * checks expected page statuses and the page assertions (head tags, rich
 * text, search; see assertPages in theme-tests.mjs), then compares every
 * source against the first:
 *   - model snapshots: each collection's mapped data, normalized
 *     (/_snapshot.json, see src/content/snapshot.route.ts);
 *   - pages: status, <title>, and <main> text without <aside>.
 * Removes the out dirs at the end. Never modifies source files. EmDash needs
 * a seeded data.db.
 */
import { runParity } from "@astronomic/theme-core/scripts/parity.mjs";
import config from "./theme-tests.mjs";

await runParity(config);
