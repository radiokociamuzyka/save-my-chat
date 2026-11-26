import { describe, expect, it } from "vitest";
import { KIT, load } from "./load.js";

const conversation = {
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/1" },
	title: 'Zażółć "gęślą" jaźń',
	savedAt: "2026-11-26T10:00:00.000Z",
	turns: [
		{ role: "user", text: "Question?" },
		{ role: "assistant", text: "Answer.", author: "GPT-5" },
	],
};

describe("conversation to a .md file", () => {
	const S = load([...KIT, "core/markdown.js"]).SaveMyChat;

	it("has front matter, a title and one section per turn", () => {
		expect(S.toMarkdown(conversation)).toBe(
			[
				"---",
				"format: save-my-chat/0",
				'title: "Zażółć \\"gęślą\\" jaźń"',
				"reader: github-copilot",
				'service: "github.com/copilot"',
				'url: "https://github.com/copilot/c/1"',
				"saved: 2026-11-26T10:00:00.000Z",
				"---",
				"",
				'# Zażółć "gęślą" jaźń',
				"",
				"## User",
				"",
				"Question?",
				"",
				"## Assistant (GPT-5)",
				"",
				"Answer.",
				"",
			].join("\n"),
		);
	});

	it("names the file by reader, day and title", () => {
		expect(S.fileName(conversation, "md")).toBe("save-my-chat/github-copilot/2026-11-26-zazolc-gesla-jazn.md");
		expect(S.slug("!!!")).toBe("chat");
	});
});
