// @vitest-environment jsdom
// The options page (Q12: Vue components), mounted with Firefox's APIs stubbed and the
// kit, the list of readers and the reader files run as the page's classic scripts.
import { runInThisContext } from "node:vm";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { open as openFiles } from "../src/explorer/repo.js";
import ExplorerPanel from "../src/options/ExplorerPanel.vue";
import LibraryPanel from "../src/options/LibraryPanel.vue";
import OptionsPage from "../src/options/OptionsPage.vue";
import PrototypesPanel from "../src/options/PrototypesPanel.vue";
import ReadersPanel from "../src/options/ReadersPanel.vue";
import { shown } from "../src/options/shown.js";
import ViewerPanel from "../src/options/ViewerPanel.vue";
import { load } from "./load.js";

beforeAll(async () => {
	for (const file of [
		"core/kit.js",
		"core/markdown.js",
		"core/readers.js",
		"readers/google-ai-mode.js",
		"readers/github-copilot.js",
	])
		runInThisContext(load.source(file));
	await openFiles({ memory: true }); // the stored files in memory, not IndexedDB
});

// storage.local, permissions and the background, as the page sees them
function firefox({ stored = {}, granted = false, answer = () => undefined } = {}) {
	const data = structuredClone(stored);
	const state = { granted, asked: 0, sent: [] };
	globalThis.browser = {
		storage: {
			local: {
				get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])),
				set: async (values) => Object.assign(data, structuredClone(values)),
			},
		},
		permissions: {
			contains: async (p) =>
				p.permissions
					? state.granted
					: p.origins.every((o) => ["https://www.google.com/*", "https://github.com/*"].includes(o)),
			request: async () => {
				state.asked++;
				state.granted = true;
				return true;
			},
		},
		runtime: {
			sendMessage: async (msg) => {
				state.sent.push(msg);
				return answer(msg);
			},
		},
	};
	// the real reader files, as the page fetches them (a stub once hid RR2's bug)
	globalThis.fetch = async (path) => ({ text: async () => load.source(path.replace(/^\//, "")) });
	return { data, state };
}

describe("options: the page", () => {
	it("opens on the library, and on the tab its address names", async () => {
		firefox({ answer: () => [] });
		location.hash = "";
		const page = mount(OptionsPage);
		await flushPromises();
		expect(page.findAll(".tabs li").map((li) => li.text())).toEqual([
			"Library",
			"Viewer",
			"Files",
			"Gather",
			"Readers",
			"Prototypes",
		]);
		expect(page.find(".tabs li.is-active").text()).toBe("Library");
		location.hash = "#readers";
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		await flushPromises();
		expect(page.find(".tabs li.is-active").text()).toBe("Readers");
		expect(page.findAll(".reader")).toHaveLength(2);
	});
});

describe("options: readers and their selectors", () => {
	it("shows each reader's parts with the built-in selectors and the user's own", async () => {
		firefox({ stored: { selectors: { "github-copilot": { user: [".mine"] } } } });
		const panel = mount(ReadersPanel);
		await flushPromises();
		expect(panel.findAll("label.label").map((l) => l.text())).toEqual(["user", "assistant", "user", "assistant"]);
		expect(panel.findAll("textarea")[2].element.value).toBe(".mine");
		expect(panel.find(".built-in").text()).toContain(".ilZyRc");
	});

	it("turns a reader off and on", async () => {
		const { data } = firefox();
		const panel = mount(ReadersPanel);
		await flushPromises();
		await panel.findAll(".reader input[type=checkbox]")[1].setValue(false);
		await flushPromises();
		expect(data.disabled).toEqual(["github-copilot"]);
		await panel.findAll(".reader input[type=checkbox]")[1].setValue(true);
		await flushPromises();
		expect(data.disabled).toEqual([]);
	});

	it("saves valid selectors, refuses invalid ones, and goes back to built-in", async () => {
		const { data } = firefox();
		const panel = mount(ReadersPanel);
		await flushPromises();
		const first = panel.findAll(".reader")[0];
		const [save, reset] = first.findAll("button");
		await first.find("textarea").setValue("div[\n.ok");
		await save.trigger("click");
		await flushPromises();
		expect(data.selectors).toBeUndefined();
		expect(first.find("[role=status]").text()).toMatch(/Not valid CSS: user: div\[/);
		await first.find("textarea").setValue(" .ok \n\n.also");
		await save.trigger("click");
		await flushPromises();
		expect(data.selectors).toEqual({ "google-ai-mode": { user: [".ok", ".also"] } });
		await reset.trigger("click");
		await flushPromises();
		expect(data.selectors).toEqual({});
	});
});

describe("options: the library", () => {
	it("lists what was saved, saves it again, forgets it, searches", async () => {
		let entries = [
			{
				key: "k",
				title: "Turtles",
				url: "https://x/",
				service: "google.com/search",
				turns: 2,
				savedAt: "2026-11-28T09:00:00Z",
				saves: 2,
			},
		];
		const { state } = firefox({
			answer: (msg) => {
				if (msg.type === "save-my-chat:library") return entries.filter((e) => e.title.includes(msg.query));
				if (msg.type === "save-my-chat:library-forget") entries = [];
			},
		});
		const panel = mount(LibraryPanel);
		await flushPromises();
		const entry = panel.find(".entry");
		expect(entry.find("a").text()).toBe("Turtles");
		expect(entry.find(".about").text()).toMatch(/^google.com\/search, 2 messages, saved .* \(2 times\)$/);
		const [, md, json] = entry.findAll("button");
		await md.trigger("click");
		await json.trigger("click");
		expect(state.sent.filter((m) => m.type === "save-my-chat:library-save").map((m) => m.as)).toEqual(["md", "json"]);
		await panel.find("input[type=search]").setValue("Cats");
		await flushPromises();
		expect(panel.find(".library-status").text()).toBe("Nothing saved matches that.");
		await panel.find("input[type=search]").setValue("");
		await flushPromises();
		await panel.find(".entry button.is-danger").trigger("click");
		await flushPromises();
		expect(panel.find(".library-status").text()).toMatch(/Nothing saved yet/);
	});
});

const PROTO = {
	id: "github-copilot",
	name: "GitHub Copilot",
	from: "github-copilot",
	matches: ["https://github.com/copilot*"],
	code: "SaveMyChat.reader({})",
	enabled: true,
};

describe("options: prototypes", () => {
	it("asks for user scripts only on the user's click", async () => {
		const { state } = firefox();
		const panel = mount(PrototypesPanel);
		await flushPromises();
		expect(panel.find(".allowed").text()).toMatch(/asks you to allow once/);
		expect(state.asked).toBe(0);
		await panel.find("button.allow").trigger("click");
		await flushPromises();
		expect(state.asked).toBe(1);
		expect(panel.find("button.allow").exists()).toBe(false);
	});

	it("copies a default reader's file into an editor, saved as a prototype", async () => {
		const { data } = firefox({ granted: true });
		const panel = mount(PrototypesPanel);
		await flushPromises();
		const copies = panel.findAll("button.copy");
		expect(copies.map((b) => b.text())).toEqual([
			"Make a prototype of Google Search, AI Mode",
			"Make a prototype of GitHub Copilot",
		]);
		await copies[1].trigger("click");
		await flushPromises();
		expect(data.prototypes["github-copilot"]).toEqual({
			id: "github-copilot",
			name: "GitHub Copilot",
			from: "github-copilot",
			matches: ["https://github.com/copilot*"],
			code: load.source("readers/github-copilot.js"),
			enabled: true,
		});
		expect(panel.find("legend").text()).toBe("GitHub Copilot, your prototype");
		// saved unchanged, as RR2 did: accepted
		await panel.find("button.save").trigger("click");
		await flushPromises();
		expect(panel.find(".prototype .status").text()).toBe("Saved. Reload the chat's page to run it.");
	});

	it("saves an edit, refuses a site it may not read or code with no reader, turns off and deletes", async () => {
		const { data } = firefox({ granted: true, stored: { prototypes: { "github-copilot": PROTO } } });
		const panel = mount(PrototypesPanel);
		await flushPromises();
		const status = () => panel.find(".prototype .status").text();
		const save = async () => {
			await panel.find("button.save").trigger("click");
			await flushPromises();
		};
		await panel.find("textarea.matches").setValue("https://evil.example/*");
		await save();
		expect(status()).toMatch(/Not a site this extension may read: https:\/\/evil/);
		await panel.find("textarea.matches").setValue("https://github.com/copilot/c/*");
		await panel.find("textarea.code").setValue("console.log(1)");
		await save();
		expect(status()).toMatch(/registers no reader/);
		await panel.find("textarea.code").setValue("SaveMyChat.reader({ id: 'github-copilot' })");
		await save();
		expect(data.prototypes["github-copilot"]).toMatchObject({
			matches: ["https://github.com/copilot/c/*"],
			code: "SaveMyChat.reader({ id: 'github-copilot' })",
		});
		await panel.find("input.enabled").setValue(false);
		await flushPromises();
		expect(data.prototypes["github-copilot"].enabled).toBe(false);
		await panel.find("button.delete-prototype").trigger("click");
		await flushPromises();
		expect(data.prototypes).toEqual({});
		expect(panel.findAll("button.copy")).toHaveLength(2);
	});

	it("imports a file of prototypes turned off, skipping broken ones and fields it does not know", async () => {
		const { data } = firefox({ granted: true });
		const panel = mount(PrototypesPanel);
		await flushPromises();
		const file = {
			format: "save-my-chat/prototypes/0",
			prototypes: [
				{
					id: "mine",
					name: "Mine",
					from: "github-copilot",
					matches: ["https://github.com/*"],
					code: "x",
					enabled: true,
					extra: 1,
				},
				{ id: "../bad", name: "Bad", matches: [], code: "" },
			],
		};
		const input = panel.find("input.import");
		Object.defineProperty(input.element, "files", {
			value: [{ text: async () => JSON.stringify(file) }],
			configurable: true,
		});
		await input.trigger("change");
		await flushPromises();
		expect(data.prototypes).toEqual({
			mine: {
				id: "mine",
				name: "Mine",
				from: "github-copilot",
				matches: ["https://github.com/*"],
				code: "x",
				enabled: false,
			},
		});
		expect(panel.find(".prototypes-status").text()).toBe(
			"1 imported, turned off: look at each, then turn it on. 1 skipped as broken.",
		);
	});
});

const CHAT = {
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/1" },
	title: "Fix the build",
	savedAt: "2026-11-27T10:00:00.000Z",
	turns: [
		{ role: "user", text: "Why does it fail?" },
		{ role: "assistant", text: "Missing `await`.", author: "GPT-5" },
	],
};

describe("options: the viewer", () => {
	it("reads a chat of the library", async () => {
		const { state } = firefox({
			answer: (msg) =>
				msg.type === "save-my-chat:library"
					? [
							{
								key: "k",
								title: CHAT.title,
								url: "https://x/",
								service: "s",
								turns: 2,
								savedAt: CHAT.savedAt,
								saves: 1,
							},
						]
					: msg.type === "save-my-chat:library-chat"
						? CHAT
						: undefined,
		});
		location.hash = "";
		const panel = mount(LibraryPanel);
		await flushPromises();
		await panel.find("button.read").trigger("click");
		await flushPromises();
		expect(state.sent.at(-1)).toEqual({ type: "save-my-chat:library-chat", key: "k" });
		expect(location.hash).toBe("#viewer");
		const viewer = mount(ViewerPanel);
		expect(viewer.find("h2").text()).toBe("Fix the build");
		expect(viewer.findAll(".turn .tag").map((t) => t.text())).toEqual(["User", "Assistant"]);
		expect(viewer.find(".turn.assistant code").text()).toBe("await");
	});

	it("opens a saved file, and says what is wrong with one it cannot read", async () => {
		firefox();
		shown.chat = null;
		const viewer = mount(ViewerPanel);
		const open = async (name, text) => {
			const input = viewer.find("input.open-file");
			Object.defineProperty(input.element, "files", { value: [{ name, text: async () => text }], configurable: true });
			await input.trigger("change");
			await flushPromises();
		};
		await open("chat.json", JSON.stringify(CHAT));
		expect(viewer.find("h2").text()).toBe("Fix the build");
		await open("notes.md", "# just notes");
		expect(viewer.find(".viewer-status").text()).toBe("notes.md: Not a file saved by save-my-chat: no front matter.");
	});
});

describe("options: the stored files", () => {
	it("brings the library in, lists its files, shows a file's history and reads a version", async () => {
		const entry = {
			key: "k",
			title: CHAT.title,
			reader: "github-copilot",
			service: "s",
			url: "https://x/",
			turns: 2,
			firstSavedAt: CHAT.savedAt,
			savedAt: CHAT.savedAt,
			saves: 1,
		};
		firefox({
			answer: (msg) =>
				msg.type === "save-my-chat:library" ? [entry] : msg.type === "save-my-chat:library-chat" ? CHAT : undefined,
		});
		shown.chat = null;
		const panel = mount(ExplorerPanel);
		await vi.waitFor(() => expect(panel.findAll("a.file")).toHaveLength(2), { timeout: 5000 });
		expect(panel.find(".folder").text()).toBe("github-copilot/");
		expect(panel.findAll("a.file").map((a) => a.text())).toEqual([
			"2026-11-27-fix-the-build.json",
			"2026-11-27-fix-the-build.md",
		]);
		expect(panel.find(".explorer-status").text()).toBe("1 chat brought in from the library.");
		await panel.findAll("a.file")[1].trigger("click");
		await vi.waitFor(() => expect(panel.findAll(".version")).toHaveLength(1));
		expect(panel.find(".version").text()).toContain("Fix the build (2 messages)");
		await panel.find(".version button.read").trigger("click");
		await vi.waitFor(() => expect(shown.chat?.title).toBe("Fix the build"));
		expect(location.hash).toBe("#viewer");
	});
});
