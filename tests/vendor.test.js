// src/vendor/ holds copies of npm packages, unchanged (task vendor), so AMO can
// compare them with the originals. A dependabot bump of package.json alone would
// leave the extension running the old copy: this fails until `task vendor` runs.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const COPIES = {
	"src/vendor/turndown.js": "node_modules/turndown/dist/turndown.js",
	"src/vendor/turndown.LICENSE": "node_modules/turndown/LICENSE",
	"src/vendor/turndown-plugin-gfm.js": "node_modules/turndown-plugin-gfm/dist/turndown-plugin-gfm.js",
	"src/vendor/turndown-plugin-gfm.LICENSE": "node_modules/turndown-plugin-gfm/LICENSE",
};

describe("vendored libraries", () => {
	for (const [copy, original] of Object.entries(COPIES)) {
		it(`${copy} is ${original} unchanged`, () => {
			expect(readFileSync(copy, "utf8") === readFileSync(original, "utf8")).toBe(true);
		});
	}
});
