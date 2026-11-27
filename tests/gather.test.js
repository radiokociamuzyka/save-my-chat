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

	it("of AI Mode are its links with udm=50, wherever it stands in the address", () => {
		const w = load(KIT, {
			url: "https://www.google.com/search?q=a&udm=50",
			html: `<body><a href="/search?udm=50&q=turtles&mstk=x">Turtles</a><a href="/search?q=b">plain</a></body>`,
		});
		expect(w.SaveMyChat.listed(w.document, w.location.href, ["https://www.google.com/search?*udm=50*"])).toEqual([
			{ url: "https://www.google.com/search?udm=50&q=turtles&mstk=x", title: "Turtles" },
		]);
	});

	it("are loaded whole: the list scrolled to its end until no more chats come (RR7)", async () => {
		const w = load(KIT, { url: "https://chatgpt.com/", html: `<body><nav id="side"></nav></body>` });
		const side = w.document.getElementById("side");
		const add = (n) => {
			for (let i = 0; i < n; i++) {
				const a = w.document.createElement("a");
				a.href = `/c/${side.children.length + 1}`;
				a.textContent = `Chat ${side.children.length + 1}`;
				side.append(a);
			}
		};
		add(20);
		const batches = [11, 16, 0, 0];
		w.HTMLElement.prototype.scrollIntoView = () => add(batches.shift() ?? 0); // the webapp loading on scroll
		const all = await w.SaveMyChat.loadList(w.document, w.location.href, ["https://chatgpt.com/c/*"], { wait: 1 });
		expect(all).toHaveLength(47);
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
			finish: async () => log.push("finish"),
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
			"finish",
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

	// Firefox with one window for gathering: its tab loads what it is sent to
	function windowed(counts = []) {
		const listeners = new Set();
		const sent = [];
		const complete = (id) =>
			setTimeout(() => {
				for (const f of listeners) f(id, { status: "complete" });
			}, 1);
		let windows = 0;
		const browser = {
			windows: {
				create: async ({ url, focused }) => {
					sent.push(`window ${url} focused=${focused}`);
					windows++;
					complete(50 + windows);
					return { id: windows, tabs: [{ id: 50 + windows }] };
				},
				remove: async (id) => sent.push(`close window ${id}`),
			},
			tabs: {
				update: async (id, { url }) => {
					if (browser.closed) throw new Error("no tab");
					sent.push(`tab ${id} ${url}`);
					complete(id);
					return { id };
				},
				onUpdated: {
					addListener: (f) => listeners.add(f),
					removeListener: (f) => listeners.delete(f),
					hasListener: (f) => listeners.has(f),
				},
			},
			runtime: {
				sendMessage: async (msg) => {
					sent.push(msg.type);
					if (msg.type === "save-my-chat:inspect") return { turns: { user: counts.shift() ?? 0 } };
					if (msg.type === "save-my-chat:load") return 9;
					return { title: "A chat", turns: 4 };
				},
			},
		};
		return { browser, sent, listeners };
	}

	it("opens the chats in a window of its own, one tab reused, closed at the end", async () => {
		const { browser, sent, listeners } = windowed();
		const real = firefox(browser, { ready: 1000, poll: 1, pause: 0 });
		expect(await real.open("https://a/1")).toBe(51);
		expect(await real.open("https://a/2")).toBe(51);
		browser.closed = true; // the user closed the window: a new one
		expect(await real.open("https://a/3")).toBe(52);
		await real.finish();
		expect(sent).toEqual([
			"window https://a/1 focused=false",
			"tab 51 https://a/2",
			"window https://a/3 focused=false",
			"close window 2",
		]);
		expect(listeners.size).toBe(0);
	});

	it("scrolls a chat up once it shows, then waits for the reader to see the same messages twice", async () => {
		const { browser, sent } = windowed([0, 2, 9, 9]);
		const real = firefox(browser, { ready: 1000, poll: 1, pause: 0 });
		expect(await real.collect(51)).toEqual({ title: "A chat", turns: 4 });
		expect(sent).toEqual([
			"save-my-chat:inspect",
			"save-my-chat:inspect",
			"save-my-chat:load",
			"save-my-chat:inspect",
			"save-my-chat:inspect",
			"save-my-chat:collect",
		]);
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
		const asked = [];
		const MORE = { url: "https://github.com/copilot/c/3", title: "Older", savedAt: null };
		globalThis.close = () => {};
		globalThis.browser = {
			runtime: {
				getManifest: () => ({ version: "9.9.9" }),
				getURL: (p) => `moz-extension://x/${p}`,
				sendMessage: async (msg) => {
					if (msg.type !== "save-my-chat:list") return null;
					asked.push(msg.load ?? false);
					// the whole list, once scrolled to its end, holds one more
					const chats = msg.load ? [...LISTED.chats, MORE] : LISTED.chats;
					return { reader: LISTED.reader, name: LISTED.name, chats };
				},
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
		expect(asked).toEqual([false, true]);
		expect(stored[KEY]).toEqual({ ...LISTED, chats: [...LISTED.chats, MORE] });
		expect(created).toEqual(["moz-extension://x/options/options.html#gather"]);
	});
});

describe("a long chat loaded whole", () => {
	it("is scrolled up until no older messages come", async () => {
		const w = load([...KIT, "readers/chatgpt.js"], {
			url: "https://chatgpt.com/c/1",
			html: `<!doctype html><body><main id="m"><div data-message-author-role="user">Last?</div></main></body>`,
		});
		const m = w.document.getElementById("m");
		const batches = [2, 2, 0, 0];
		w.HTMLElement.prototype.scrollIntoView = () => {
			for (let i = batches.shift() ?? 0; i > 0; i--) {
				const older = w.document.createElement("div");
				older.setAttribute("data-message-author-role", i % 2 ? "assistant" : "user");
				older.textContent = "older";
				m.prepend(older);
			}
		};
		expect(await w.SaveMyChat.loadChat(w.document, w.location.href, {}, { wait: 1 })).toBe(5);
	});
});
