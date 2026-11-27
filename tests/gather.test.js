// @vitest-environment jsdom
// Gathering (phase 5): the chats a page lists found by the kit, the background's list and
// collect, the options page opening each in a background tab, the popup handing it over.
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import GatherPanel from "../src/options/GatherPanel.vue";
import { firefox, gather, KEY } from "../src/options/gather.js";
import ToolbarPopup from "../src/popup/ToolbarPopup.vue";
import { KIT, load } from "./load.js";

const SIDEBAR = `<!doctype html><title>Copilot · GitHub</title><body>
	<nav>
		<a href="/copilot/c/1"><svg aria-hidden="true"></svg></a>
		<a href="/copilot/c/1#top">Fix the build</a>
		<a href="https://github.com/copilot/c/2">  Name   a   variable </a>
		<a href="/settings">Settings</a>
		<a href="javascript:void(0)">nothing</a>
	</nav></body>`;

describe("the chats a page lists", () => {
	it("are its links to a chat's address, each once, named by its longest text", () => {
		const w = load(KIT, { url: "https://github.com/copilot", html: SIDEBAR });
		expect(w.SaveMyChat.listed(w.document, w.location.href, ["https://github.com/copilot/c/*"])).toEqual([
			{ url: "https://github.com/copilot/c/1", title: "Fix the build" },
			{ url: "https://github.com/copilot/c/2", title: "Name a variable" },
		]);
		expect(w.SaveMyChat.listed(w.document, w.location.href, [])).toEqual([]);
	});

	it("are a reader's own list() when it has one", () => {
		const w = load(KIT, { url: "https://chat.example/", html: SIDEBAR });
		w.SaveMyChat.reader({
			id: "own",
			name: "Own",
			detect: () => true,
			read: () => ({ turns: [] }),
			list: () => [{ url: "/c/9", title: "Nine" }],
		});
		expect(w.SaveMyChat.listed(w.document, w.location.href, ["https://nowhere/*"])).toEqual([
			{ url: "https://chat.example/c/9", title: "Nine" },
		]);
	});

	it("are answered by a prototype's bridge, with the patterns the background sent", async () => {
		const w = load(KIT, { url: "https://github.com/copilot", html: SIDEBAR });
		const sent = [];
		w.browser = { runtime: { sendMessage: async (msg) => sent.push(msg) } };
		w.console.info = () => {};
		w.eval(load.source("core/bridge.js"));
		const detail = JSON.stringify({ id: "q", type: "save-my-chat:list", patterns: ["https://github.com/copilot/c/*"] });
		w.document.dispatchEvent(new w.CustomEvent("save-my-chat:ask", { detail }));
		await new Promise((done) => setTimeout(done, 20));
		expect(sent[0].answer.map((c) => c.url)).toEqual([
			"https://github.com/copilot/c/1",
			"https://github.com/copilot/c/2",
		]);
	});
});

describe("gathering, one chat at a time", () => {
	const chats = [
		{ url: "https://a/1", title: "One" },
		{ url: "https://a/2", title: "Two" },
		{ url: "https://a/3", title: "Three" },
	];
	function io({ failing = "" } = {}) {
		const log = [];
		let n = 0;
		return {
			log,
			open: async (url) => {
				log.push(`open ${url}`);
				if (url === failing) throw new Error("the page did not load");
				return ++n;
			},
			collect: async (tabId) => ({ title: `t${tabId}`, turns: 2 }),
			close: async (tabId) => log.push(`close ${tabId}`),
			pause: async () => log.push("pause"),
		};
	}

	it("opens, reads and closes each, pausing between, and says how each went", async () => {
		const heard = [];
		const fake = io({ failing: "https://a/2" });
		const done = await gather(chats, fake, (c, state) => heard.push(`${c.title} ${state}`));
		expect(done).toEqual([
			{ title: "t1", turns: 2 },
			{ title: "t2", turns: 2 },
		]);
		expect(fake.log).toEqual([
			"open https://a/1",
			"close 1",
			"pause",
			"open https://a/2",
			"pause",
			"open https://a/3",
			"close 2",
		]);
		expect(heard).toEqual(["One reading", "One done", "Two reading", "Two failed", "Three reading", "Three done"]);
	});

	it("stops before the next one when asked", async () => {
		const heard = [];
		let stop = false;
		await gather(
			chats,
			io(),
			(c, state) => {
				heard.push(`${c.title} ${state}`);
				if (state === "done") stop = true;
			},
			() => stop,
		);
		expect(heard).toEqual(["One reading", "One done", "Two stopped", "Three stopped"]);
	});

	it("waits for the tab to load and for the reader to see the same messages twice", async () => {
		const listeners = new Set();
		const sent = [];
		const counts = [0, 2, 4, 4];
		const browser = {
			tabs: {
				create: async (t) => {
					setTimeout(() => {
						for (const f of listeners) f(5, { status: "loading" });
						for (const f of listeners) f(5, { status: "complete" });
					}, 1);
					return { id: 5, ...t };
				},
				onUpdated: { addListener: (f) => listeners.add(f), removeListener: (f) => listeners.delete(f) },
				remove: async (id) => sent.push(`remove ${id}`),
			},
			runtime: {
				sendMessage: async (msg) => {
					sent.push(msg.type);
					if (msg.type === "save-my-chat:inspect")
						return { turns: { user: counts[0] / 2, assistant: counts.shift() / 2 } };
					return { title: "A chat", turns: 4 };
				},
			},
		};
		const real = firefox(browser, { ready: 1000, poll: 1, pause: 0 });
		const tabId = await real.open("https://a/1");
		expect(tabId).toBe(5);
		expect(listeners.size).toBe(0);
		expect(await real.collect(tabId)).toEqual({ title: "A chat", turns: 4 });
		expect(sent.filter((t) => t === "save-my-chat:inspect")).toHaveLength(4);
		expect(sent.at(-1)).toBe("save-my-chat:collect");
		await real.close(tabId);
		expect(sent.at(-1)).toBe("remove 5");
	});

	it("gives up on a chat whose reader sees nothing", async () => {
		const browser = { runtime: { sendMessage: async () => ({ turns: {} }) } };
		await expect(firefox(browser, { ready: 20, poll: 5 }).collect(1)).rejects.toThrow(/saw no messages/);
	});
});

