// The library (PP1): the index and the kept copies in storage.local, stubbed.
import { describe, expect, it } from "vitest";
import { load } from "./load.js";

function setup() {
	const w = load(["core/kit.js", "core/library.js"]);
	const data = {};
	const storage = {
		get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])),
		set: async (values) => Object.assign(data, structuredClone(values)),
		remove: async (key) => delete data[key],
	};
	return { lib: w.SaveMyChat.library(storage), data };
}

const chat = (savedAt, texts, url = "https://github.com/copilot/c/1", title = "A chat") => ({
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url },
	title,
	savedAt,
	turns: texts.map((text, i) => ({ role: i % 2 ? "assistant" : "user", text })),
});

describe("the library", () => {
	it("keeps one entry per chat, its last copy, and how often it was saved", async () => {
		const { lib, data } = setup();
		await lib.record(chat("2026-11-27T10:00:00.000Z", ["Hi?", "Hello."]));
		const entry = await lib.record(chat("2026-11-28T10:00:00.000Z", ["Hi?", "Hello.", "More?", "Sure."]));
		expect(entry).toEqual({
			key: "github-copilot https://github.com/copilot/c/1",
			title: "A chat",
			reader: "github-copilot",
			service: "github.com/copilot",
			url: "https://github.com/copilot/c/1",
			turns: 4,
			firstSavedAt: "2026-11-27T10:00:00.000Z",
			savedAt: "2026-11-28T10:00:00.000Z",
			saves: 2,
		});
		expect(Object.keys(data.library)).toHaveLength(1);
		expect((await lib.chat(entry.key)).turns).toHaveLength(4);
	});

	it("lists newest first and searches titles and text, every word", async () => {
		const { lib } = setup();
		await lib.record(
			chat("2026-11-27T10:00:00.000Z", ["about turtles", "they are slow"], "https://github.com/copilot/c/1", "Old"),
		);
		await lib.record(chat("2026-11-28T10:00:00.000Z", ["about cats"], "https://github.com/copilot/c/2", "New"));
		expect((await lib.list()).map((e) => e.title)).toEqual(["New", "Old"]);
		expect((await lib.list("slow TURTLES")).map((e) => e.title)).toEqual(["Old"]);
		expect((await lib.list("new")).map((e) => e.title)).toEqual(["New"]);
		expect(await lib.list("dogs")).toEqual([]);
	});

	it("tells a chat that grew since it was saved, and nothing of one never saved", async () => {
		const { lib } = setup();
		await lib.record(chat("2026-11-27T10:00:00.000Z", ["Hi?", "Hello."]));
		expect(await lib.since("github-copilot", "https://github.com/copilot/c/1", 6)).toEqual({
			savedAt: "2026-11-27T10:00:00.000Z",
			saved: 2,
			now: 6,
			grew: 4,
		});
		expect((await lib.since("github-copilot", "https://github.com/copilot/c/1", 2)).grew).toBe(0);
		expect(await lib.since("github-copilot", "https://github.com/copilot/c/9", 2)).toBeNull();
	});

	it("forgets a chat, its copy too", async () => {
		const { lib, data } = setup();
		const { key } = await lib.record(chat("2026-11-27T10:00:00.000Z", ["Hi?"]));
		await lib.forget(key);
		expect(data.library).toEqual({});
		expect(`chat:${key}` in data).toBe(false);
	});
});
