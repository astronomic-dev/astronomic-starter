/**
 * The light and dark switch's setting: `modeSwitch` in src/theme.look.ts, checked. The layout and the page tests
 * (scripts/theme-tests.mjs) read it here.
 *
 * A look file from before the setting has none: that counts as on, the default. A value that is not true or false
 * stops dev and build. The file is read as a whole (a copy of its exports), so a missing export is no build error
 * or warning.
 *
 * Plain Node loads this file (scripts/theme-tests.mjs), so it imports nothing Node cannot load.
 */
import * as lookFile from "../theme.look.ts";

/** `value` as the switch's setting: true when it is missing; throws when it is not true or false. */
export function readModeSwitch(value: unknown, where = "src/theme.look.ts"): boolean {
	if (value === undefined) return true;
	if (typeof value !== "boolean") throw new Error(`${where}: modeSwitch is ${JSON.stringify(value)}. Use true or false.`);
	return value;
}

export const modeSwitch: boolean = readModeSwitch(({ ...lookFile } as { modeSwitch?: unknown }).modeSwitch);
