// The wiki's translation of markdown and its pages, with a fake translator.
import { describe, expect, it } from "vitest";
import { expand, nameIn, relink } from "../scripts/wiki/build.mjs";
import { guard, join, translatePage, unguard, units } from "../scripts/wiki/translate.mjs";

// "translates" by upper-casing letters outside the {n} marks, like a translator would leave them
const shout = async (texts) =>
	texts.map((t) => t.replace(/\{\d+\}|[^{}]+/g, (s) => (s.startsWith("{") ? s : s.toUpperCase())));

const PAGE = `# A heading

A paragraph wrapped
over two lines, with \`code\` and [a link](../x.md).

> the owner's words, kept as written

\`\`\`js
const kept = "code";
\`\`\`

- **Met:** 2026-11-27, version v0.1.3 and 0.2.x
- [ ] a task

| Name | Value |
| --- | --- |
| width | 18rem |
`;

describe("wiki: markdown translated without breaking it", () => {
	it("cuts a page into units and joins it back, wrapped paragraphs as one line", () => {
		const back = join(units(PAGE));
		expect(back).toContain("A paragraph wrapped over two lines, with `code` and [a link](../x.md).");
		expect(back).toContain('```js\nconst kept = "code";\n```');
		expect(back).toContain("| --- | --- |");
	});

	it("guards code, link targets, paths, dates and versions, and refuses a lost mark", () => {
		const { plain, kept } = guard("see `x` in docs/a.md, [here](b.md) on 2026-11-27 for 0.2.x");
		expect(plain).toBe("see {0} in {1}, [here{2} on {3} for {4}");
		expect(unguard(plain, kept)).toBe("see `x` in docs/a.md, [here](b.md) on 2026-11-27 for 0.2.x");
		expect(unguard("lost {0} {1} {2} {3}", kept)).toBeNull();
		expect(unguard("[tekst {0}", ["](t)"])).toBe("[tekst](t)");
	});

	it("translates text, keeps quotes and code, and fills the memory", async () => {
		const memory = {};
		const { markdown } = await translatePage(PAGE, "pl", { memory, translate: shout });
		expect(markdown).toContain("# A HEADING");
		expect(markdown).toContain("A PARAGRAPH WRAPPED OVER TWO LINES, WITH `code` AND [A LINK](../x.md).");
		expect(markdown).toContain("> the owner's words, kept as written");
		expect(markdown).toContain('const kept = "code";');
		expect(markdown).toContain("- **MET:** 2026-11-27, VERSION v0.1.3 AND 0.2.x");
		expect(markdown).toContain("- [ ] A TASK");
		expect(markdown).toContain("| WIDTH | 18rem |");
		expect(memory["a task"]).toBe("A TASK");
	});

	it("asks the translator only for what the memory lacks", async () => {
		const memory = { "A heading": "Nagłówek" };
		const asked = [];
		await translatePage("# A heading\n\nNew text.", "pl", {
			memory,
			translate: async (texts) => {
				asked.push(...texts);
				return texts;
			},
		});
		expect(asked).toEqual(["New text."]);
	});
});

describe("wiki: pages", () => {
	it("expands a source pattern into a page per file, in natural order", () => {
		const pages = expand([{ page: "Changelog-phase-*", from: "docs/changelog/phase-*.md", group: "Changelog" }], () => [
			"phase-10.md",
			"phase-2.md",
			"notes.txt",
		]);
		expect(pages.map((p) => p.page)).toEqual(["Changelog-phase-2", "Changelog-phase-10"]);
	});

	it("links to the wiki page of a source, else to GitHub, in the page's language", () => {
		const byPath = new Map([["docs/almanac/solutions/manifest.md", "Almanac-topic-manifest"]]);
		const md = "[topic](../solutions/manifest.md#x) and [code](../../../src/core/kit.js) and [web](https://x.y)";
		expect(relink(md, "docs/almanac/cataclistics/a.md", byPath, "pl", "en")).toBe(
			"[topic](Almanac-topic-manifest-pl#x) and [code](https://github.com/radiokociamuzyka/save-my-chat/blob/master/src/core/kit.js) and [web](https://x.y)",
		);
		expect(nameIn("Home", "en", "en")).toBe("Home");
	});
});
