// The media container (phase 6, Sett #7): what task media makes and places, held to what the
// manifest, the docs and the site use; the originals stay out of git.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DERIVED_FILES, originals, PLACED } from "../scripts/media.mjs";

const root = new URL("../", import.meta.url).pathname;
const read = (path) => readFileSync(`${root}${path}`, "utf8");

describe("media", () => {
	it("places only what it makes, and every placed file is in the repository", () => {
		const made = DERIVED_FILES.map(([name]) => name);
		for (const [name, to] of PLACED) {
			expect(made).toContain(name);
			expect(existsSync(`${root}${to}`), to).toBe(true);
		}
	});

	it("gives the manifest, the docs and the site the icons they name", () => {
		const manifest = JSON.parse(read("src/manifest.json"));
		const icons = [...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon)];
		for (const icon of icons) expect(PLACED.map(([, to]) => to)).toContain(`src/${icon}`);
		expect(read("mkdocs.yml")).toMatch(/favicon: assets\/favicon\.png[\s\S]*logo: assets\/logo\.png/);
	});

	it("fetches the index's files from its bucket, and git keeps only the index and the README", () => {
		const index = JSON.parse(read("resources/media/.index.json"));
		expect(originals(index)[0].url).toBe(
			"https://huggingface.co/buckets/Sarverott/mediacontainer/resolve/save-my-chat_poster.png",
		);
		expect(
			read("resources/media/.gitignore")
				.split("\n")
				.filter((l) => l && !l.startsWith("#")),
		).toEqual(["*", "!.gitignore", "!.index.json", "!README.md"]);
	});
});
