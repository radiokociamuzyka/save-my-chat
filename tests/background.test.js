// The background with prototypes (phase 3): Firefox's APIs stubbed, the userScripts
// permission granted or not; a prototype's world played by the bridge in a second window.
import { describe, expect, it } from "vitest";
import { KIT, load } from "./load.js";

const PROTO = {
	id: "github-copilot",
	name: "GitHub Copilot",
	from: "github-copilot",
	matches: ["https://github.com/copilot*"],
	code: "/* the user's reader */",
	enabled: true,
};
const event = () => {
	const listeners = [];
	return { addListener: (f) => listeners.push(f), listeners };
};

function background({ granted = true, stored = {}, url = "https://github.com/copilot/c/1", tabWorld, page } = {}) {
	const w = load(["core/kit.js", "core/markdown.js", "core/readers.js", "core/library.js"]);
	const data = structuredClone(stored);
	const calls = { contentScripts: [], userScripts: [], world: null, executed: [], downloads: [], menus: [], opened: 0 };
	w.URL.createObjectURL = () => "blob:x";
	w.URL.revokeObjectURL = () => {};
	const onUserScriptMessage = event();
	w.browser = {
		storage: {
			local: {
				get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])),
				set: async (values) => Object.assign(data, structuredClone(values)),
				remove: async (key) => delete data[key],
			},
			onChanged: event(),
		},
		runtime: {
			onInstalled: event(),
			onStartup: event(),
			onMessage: event(),
			onUserScriptMessage,
			openOptionsPage: async () => calls.opened++,
		},
		menus: { create: (item) => calls.menus.push(item), onClicked: event() },
		permissions: { contains: async () => granted, onAdded: event(), onRemoved: event() },
		tabs: {
			get: async () => ({ url }),
			sendMessage: async () => page ?? { from: "default" },
		},
		downloads: { download: async (d) => calls.downloads.push(d.filename) },
		scripting: {
			getRegisteredContentScripts: async () => [],
			unregisterContentScripts: async () => {},
			registerContentScripts: async (list) => calls.contentScripts.push(...list),
			executeScript: async ({ func, args }) => {
				calls.executed.push(args);
				// the event reaches the prototype's world, which answers through onUserScriptMessage
				if (func && tabWorld) {
					tabWorld.browser = {
						runtime: {
							sendMessage: async (msg) => {
								for (const f of onUserScriptMessage.listeners) f(msg, { tab: { id: 7 } });
							},
						},
					};
					tabWorld.document.dispatchEvent(new tabWorld.CustomEvent("save-my-chat:ask", { detail: args[0] }));
				}
			},
		},
		userScripts: {
			configureWorld: async (c) => {
				calls.world = c;
			},
			getScripts: async () => [],
			unregister: async () => {},
			register: async (list) => calls.userScripts.push(...list),
		},
	};
	w.document.dispatchEvent = () => true; // the background's own document is not the tab's
	w.eval(load.source("background/main.js"));
	const send = (msg) => w.browser.runtime.onMessage.listeners[0](msg);
	return { w, calls, data, send, bg: w.SaveMyChat.background };
}

function copilotTab() {
	const w = load([...KIT, "readers/github-copilot.js"], {
		url: "https://github.com/copilot/c/1",
		html: `<!doctype html><title>A chat · GitHub</title><body>
			<div class="message-container user__a1">Hi?</div>
			<div class="message-container ai__b2">Hello.</div></body>`,
	});
	w.eval(load.source("core/bridge.js"));
	return w;
}

