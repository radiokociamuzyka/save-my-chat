// The stored files (Q8): the library as a git repository on ZenFS, in memory here.
import { runInThisContext } from "node:vm";
import { beforeAll, describe, expect, it } from "vitest";
import { files, history, open, pathsOf, sync, text } from "../src/explorer/repo.js";
import { load } from "./load.js";

let SMC;
beforeAll(async () => {
	runInThisContext(load.source("core/kit.js"));
	runInThisContext(load.source("core/markdown.js"));
	SMC = globalThis.SaveMyChat;
	await open({ memory: true });
});

const chat = (savedAt, turns) => ({
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/1" },
	title: "Fix the build",
	savedAt,
	turns,
});
const entryOf = (c, firstSavedAt) => ({
	key: `${c.source.reader} ${c.source.url}`,
	title: c.title,
	reader: c.source.reader,
	firstSavedAt,
	savedAt: c.savedAt,
});

describe("the stored files", () => {
	it("keeps each copy saved in a file's history, under names that stay", async () => {
		const tools = (c) => ({ chat: async () => c, markdown: SMC.toMarkdown, slug: SMC.slug });
		const first = chat("2026-11-26T10:00:00.000Z", [{ role: "user", text: "Why?" }]);
		expect(await sync([entryOf(first, first.savedAt)], tools(first))).toEqual([`github-copilot ${first.source.url}`]);
		expect(await sync([entryOf(first, first.savedAt)], tools(first))).toEqual([]); // nothing changed

		const second = chat("2026-11-27T10:00:00.000Z", [...first.turns, { role: "assistant", text: "Because." }]);
		await sync([entryOf(second, first.savedAt)], tools(second));

		const { md, json } = pathsOf(entryOf(second, first.savedAt), SMC.slug);
		expect(md).toBe("github-copilot/2026-11-26-fix-the-build.md");
		expect(await files()).toEqual([json, md]);
		const past = await history(md);
		expect(past.map((h) => h.message)).toEqual(["Fix the build (2 messages)", "Fix the build (1 message)"]);
		expect(past.map((h) => h.savedAt)).toEqual([second.savedAt, first.savedAt]);
		expect(await text(md)).toBe(SMC.toMarkdown(second));
		expect(JSON.parse(await text(json, past[1].oid))).toEqual(first);
	});
});
