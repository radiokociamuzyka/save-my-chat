// Event page (Firefox runs background.scripts, not a service worker).
// Registers the enabled default readers and the user's prototypes, and saves
// what a tab's reader read.
(() => {
	const SMC = globalThis.SaveMyChat;
	const PREFIX = "smc-reader-";
	const PROTO = "smc-proto-";
	// What a page gets before a reader: turndown, its GFM plugin, the kit.
	const PAGE_KIT = ["vendor/turndown.js", "vendor/turndown-plugin-gfm.js", "core/kit.js"];
	const NOT_LOADED = "The prototype did not answer: reload the page, so Firefox injects it.";

	// ---- prototypes (phase 3) ----------------------------------------------
	// A prototype is the user's copy of a default reader, edited in the options
	// page and kept in storage.local ("prototypes": { <reader id>: { id, name,
	// from, matches, code, enabled } }). It runs through the userScripts API (an
	// optional permission, rule 5), in the USER_SCRIPT world, in place of the
	// default it was copied from.

	async function prototypes() {
		const { prototypes: all = {} } = await browser.storage.local.get("prototypes");
		return Object.values(all).filter((p) => p.enabled && p.code && p.matches?.length);
	}

	// the user granted the permission (the API may outlive a revoked one)
	const allowed = async () =>
		Boolean(browser.userScripts) && browser.permissions.contains({ permissions: ["userScripts"] });

	async function registerPrototypes() {
		if (!(await allowed())) return;
		listen();
		await browser.userScripts.configureWorld({ messaging: true });
		const old = await browser.userScripts.getScripts();
		const ours = old.filter((s) => s.id.startsWith(PROTO)).map((s) => s.id);
		if (ours.length) await browser.userScripts.unregister({ ids: ours });
		const list = await prototypes();
		if (!list.length) return;
		await browser.userScripts.register(
			list.map((p) => ({
				id: PROTO + p.id,
				matches: p.matches,
				js: [...PAGE_KIT.map((file) => ({ file })), { code: p.code }, { file: "core/bridge.js" }],
				runAt: "document_idle",
				world: "USER_SCRIPT",
			})),
		);
	}

	// The questions asked of a prototype, by id, until it answers.
	const pending = new Map();
	let listening = false;

	function listen() {
		if (listening || !browser.runtime.onUserScriptMessage) return;
		listening = true;
		browser.runtime.onUserScriptMessage.addListener((msg, sender) => {
			if (msg?.type !== "save-my-chat:answer") return;
			const waiting = pending.get(msg.id);
			if (!waiting) return; // not asked: a forged or a late answer
			// MDN does not promise sender.tab here: when it is there, it must be the tab asked
			if (sender?.tab && sender.tab.id !== waiting.tabId) return;
			pending.delete(msg.id);
			if (msg.error) waiting.reject(new Error(msg.error));
			else waiting.resolve(msg.answer);
		});
	}

	// The prototype that covers a tab's address, if any is enabled.
	async function prototypeOf(tabId) {
		if (!(await allowed())) return null;
		const { url } = await browser.tabs.get(tabId);
		return (await prototypes()).find((p) => p.matches.some((m) => SMC.matches(m, url))) ?? null;
	}

	// The question goes in as a DOM event from a script in the tab's isolated
	// world; the answer comes back through onUserScriptMessage.
	async function askPrototype(tabId, type, timeout = 5000, extra = {}) {
		listen();
		const id = crypto.randomUUID();
		const answer = new Promise((resolve, reject) => {
			pending.set(id, { tabId, resolve, reject });
			setTimeout(() => pending.delete(id) && reject(new Error(NOT_LOADED)), timeout);
		});
		await browser.scripting.executeScript({
			target: { tabId },
			func: (detail) => document.dispatchEvent(new CustomEvent("save-my-chat:ask", { detail })),
			args: [JSON.stringify({ ...extra, id, type })],
		});
		return answer;
	}

	// ---- default readers ---------------------------------------------------

	// an optional reader (phase 5) works once the user granted its hosts, in the Readers tab
	const granted = (r) => !r.optional || browser.permissions.contains({ origins: r.origins });

	async function enabledReaders() {
		const { disabled = [] } = await browser.storage.local.get("disabled");
		// a default with a prototype of its own enabled steps aside for it
		const replaced = (await allowed()) ? (await prototypes()).map((p) => p.from ?? p.id) : [];
		const on = SMC.defaults.filter((r) => !disabled.includes(r.id) && !replaced.includes(r.id));
		const hosts = await Promise.all(on.map(granted));
		return on.filter((_, i) => hosts[i]);
	}

	async function register() {
		const old = await browser.scripting.getRegisteredContentScripts();
		const ours = old.filter((s) => s.id.startsWith(PREFIX)).map((s) => s.id);
		if (ours.length) await browser.scripting.unregisterContentScripts({ ids: ours });
		const readers = await enabledReaders();
		if (readers.length)
			await browser.scripting.registerContentScripts(
				readers.map((r) => ({
					id: PREFIX + r.id,
					matches: r.matches,
					js: [...PAGE_KIT, r.file],
					runAt: "document_idle",
					persistAcrossSessions: false,
				})),
			);
		await registerPrototypes();
	}

	// Ask the tab's reader: its prototype if one covers the tab, else the
	// default. A tab opened before the extension was installed (or before a
	// reader was enabled) has no default yet: inject the kit and every enabled
	// reader once, each reader's detect() decides, then ask again. A prototype
	// cannot be injected so: the page is reloaded instead (NOT_LOADED).
	async function ask(tabId, type, extra = {}) {
		const proto = await prototypeOf(tabId);
		if (proto && type === "save-my-chat:present")
			// the popup asks first: a prototype not loaded yet is named, with what to do
			return askPrototype(tabId, type, 1500).catch((error) => ({
				id: proto.id,
				name: proto.name,
				prototype: true,
				error: error.message,
			}));
		// loading a whole list or chat scrolls and waits: minutes, not seconds
		const long = type === "save-my-chat:load" || type === "save-my-chat:open-item" || extra.load || extra.whole;
		if (proto) return askPrototype(tabId, type, long ? 600_000 : 5000, extra);
		try {
			return await browser.tabs.sendMessage(tabId, { ...extra, type });
		} catch {
			const files = [...PAGE_KIT, ...(await enabledReaders()).map((r) => r.file)];
			await browser.scripting.executeScript({ target: { tabId }, files });
			return await browser.tabs.sendMessage(tabId, { ...extra, type });
		}
	}

	// what the tab's reader read, checked; throws what the popup shows
	// whole: a long chat read while it scrolls into its past (kit readWhole), for gathering
	async function readTab(tabId, whole = false) {
		const read = await ask(tabId, "save-my-chat:read", whole ? { whole } : {});
		if (!read) throw new Error("No conversation found on this page.");
		const { warnings = [], ...c } = read;
		const problems = SMC.validate(c);
		if (problems.length) throw new Error(`The reader gave a broken conversation: ${problems.join("; ")}`);
		if (!c.turns.length) throw new Error("The reader found no messages on this page.");
		return { c, warnings };
	}

	async function save({ tabId, as = "md" }) {
		const { c, warnings } = await readTab(tabId);
		await write(c, as);
		await library.record(c);
		return { title: c.title, turns: c.turns.length, warnings };
	}

	// ---- gathering (phase 5): the chats a webapp lists, read one by one into the library ----
	// The options page opens each in a background tab and asks for it here: kept in the
	// library, no file written (the backup's zip comes after).
	async function collect({ tabId }) {
		const { c, warnings } = await readTab(tabId, true);
		const entry = await library.record(c);
		return { title: c.title, turns: c.turns.length, warnings, key: entry.key };
	}

	// The default reader whose pages a tab is on (a prototype is of a default: its `from`).
	async function defaultOf(tabId) {
		const proto = await prototypeOf(tabId);
		if (proto) return SMC.defaults.find((r) => r.id === (proto.from ?? proto.id)) ?? null;
		const { url } = await browser.tabs.get(tabId);
		return SMC.defaults.find((r) => r.matches.some((m) => SMC.matches(m, url))) ?? null;
	}

	// The chats a tab lists, each with when it was saved, if it was: { reader, name, chats };
	// load: the page's list scrolled to its end first, until no more chats come (RR7). The
	// tab is brought to the front of its window for it: ChatGPT loads more of its list only
	// while its page is shown (seen live through the gate: a fresh tab in the background, 21
	// chats and no more; in front, 47 in one run).
	async function list({ tabId, load = false }) {
		const reader = await defaultOf(tabId);
		if (!reader) return null;
		if (load) await browser.tabs.update(tabId, { active: true });
		const chats = (await ask(tabId, "save-my-chat:list", { patterns: reader.chats ?? [], load })) ?? [];
		const index = await library.entries();
		return {
			reader: reader.id,
			name: reader.name,
			chats: chats.map((chat) => ({ ...chat, savedAt: index[`${reader.id} ${chat.url}`]?.savedAt ?? null })),
		};
	}

	async function write(c, as) {
		const text = as === "json" ? `${JSON.stringify(c, null, "\t")}\n` : SMC.toMarkdown(c);
		const type = as === "json" ? "application/json" : "text/markdown";
		const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
		try {
			await browser.downloads.download({ url, filename: SMC.fileName(c, as), saveAs: false });
		} finally {
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		}
	}

	// ---- the library (PP1) ------------------------------------------------------

	const library = SMC.library();

	// a chat of the library saved again as a file, from its kept copy
	async function saveAgain({ key, as = "md" }) {
		const c = await library.chat(key);
		if (!c) throw new Error("That chat is not in the library any more.");
		await write(c, as);
		return { title: c.title, turns: c.turns.length };
	}

	// The toolbar button's context menu: the options page (the library, readers,
	// prototypes), otherwise three clicks away in about:addons (Sett, RR4).
	const MENU = "smc-options";
	function menu() {
		browser.menus.create({ id: MENU, title: "Library and settings", contexts: ["action"] }, () => {
			void browser.runtime.lastError; // made already: an event page keeps its menus
		});
	}
	browser.menus.onClicked.addListener((info) => {
		if (info.menuItemId === MENU) browser.runtime.openOptionsPage();
	});

	browser.runtime.onInstalled.addListener(menu);
	browser.runtime.onInstalled.addListener(register);
	browser.runtime.onStartup.addListener(register);
	browser.storage.onChanged.addListener((changes) => {
		if (changes.disabled || changes.prototypes) register();
	});
	// userScripts: the prototypes; origins: an optional reader's hosts
	browser.permissions.onAdded.addListener((p) => {
		if (p.permissions?.includes("userScripts") || p.origins?.length) register();
	});
	browser.permissions.onRemoved.addListener((p) => {
		if (p.permissions?.includes("userScripts") || p.origins?.length) register(); // the defaults come back
	});
	listen();

	browser.runtime.onMessage.addListener((msg) => {
		if (msg?.type === "save-my-chat:save") return save(msg);
		if (msg?.type === "save-my-chat:present") return ask(msg.tabId, msg.type).catch(() => null);
		if (msg?.type === "save-my-chat:inspect") return ask(msg.tabId, msg.type).catch(() => null);
		if (msg?.type === "save-my-chat:defaults") return Promise.resolve(SMC.defaults);
		if (msg?.type === "save-my-chat:library") return library.list(msg.query);
		if (msg?.type === "save-my-chat:library-save") return saveAgain(msg);
		if (msg?.type === "save-my-chat:library-chat") return library.chat(msg.key);
		if (msg?.type === "save-my-chat:library-forget") return library.forget(msg.key);
		if (msg?.type === "save-my-chat:since") return library.since(msg.reader, msg.url, msg.turns);
		if (msg?.type === "save-my-chat:list") return list(msg).catch(() => null);
		if (msg?.type === "save-my-chat:collect") return collect(msg);
		if (msg?.type === "save-my-chat:load") return ask(msg.tabId, msg.type);
		if (msg?.type === "save-my-chat:open-item") return ask(msg.tabId, msg.type).catch(() => false);
	});

	SMC.background = { register, ask, enabledReaders, prototypeOf, list, collect }; // for tests
})();
