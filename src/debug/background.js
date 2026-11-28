// The debug gate (debug build only: `task run`, SMC_DEBUG=1; never in what goes to AMO).
// Sett, RR8 and Q15: an agent's hands on the live pages, "to recognize web ui dom
// elements, define proper selectors, handle new changes of known pages and analize new
// websites", with the user pointing at what should be read and the agent showing what
// it thinks should be.
//
// The way: the user connects in the options' Debug tab; the extension opens a native
// messaging port to scripts/debug/host.mjs (installed once by `task debug:install`),
// which the agent's MCP server (scripts/debug/server.mjs, .mcp.json) reaches through a
// socket only the user can open. Each request is { id, tool, args }; each answer
// { id, result } or { id, error }. The tools take data (selectors, labels), never code
// (rule 5). What they read of a page goes to the agent, and from it to its model: the
// Debug tab says so before the user connects.
(() => {
	const SMC = globalThis.SaveMyChat;
	const HOST = "save_my_chat_debug";
	const OPENED = "debugOpened"; // the tabs the open tool made, in storage.session
	const PICKS = "debugPicks";
	// the user connected and did not disconnect: connected again whenever the extension
	// loads (task run reloads it on every change, each commit's version too, closing the port)
	const WANTED = "debugConnected";
	const KEPT = 200; // picks kept, the newest

	let port = null;
	let state = { connected: false, error: "" };

	// a page tool (debug/page.js) run in a tab, after the file is there
	async function onPage(tabId, name, args = {}) {
		await browser.scripting.executeScript({ target: { tabId }, files: ["debug/page.js"] });
		const [done] = await browser.scripting.executeScript({
			target: { tabId },
			func: (n, a) => globalThis.SaveMyChatDebug.run(n, a),
			args: [name, args],
		});
		const answer = done?.result;
		if (!answer) throw new Error(done?.error?.message || "the page did not answer");
		if (answer.error) throw new Error(answer.error);
		return answer.result;
	}

	// which default reader's pages a tab is on
	const readerOf = (url) => SMC.defaults.find((r) => r.matches.some((m) => SMC.matches(m, url)))?.id ?? null;

	const tabArg = (args) => {
		const tabId = Number(args?.tabId);
		if (!Number.isInteger(tabId)) throw new Error("tabId: a number, from the tabs tool");
		return tabId;
	};

	const TOOLS = {
		async tabs() {
			const all = await browser.tabs.query({});
			return all.map((t) => ({
				tabId: t.id,
				windowId: t.windowId,
				active: t.active,
				url: t.url,
				title: t.title,
				reader: t.url ? readerOf(t.url) : null,
			}));
		},
		async open({ url }) {
			if (!/^https?:\/\//.test(String(url))) throw new Error("url: an http(s) address");
			const tab = await browser.tabs.create({ url, active: true });
			const { [OPENED]: mine = [] } = await browser.storage.session.get(OPENED);
			await browser.storage.session.set({ [OPENED]: [...mine, tab.id] });
			return { tabId: tab.id };
		},
		// the tabs the agent opened, closed when it is done with them (Sett, 2026-11-28: keep
		// the tabs few); a tab it did not open is the user's and stays
		async close({ tabId } = {}) {
			const { [OPENED]: mine = [] } = await browser.storage.session.get(OPENED);
			const open = new Set((await browser.tabs.query({})).map((t) => t.id));
			const asked = tabId === undefined ? mine : [tabArg({ tabId })];
			const closing = asked.filter((id) => mine.includes(id) && open.has(id));
			if (closing.length) await browser.tabs.remove(closing);
			await browser.storage.session.set({ [OPENED]: mine.filter((id) => open.has(id) && !closing.includes(id)) });
			return { closed: closing, kept: asked.filter((id) => !closing.includes(id)) };
		},
		outline: (args) => onPage(tabArg(args), "outline", args),
		query: (args) => onPage(tabArg(args), "query", args),
		element: (args) => onPage(tabArg(args), "element", args),
		snapshot: (args) => onPage(tabArg(args), "snapshot", args),
		highlight: (args) => onPage(tabArg(args), "highlight", args),
		clear: (args) => onPage(tabArg(args), "clear", args),
		scroll: (args) => onPage(tabArg(args), "scroll", args),
		progress: (args) => onPage(tabArg(args), "progress", args),
		async point(args) {
			const tabId = tabArg(args);
			const tab = await browser.tabs.update(tabId, { active: true });
			await browser.windows.update(tab.windowId, { focused: true });
			return onPage(tabId, "point", { on: args.on ?? true });
		},
		async picks({ clear = false } = {}) {
			const { [PICKS]: all = [] } = await browser.storage.local.get(PICKS);
			if (clear) await browser.storage.local.set({ [PICKS]: [] });
			return all;
		},
		read: (args) => SMC.background.ask(tabArg(args), "save-my-chat:read", args.whole ? { whole: true } : {}),
		inspect: (args) => SMC.background.ask(tabArg(args), "save-my-chat:inspect"),
		// what gathering does after loading a listed address: its reader opens the chat (AI Mode: a click)
		"open-item": (args) => SMC.background.ask(tabArg(args), "save-my-chat:open-item"),
		list: (args) => SMC.background.list({ tabId: tabArg(args), load: Boolean(args.load) }),
		// what the tab's reader reads with these selectors in front of its own (as the
		// Readers tab's overrides would put them), without keeping them
		async try(args) {
			const tabId = tabArg(args);
			await SMC.background.ask(tabId, "save-my-chat:present"); // the kit and readers there
			const [done] = await browser.scripting.executeScript({
				target: { tabId },
				func: async (overrides) => ({
					read: await globalThis.SaveMyChat.readPage(document, location.href, overrides),
					seen: await globalThis.SaveMyChat.inspect(document, location.href, overrides),
				}),
				args: [args.selectors ?? {}],
			});
			if (!done?.result) throw new Error(done?.error?.message || "the page did not answer");
			return done.result;
		},
	};

	async function answer(msg) {
		const { id, tool, args } = msg ?? {};
		try {
			if (!Object.hasOwn(TOOLS, tool)) throw new Error(`no tool ${tool}`);
			port?.postMessage({ id, result: (await TOOLS[tool](args ?? {})) ?? null });
		} catch (error) {
			port?.postMessage({ id, error: String(error?.message || error) });
		}
	}

	async function connect() {
		if (port) return state;
		if (!(await browser.permissions.contains({ permissions: ["nativeMessaging"] })))
			throw new Error("Allow native messaging first.");
		port = browser.runtime.connectNative(HOST);
		state = { connected: true, error: "" };
		port.onMessage.addListener(answer);
		await browser.storage.local.set({ [WANTED]: true });
		port.onDisconnect.addListener((p) => {
			port = null;
			const why = p.error?.message || browser.runtime.lastError?.message || "";
			state = {
				connected: false,
				error: why ? `${why} (is the host installed? task debug:install)` : "",
			};
		});
		return state;
	}

	async function disconnect() {
		port?.disconnect();
		port = null;
		state = { connected: false, error: "" };
		await browser.storage.local.set({ [WANTED]: false });
		return state;
	}

	// on load: the connection the user left open, opened again
	const resumed = browser.storage.local
		.get(WANTED)
		.then(({ [WANTED]: wanted }) => (wanted ? connect() : state))
		.catch((error) => {
			state = { connected: false, error: error.message };
			return state;
		});

	async function keep(pick, tab) {
		const { [PICKS]: all = [] } = await browser.storage.local.get(PICKS);
		await browser.storage.local.set({ [PICKS]: [...all, { ...pick, tabId: tab?.id }].slice(-KEPT) });
	}

	browser.runtime.onMessage.addListener((msg, sender) => {
		if (msg?.type === "save-my-chat:debug-connect")
			return connect().catch((e) => ({ connected: false, error: e.message }));
		if (msg?.type === "save-my-chat:debug-disconnect") return disconnect();
		if (msg?.type === "save-my-chat:debug-state") return Promise.resolve(state);
		if (msg?.type === "save-my-chat:debug-point") return TOOLS.point({ tabId: msg.tabId, on: msg.on ?? true });
		if (msg?.type === "save-my-chat:debug-pick" && sender?.tab) return keep(msg.pick, sender.tab);
	});

	SMC.debug = { TOOLS, answer, connect, disconnect, resumed, state: () => state }; // for tests
})();
