// @vitest-environment jsdom
// The library packed into one .zip (phase 5): its files, their names, the index, the download.
import { runInThisContext } from "node:vm";
import { flushPromises, mount } from "@vue/test-utils";
import { strFromU8, unzipSync } from "fflate";
import { beforeAll, describe, expect, it } from "vitest";
import { backup, filesOf, zip, zipName } from "../src/options/backup.js";
import LibraryPanel from "../src/options/LibraryPanel.vue";
import { load } from "./load.js";

const chat = (title, url, savedAt = "2026-11-27T10:00:00.000Z") => ({
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url },
	title,
	savedAt,
	turns: [
		{ role: "user", text: "Why?" },
		{ role: "assistant", text: "Because." },
	],
});
const entryOf = (c, firstSavedAt = c.savedAt) => ({
	key: `${c.source.reader} ${c.source.url}`,
	title: c.title,
	reader: c.source.reader,
	service: c.source.service,
	url: c.source.url,
	turns: c.turns.length,
	firstSavedAt,
	savedAt: c.savedAt,
	saves: 1,
});
const A = chat("Fix the build", "https://github.com/copilot/c/1");
const B = chat("Fix the build", "https://github.com/copilot/c/2");
let tools;
beforeAll(() => {
	runInThisContext(load.source("core/kit.js"));
	runInThisContext(load.source("core/markdown.js"));
	tools = { markdown: globalThis.SaveMyChat.toMarkdown, slug: globalThis.SaveMyChat.slug };
});

describe("the backup", () => {
	it("holds each chat as Markdown and JSON, a second of one name and day numbered, and the index", () => {
		const entries = [entryOf(A), entryOf(B)];
		const files = filesOf(entries, { [entries[0].key]: A, [entries[1].key]: B }, tools);
		expect(Object.keys(files)).toEqual([
			"save-my-chat/github-copilot/2026-11-27-fix-the-build.md",
			"save-my-chat/github-copilot/2026-11-27-fix-the-build.json",
			"save-my-chat/github-copilot/2026-11-27-fix-the-build-2.md",
			"save-my-chat/github-copilot/2026-11-27-fix-the-build-2.json",
			"save-my-chat/library.json",
		]);
		expect(JSON.parse(files["save-my-chat/github-copilot/2026-11-27-fix-the-build-2.json"])).toEqual(B);
		const index = JSON.parse(files["save-my-chat/library.json"]);
		expect(index.format).toBe("save-my-chat/library/0");
		expect(index.chats.map((c) => c.files.md)).toEqual([
			"github-copilot/2026-11-27-fix-the-build.md",
			"github-copilot/2026-11-27-fix-the-build-2.md",
		]);
	});

	it("is a zip that opens to the same files", () => {
		const files = { "save-my-chat/a.md": "# Zażółć\n", "save-my-chat/library.json": "{}\n" };
		const opened = unzipSync(zip(files));
		expect(Object.fromEntries(Object.entries(opened).map(([k, v]) => [k, strFromU8(v)]))).toEqual(files);
		expect(zipName(new Date("2026-11-27T23:00:00Z"))).toBe("save-my-chat/backup-2026-11-27.zip");
	});

	it("asks the background for the library and downloads one zip", async () => {
		const entries = [entryOf(A)];
		const downloaded = [];
		URL.createObjectURL = () => "blob:zip";
		URL.revokeObjectURL = () => {};
		const ask = async (msg) => (msg.type === "save-my-chat:library" ? entries : A);
		expect(await backup(ask, tools, { download: async (d) => downloaded.push(d) })).toBe(1);
		expect(downloaded).toEqual([{ url: "blob:zip", filename: zipName(), saveAs: false }]);
	});

	it("is a button of the library", async () => {
		const downloaded = [];
		globalThis.browser = {
			runtime: { sendMessage: async (msg) => (msg.type === "save-my-chat:library" ? [entryOf(A)] : A) },
			downloads: { download: async (d) => downloaded.push(d.filename) },
		};
		const panel = mount(LibraryPanel);
		await flushPromises();
		await panel.find("button.pack").trigger("click");
		await flushPromises();
		expect(downloaded).toEqual([zipName()]);
		expect(panel.find(".pack-status").text()).toBe("1 chat packed into your downloads.");
	});
});
