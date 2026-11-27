// A prototype's way out (phase 3). A prototype runs in Firefox's USER_SCRIPT
// world (userScripts API), loaded after turndown, the kit and the user's own
// reader code. That world cannot be sent messages, only send them: the
// background asks by a DOM event, "save-my-chat:ask", whose detail is a JSON
// string { id, type } (and, for a list, the chat's address patterns), and this
// answers through runtime.sendMessage, which the background hears as
// runtime.onUserScriptMessage. The answer goes to the extension only; the page
// sees the question (an id, a type, the patterns), never what was read. A page that forges a question gets nothing: the background drops an
// answer whose id it did not ask with.
(() => {
	const SMC = globalThis.SaveMyChat;
	if (!SMC?.kit || SMC.bridged) return;
	SMC.bridged = true;
	// a line in the page's console (F12), for checking a prototype in the wild: which
	// readers its code registered, none when the code broke before SaveMyChat.reader
	const ids = [...SMC.readers.keys()];
	console.info(
		ids.length
			? `save-my-chat: prototype loaded, reader ${ids.join(", ")}`
			: "save-my-chat: prototype loaded, but its code registered no reader (an error above?)",
	);

	async function answer(type, ask) {
		if (type === "save-my-chat:present") {
			const seen = SMC.present();
			return seen && { ...seen, prototype: true };
		}
		if (type === "save-my-chat:read") return SMC.readPage(undefined, undefined, {});
		if (type === "save-my-chat:inspect") return SMC.inspect(undefined, undefined, {});
		if (type === "save-my-chat:list")
			return ask.load
				? SMC.loadList(undefined, undefined, [].concat(ask.patterns || []))
				: SMC.listed(undefined, undefined, [].concat(ask.patterns || []));
		if (type === "save-my-chat:load") return SMC.loadChat(undefined, undefined, {});
		return null;
	}

	document.addEventListener("save-my-chat:ask", async (event) => {
		let ask;
		try {
			ask = JSON.parse(event.detail);
		} catch {
			return;
		}
		if (typeof ask?.id !== "string" || typeof ask.type !== "string") return;
		const reply = { type: "save-my-chat:answer", id: ask.id };
		try {
			reply.answer = (await answer(ask.type, ask)) ?? null;
		} catch (error) {
			reply.error = String(error?.message || error);
		}
		await globalThis.browser?.runtime?.sendMessage(reply);
	});
})();
