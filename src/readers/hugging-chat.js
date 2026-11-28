// HuggingChat, a conversation at https://huggingface.co/chat/conversation/<id>.
// Seen live through the debug gate (2026-11-28): the user's message [data-message-type="user"],
// the answer [data-message-role="assistant"], each with a data-message-id (its key); an answer
// may first show the tools it called ("Called 4 tools"), so its text is its .prose only. The
// list: the sidebar's links /chat/conversation/<id>.
// NOTE: tried on one chat. A new selector goes in front of its set (or as an override in the
// Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "hugging-chat",
		name: "HuggingChat",
		service: "huggingface.co/chat",
		selectors: {
			user: ["[data-message-type='user']"],
			assistant: ["[data-message-role='assistant'] .prose"],
		},
		detect: (_doc, url) => {
			const u = new URL(url);
			return u.hostname === "huggingface.co" && u.pathname.startsWith("/chat");
		},
		read(doc, _url, sets) {
			const key = (el) => el.closest("[data-message-id]")?.getAttribute("data-message-id");
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { key });
			return { title: doc.title.replace(/\s*[-|]\s*HuggingChat.*$/, "").trim(), turns };
		},
	});
})();
