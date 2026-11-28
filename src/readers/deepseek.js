// DeepSeek, a conversation at https://chat.deepseek.com/a/chat/s/<id>.
// Seen live through the debug gate (2026-11-28, scrapnote "live look: DeepSeek"): its classes
// are hashed (cb86951c...), but its design system's stay (ds-*). Every message is a
// .ds-message; an answer holds .ds-markdown (.ds-assistant-message-main-content), a user's
// message does not. The messages sit in a virtual list, .ds-virtual-list, each item keyed
// by data-virtual-list-item-key. The list of chats: the sidebar's links /a/chat/s/<id>.
// A Cloudflare check may stand over the page (#cf-overlay) before it is drawn.
// NOTE: unverified beyond short chats; a "DeepThink" answer's reasoning was not seen.
// A new selector goes in front of its set (or as an override in the Readers tab); keep the
// old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "deepseek",
		name: "DeepSeek",
		service: "chat.deepseek.com",
		selectors: {
			transcript: [".ds-virtual-list"],
			user: [".ds-message:not(:has(.ds-markdown))"],
			assistant: [".ds-message:has(.ds-markdown)"],
		},
		detect: (_doc, url) => new URL(url).hostname === "chat.deepseek.com",
		read(doc, _url, sets) {
			const key = (el) => el.closest("[data-virtual-list-item-key]")?.getAttribute("data-virtual-list-item-key");
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { key });
			const title = doc.title.replace(/\s*-\s*DeepSeek.*$/, "").trim();
			return { title, turns };
		},
	});
})();