describe("background: prototypes", () => {
	it("registers a prototype in the USER_SCRIPT world, its default stepping aside", async () => {
		const { calls, bg } = background({ stored: { prototypes: { "github-copilot": PROTO } } });
		await bg.register();
		expect(calls.contentScripts.map((s) => s.id)).toEqual(["smc-reader-google-ai-mode"]);
		expect(calls.world).toEqual({ messaging: true });
		const [script] = calls.userScripts;
		expect(script.id).toBe("smc-proto-github-copilot");
		expect(script.world).toBe("USER_SCRIPT");
		expect(script.matches).toEqual(PROTO.matches);
		expect(script.js).toEqual([
			{ file: "vendor/turndown.js" },
			{ file: "vendor/turndown-plugin-gfm.js" },
			{ file: "core/kit.js" },
			{ code: PROTO.code },
			{ file: "core/bridge.js" },
		]);
	});

	it("keeps the defaults, and registers nothing of the user's, without the permission or when turned off", async () => {
		for (const [granted, enabled] of [
			[false, true],
			[true, false],
		]) {
			const { calls, bg } = background({ granted, stored: { prototypes: { x: { ...PROTO, enabled } } } });
			await bg.register();
			expect(calls.contentScripts.map((s) => s.id)).toEqual(["smc-reader-google-ai-mode", "smc-reader-github-copilot"]);
			expect(calls.userScripts).toEqual([]);
		}
	});

	it("asks the prototype covering the tab, and the default elsewhere", async () => {
		const tab = copilotTab();
		const { bg } = background({ stored: { prototypes: { "github-copilot": PROTO } }, tabWorld: tab });
		const read = await bg.ask(7, "save-my-chat:read");
		expect(read.turns.map((t) => t.text)).toEqual(["Hi?", "Hello."]);
		const present = await bg.ask(7, "save-my-chat:present");
		expect(present).toEqual({ id: "github-copilot", name: "GitHub Copilot", prototype: true });

		const other = background({
			stored: { prototypes: { "github-copilot": PROTO } },
			url: "https://www.google.com/search?q=a",
		});
		expect(await other.bg.ask(7, "save-my-chat:read")).toEqual({ from: "default" });
	});

	it("names a prototype not loaded yet, with what to do", async () => {
		const { bg } = background({ stored: { prototypes: { "github-copilot": PROTO } } }); // no world answers
		const present = await bg.ask(7, "save-my-chat:present");
		expect(present).toMatchObject({ id: "github-copilot", prototype: true });
		expect(present.error).toMatch(/reload the page/);
	});
});

describe("background: the library", () => {
	const page = {
		format: "save-my-chat/0",
		source: { reader: "google-ai-mode", service: "google.com/search", url: "https://www.google.com/search?q=a&udm=50" },
		title: "Turtles",
		savedAt: "2026-11-28T09:00:00.000Z",
		turns: [
			{ role: "user", text: "Turtles?" },
			{ role: "assistant", text: "Slow." },
		],
	};

	it("keeps what was saved, lists it, saves it again from its copy, forgets it", async () => {
		const { calls, send } = background({ url: page.source.url, page });
		expect(await send({ type: "save-my-chat:save", tabId: 7, as: "md" })).toMatchObject({ title: "Turtles", turns: 2 });
		const [entry] = await send({ type: "save-my-chat:library" });
		expect(entry).toMatchObject({ title: "Turtles", turns: 2, saves: 1 });
		expect(await send({ type: "save-my-chat:library-chat", key: entry.key })).toEqual(page);
		await send({ type: "save-my-chat:library-save", key: entry.key, as: "json" });
		expect(calls.downloads).toEqual([
			"save-my-chat/google-ai-mode/2026-11-28-turtles.md",
			"save-my-chat/google-ai-mode/2026-11-28-turtles.json",
		]);
		expect(
			await send({ type: "save-my-chat:since", reader: "google-ai-mode", url: page.source.url, turns: 5 }),
		).toMatchObject({
			grew: 3,
		});
		await send({ type: "save-my-chat:library-forget", key: entry.key });
		expect(await send({ type: "save-my-chat:library" })).toEqual([]);
		await expect(send({ type: "save-my-chat:library-save", key: entry.key })).rejects.toThrow(/not in the library/);
	});
});

describe("background: the toolbar button's menu", () => {
	it("offers the library and settings, and opens them", async () => {
		const { w, calls } = background();
		for (const f of w.browser.runtime.onInstalled.listeners) f({ reason: "install" });
		expect(calls.menus).toEqual([{ id: "smc-options", title: "Library and settings", contexts: ["action"] }]);
		w.browser.menus.onClicked.listeners[0]({ menuItemId: "smc-options" });
		expect(calls.opened).toBe(1);
	});
});
