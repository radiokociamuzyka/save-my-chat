import { existsSync, readFileSync, rmSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { build, fill, planned, rows } from "../scripts/pages/build.mjs";

const OUT = "dist/pages-test";
const chats = [
	{ name: "A & B", status: "default", chats: ["https://a.example/c/*"], verified: true },
	{ name: "C", status: "default", chats: ["https://c.example/*"], verified: false },
	{ name: "D", status: "planned" },
	{ name: "E", status: "planned" },
];

describe("the static page", () => {
	afterAll(() => rmSync(OUT, { recursive: true, force: true }));

	it("has a row for each reader shipped, escaped, its state from verified", () => {
		const html = rows(chats);
		expect(html.split("\n")).toHaveLength(2);
		expect(html).toContain(
			"<td>A &amp; B</td><td><code>https://a.example/c/…</code></td><td>checked on live chats</td>",
		);
		expect(html).toContain("not yet checked on a live chat");
		expect(planned(chats)).toBe("D, E");
	});

	it("refuses a mark it has no value for", () => {
		expect(fill("v{{version}}", { version: "1" })).toBe("v1");
		expect(() => fill("{{missing}}", {})).toThrow(/missing/);
	});

	it("is built with every mark filled, every default reader listed and nothing loaded from elsewhere", () => {
		build({ out: OUT });
		const html = readFileSync(`${OUT}/index.html`, "utf8");
		const { version } = JSON.parse(readFileSync("package.json", "utf8"));
		expect(html).not.toMatch(/\{\{\w+\}\}/);
		expect(html).toContain(`Download v${version}`);
		for (const c of parse(readFileSync("resources/data/chats.yaml", "utf8")).chats.filter(
			(c) => c.status === "default",
		))
			expect(html).toContain(`<td>${c.name}</td>`);
		expect(html).not.toMatch(/<script/i);
		expect(html).not.toMatch(/<link[^>]+href="https?:/i);
		expect(readFileSync(`${OUT}/style.css`, "utf8")).not.toMatch(/@import|url\(/);
		expect(existsSync(`${OUT}/.nojekyll`)).toBe(true);
	});
});