const LISTED = {
	reader: "github-copilot",
	name: "GitHub Copilot",
	from: "https://github.com/copilot",
	chats: [
		{ url: "https://github.com/copilot/c/1", title: "Fix the build", savedAt: "2026-11-27T10:00:00.000Z" },
		{ url: "https://github.com/copilot/c/2", title: "Name a variable", savedAt: null },
	],
};

describe("the Gather tab", () => {
	it("says how to start when nothing was handed over", async () => {
		globalThis.browser = { storage: { local: { get: async () => ({}) } } };
		const panel = mount(GatherPanel);
		await flushPromises();
		expect(panel.find(".gather-status").text()).toMatch(/Nothing to gather yet/);
	});

	it("picks what was never saved, gathers it, and says how it went", async () => {
		globalThis.browser = { storage: { local: { get: async (k) => ({ [k]: structuredClone(LISTED) }) } } };
		const opened = [];
		const io = {
			open: async (url) => opened.push(url),
			collect: async () => ({ title: "Name a variable", turns: 3 }),
			close: async () => {},
			pause: async () => {},
		};
		const panel = mount(GatherPanel, { props: { io } });
		await flushPromises();
		expect(panel.find(".gather-from").text()).toMatch(/GitHub Copilot: 2 chats listed/);
		expect(panel.findAll("input[type=checkbox]").map((c) => c.element.checked)).toEqual([false, true]);
		expect(panel.find("button.start").text()).toBe("Gather 1 chat");
		await panel.find("button.start").trigger("click");
		await flushPromises();
		expect(opened).toEqual(["https://github.com/copilot/c/2"]);
		expect(panel.find(".is-done").text()).toBe("- gathered, 3 messages");
		expect(panel.find(".gather-said").text()).toBe("1 of 1 gathered into the library.");
	});
});

describe("the popup on a page that lists chats", () => {
	it("says how many, and hands them to the Gather tab", async () => {
		const stored = {};
		const created = [];
		globalThis.close = () => {};
		globalThis.browser = {
			runtime: {
				getManifest: () => ({ version: "9.9.9" }),
				getURL: (p) => `moz-extension://x/${p}`,
				sendMessage: async (msg) =>
					msg.type === "save-my-chat:list" ? { reader: LISTED.reader, name: LISTED.name, chats: LISTED.chats } : null,
			},
			tabs: {
				query: async () => [{ id: 7, url: "https://github.com/copilot" }],
				create: async (t) => created.push(t.url),
			},
			// cloned as Firefox does, which refuses a Vue proxy
			storage: { local: { set: async (v) => Object.assign(stored, structuredClone(v)) } },
		};
		const popup = mount(ToolbarPopup);
		await flushPromises();
		expect(popup.find(".listed").text()).toMatch(/This page lists 2 chats, 1 saved already\./);
		await popup.find("button.gather").trigger("click");
		await flushPromises();
		expect(stored[KEY]).toEqual(LISTED);
		expect(created).toEqual(["moz-extension://x/options/options.html#gather"]);
	});
});
