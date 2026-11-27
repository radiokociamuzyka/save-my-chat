// @vitest-environment jsdom
// The viewer (src/viewer/): a saved file read back, and a message's Markdown shown
// without innerHTML, raw HTML, unsafe links or images loaded.
import { runInThisContext } from "node:vm";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { fromFile, fromJson, fromMarkdown } from "../src/viewer/conversation.js";
import MarkdownText from "../src/viewer/MarkdownText.vue";
import { load } from "./load.js";

const CHAT = {
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: 'https://github.com/copilot/c/1?a="b"' },
	title: 'Fix "the" build: ## User',
	savedAt: "2026-11-27T10:00:00.000Z",
	turns: [
		{ role: "user", text: "Why does it fail?\n## User\nnot a section: no blank line before" },
		{ role: "assistant", text: "Missing `await`.\n\n```js\nawait x();\n```", author: "GPT-5" },
		{ role: "user", text: "Thanks." },
	],
};

describe("the viewer: files read back", () => {
	it("reads the Markdown that core/markdown.js writes into the same conversation", () => {
		runInThisContext(load.source("core/kit.js"));
		runInThisContext(load.source("core/markdown.js"));
		const md = globalThis.SaveMyChat.toMarkdown(CHAT);
		expect(fromMarkdown(md)).toEqual(CHAT);
		expect(fromFile("x.md", md)).toEqual(CHAT);
	});

	it("reads the JSON, and refuses what is not of the format", () => {
		expect(fromFile("x.JSON", JSON.stringify(CHAT))).toEqual(CHAT);
		expect(() => fromJson('{"format":"other"}')).toThrow(/unified format/);
		expect(() => fromJson(JSON.stringify({ ...CHAT, turns: [{ role: "x", text: "" }] }))).toThrow(/messages/);
		expect(() => fromMarkdown("---\ntitle: x\n")).toThrow(/does not end/);
	});
});

describe("the viewer: a message's Markdown", () => {
	const shown = (text) => mount(MarkdownText, { props: { text } });

	it("shows text, code, lists, tables and quotes as elements", () => {
		const m = shown(
			"# Head\n\n**b** _e_ `c`\n\n```js\nx < y\n```\n\n- [x] done\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n> q",
		);
		expect(m.find("h3").text()).toBe("Head");
		expect(m.find("strong").text()).toBe("b");
		expect(m.find("em").text()).toBe("e");
		expect(m.find("pre code").text()).toBe("x < y");
		expect(m.find("li input[type=checkbox]").element.checked).toBe(true);
		expect(m.findAll("td").map((td) => td.text())).toEqual(["1", "2"]);
		expect(m.find("blockquote").text()).toBe("q");
	});

	it("shows raw HTML as text, links only of http(s) and mailto, images by name only", () => {
		const m = shown(
			"<img src=x onerror=alert(1)> <b>b</b>\n\n[ok](https://a.org) [bad](javascript:alert(1))\n\n![a cat](https://cats.example/c.png)",
		);
		expect(m.find("img").exists()).toBe(false);
		expect(m.find("b").exists()).toBe(false);
		expect(m.text()).toContain("<img src=x onerror=alert(1)>");
		expect(m.findAll("a").map((a) => a.attributes("href"))).toEqual(["https://a.org"]);
		expect(m.find("a").attributes("rel")).toBe("noreferrer");
		expect(m.text()).toContain("[image: a cat]");
	});
});
