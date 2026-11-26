// Event page (Firefox runs background.scripts, not a service worker).
// Registers the enabled default readers and saves what a tab's reader read.
(() => {
	const SMC = globalThis.SaveMyChat;
	const PREFIX = "smc-reader-";

	async function enabledReaders() {
		const { disabled = [] } = await browser.storage.local.get("disabled");
		return SMC.defaults.filter((r) => !disabled.includes(r.id));
	}

	async function register() {
		const old = await browser.scripting.getRegisteredContentScripts();
		const ours = old.filter((s) => s.id.startsWith(PREFIX)).map((s) => s.id);
		if (ours.length) await browser.scripting.unregisterContentScripts({ ids: ours });
		const readers = await enabledReaders();
		if (!readers.length) return;
		await browser.scripting.registerContentScripts(
			readers.map((r) => ({
				id: PREFIX + r.id,
				matches: r.matches,
				js: ["core/kit.js", r.file],
				runAt: "document_idle",
				persistAcrossSessions: false,
			})),
		);
	}

	// Ask the tab's reader. A tab opened before the extension was installed
	// (or before a reader was enabled) has none yet: inject the kit and every
	// enabled reader once, each reader's detect() decides, then ask again.
	async function ask(tabId, type) {
		try {
			return await browser.tabs.sendMessage(tabId, { type });
		} catch {
			const files = ["core/kit.js", ...(await enabledReaders()).map((r) => r.file)];
			await browser.scripting.executeScript({ target: { tabId }, files });
			return await browser.tabs.sendMessage(tabId, { type });
		}
	}

	async function save({ tabId, as = "md" }) {
		const c = await ask(tabId, "save-my-chat:read");
		if (!c) throw new Error("No conversation found on this page.");
		const problems = SMC.validate(c);
		if (problems.length) throw new Error(`The reader gave a broken conversation: ${problems.join("; ")}`);
		if (!c.turns.length) throw new Error("The reader found no messages on this page.");
		const text = as === "json" ? `${JSON.stringify(c, null, "\t")}\n` : SMC.toMarkdown(c);
		const type = as === "json" ? "application/json" : "text/markdown";
		const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
		try {
			await browser.downloads.download({ url, filename: SMC.fileName(c, as), saveAs: false });
		} finally {
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		}
		return { title: c.title, turns: c.turns.length };
	}

	browser.runtime.onInstalled.addListener(register);
	browser.runtime.onStartup.addListener(register);
	browser.storage.onChanged.addListener((changes) => {
		if (changes.disabled) register();
	});

	browser.runtime.onMessage.addListener((msg) => {
		if (msg?.type === "save-my-chat:save") return save(msg);
		if (msg?.type === "save-my-chat:present") return ask(msg.tabId, msg.type).catch(() => null);
		if (msg?.type === "save-my-chat:defaults") return Promise.resolve(SMC.defaults);
	});
})();
