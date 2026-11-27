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

function background({ granted = true, stored = {}, url = "https://github.com/copilot/c/1", tabWorld } = {}) {
	const w = load(["core/kit.js", "core/markdown.js", "core/readers.js"]);
	const data = structuredClone(stored);
	const calls = { contentScripts: [], userScripts: [], world: null, executed: [] };
	const onUserScriptMessage = event();
	w.browser = {
		storage: {
			local: { get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])) },
			onChanged: event(),
		},
		runtime: { onInstalled: event(), onStartup: event(), onMessage: event(), onUserScriptMessage },
		permissions: { contains: async () => granted, onAdded: event(), onRemoved: event() },
		tabs: {
			get: async () => ({ url }),
			sendMessage: async () => ({ from: "default" }),
		},
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
	return { w, calls, bg: w.SaveMyChat.background };
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
