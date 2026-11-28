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

	it("keep the chats a virtual list drops as it is scrolled, and wait for a slow batch (RR8)", async () => {
		const w = load(KIT, { url: "https://chatgpt.com/", html: `<body><nav id="side"></nav></body>` });
		const side = w.document.getElementById("side");
		let next = 1;
		const show = (n) => {
			side.replaceChildren(); // only the newest batch stays on the page
			for (let i = 0; i < n; i++) {
				const a = w.document.createElement("a");
				a.href = `/c/${next}`;
				a.textContent = `Chat ${next++}`;
				side.append(a);
			}
		};
		show(20);
		const batches = [10, 0, 0, 7, 0, 0, 0]; // a batch late by two rounds
		w.HTMLElement.prototype.scrollIntoView = () => {
			const n = batches.shift() ?? 0;
			if (n) show(n);
		};
		const all = await w.SaveMyChat.loadList(w.document, w.location.href, ["https://chatgpt.com/c/*"], { wait: 1 });
		expect(all).toHaveLength(37);
		expect(all.at(-1)).toEqual({ url: "https://chatgpt.com/c/37", title: "Chat 37" });
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

	it("waits for the reader to see the same messages twice, then collects the chat (read whole)", async () => {
		const { browser, sent } = windowed([0, 2, 9, 9]);
		const real = firefox(browser, { ready: 1000, poll: 1, pause: 0 });
		expect(await real.collect(51)).toEqual({ title: "A chat", turns: 4 });
		expect(sent).toEqual([
			"save-my-chat:inspect",
			"save-my-chat:inspect",
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

describe("a long chat read whole, while it scrolls into its past (phase 7)", () => {
	// A virtualized chat as ChatGPT's: messages 100 px tall, only those near the view in the
	// page; the newest `loaded` of them loaded; at the top, the webapp loads `batch` older
	// ones and moves the view down by their height, keeping the screen in place.
	// moved: the webapp loads only when the box moves to its top, not when it stays there
	//   push(v): what the webapp makes of a move to v (a webapp pushing the view back)
	function virtual({ total = 30, loaded = 10, batch = 6, view = 300, skip = 0, moved = false, push = (v) => v } = {}) {
		const w = load([...KIT, "readers/chatgpt.js"], {
			url: "https://chatgpt.com/c/1",
			html: `<!doctype html><title>Long - ChatGPT</title><body><main id="box" style="overflow-y: auto"></main></body>`,
		});
		const box = w.document.getElementById("box");
		let from = total - loaded; // the oldest loaded
		let top = 0;
		const height = () => (total - from) * 100;
		const draw = () => {
			const first = from + Math.max(0, Math.floor(top / 100) - 1);
			const last = Math.min(total, from + Math.ceil((top + view) / 100) + 1);
			box.replaceChildren(
				...Array.from({ length: last - first }, (_, i) => {
					const n = first + i;
					const el = w.document.createElement("div");
					el.setAttribute("data-chatgpt-search-unit-key", `u${n}:0:${n % 2 ? "assistant" : "user"}`);
					el.textContent = `message ${n}`;
					return el;
				}),
			);
		};
		let loading = false;
		Object.defineProperty(box, "clientHeight", { get: () => view });
		Object.defineProperty(box, "scrollHeight", { get: height });
		Object.defineProperty(box, "scrollTop", {
			get: () => top,
			set: (v) => {
				const was = top;
				top = Math.max(0, Math.min(push(v), height() - view));
				draw();
				if (top > 0 || from === 0 || loading || (moved && was === 0)) return;
				loading = true;
				setTimeout(() => {
					const more = Math.min(from, batch + skip);
					from -= more;
					if (skip) from += skip; // a webapp that lost some: a gap
					skip = 0;
					top += (more - (more === batch + skip ? 0 : 0)) * 100;
					loading = false;
					draw();
				}, 2);
			},
		});
		box.scrollTop = height();
		return w;
	}

	it("keeps every message, a screen at a time from the newest, until the box cannot go further", async () => {
		const w = virtual();
		expect((await w.SaveMyChat.readPage(w.document, w.location.href, {})).turns.length).toBeLessThan(6);
		const c = await w.SaveMyChat.readWhole(w.document, w.location.href, {}, { wait: 10, step: 1 });
		expect(c.turns.map((t) => t.text)).toEqual(Array.from({ length: 30 }, (_, n) => `message ${n}`));
		expect(c.turns[0].role).toBe("user");
		expect(c.warnings).toBeUndefined();
		expect(w.SaveMyChat.progress).toMatchObject({ kept: 30, atTop: true, done: true });
	});

	it("warns when older messages come without meeting the newer ones", async () => {
		const w = load([...KIT, "readers/chatgpt.js"], {
			url: "https://chatgpt.com/c/1",
			html: `<!doctype html><title>Gap - ChatGPT</title><body><main id="box" style="overflow-y: auto"></main></body>`,
		});
		const box = w.document.getElementById("box");
		const show = (from) =>
			box.replaceChildren(
				...[0, 1].map((i) => {
					const el = w.document.createElement("div");
					el.setAttribute("data-chatgpt-search-unit-key", `u${from + i}:0:${(from + i) % 2 ? "assistant" : "user"}`);
					el.textContent = `message ${from + i}`;
					return el;
				}),
			);
		show(8);
		let top = 0;
		let jumped = false;
		Object.defineProperty(box, "clientHeight", { get: () => 300 });
		Object.defineProperty(box, "scrollHeight", { get: () => (jumped ? 900 : 600) });
		Object.defineProperty(box, "scrollTop", {
			get: () => top,
			set: (v) => {
				top = Math.max(0, v);
				if (top === 0 && !jumped) {
					jumped = true;
					show(2); // 4 to 7 never shown
				}
			},
		});
		const c = await w.SaveMyChat.readWhole(w.document, w.location.href, {}, { wait: 1, step: 1 });
		expect(c.turns.map((t) => t.text)).toEqual(["message 2", "message 3", "message 8", "message 9"]);
		expect(c.warnings).toContain(
			"Older messages came without meeting the newer ones: some between them may be missing.",
		);
	});

	it("scrolls the box around the messages, not a long message that scrolls itself", async () => {
		const w = virtual({ total: 12, loaded: 12 });
		const box = w.document.getElementById("box");
		const draw = box.replaceChildren.bind(box);
		box.replaceChildren = (...els) => {
			draw(...els);
			const first = box.firstElementChild; // a user's long message, scrolling inside
			first.style.overflowY = "auto";
			Object.defineProperty(first, "scrollHeight", { get: () => 500, configurable: true });
			Object.defineProperty(first, "clientHeight", { get: () => 100, configurable: true });
		};
		box.scrollTop = box.scrollHeight;
		const c = await w.SaveMyChat.readWhole(w.document, w.location.href, {}, { wait: 5, step: 1 });
		expect(c.turns).toHaveLength(12);
	});

	it("asks for more at the top by moving there again, as a webapp that loads only on a move", async () => {
		const w = virtual({ moved: true });
		const c = await w.SaveMyChat.readWhole(w.document, w.location.href, {}, { wait: 10, step: 1 });
		expect(c.turns).toHaveLength(30);
	});

	it("knows two alike messages apart by their ids, and joins a window that lost the oldest kept", () => {
		const w = load(KIT);
		const t = (n, text = "ok") => {
			const turn = { role: n % 2 ? "assistant" : "user", text };
			Object.defineProperty(turn, "key", { value: `u${n}`, enumerable: false });
			return turn;
		};
		const kept = [t(4), t(5), t(6, "same"), t(7, "same")];
		// a window older than what is kept, without u4 but with u5: u2, u3 go in front
		expect(w.SaveMyChat.joined(kept, [t(2), t(3), t(5)])).toEqual({ added: 2, met: true });
		expect(kept.map((x) => x.key)).toEqual(["u2", "u3", "u4", "u5", "u6", "u7"]);
		expect(JSON.stringify(kept[0])).toBe('{"role":"user","text":"ok"}'); // the key stays out of the format
		expect(w.SaveMyChat.joined(kept, [t(0), t(1)])).toEqual({ added: 2, met: false });
	});

	it("goes to the top at once when stepping up keeps being pushed back, and ends", async () => {
		// near the top, the webapp measures what comes into view and pushes the view down
		const w = virtual({ total: 12, loaded: 12, push: (v) => (v > 0 && v < 400 ? v + 500 : v) });
		const c = await w.SaveMyChat.readWhole(w.document, w.location.href, {}, { wait: 5, step: 1, stuck: 5 });
		expect(c.turns).toHaveLength(12);
		expect(w.SaveMyChat.progress.done).toBe(true);
	});

	it("reads a chat loaded already the same, its middle not skipped", async () => {
		const w = virtual({ total: 25, loaded: 25 });
		const c = await w.SaveMyChat.readWhole(w.document, w.location.href, {}, { wait: 10, step: 1 });
		expect(c.turns).toHaveLength(25);
	});
});
