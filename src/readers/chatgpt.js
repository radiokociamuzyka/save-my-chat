// ChatGPT, a conversation at https://chatgpt.com/c/<id> (or /g/<gpt>/c/<id>).
// Each message carries the role of its author in an attribute,
// data-message-author-role="user" or "assistant", which ChatGPT keeps for its
// own scripts across builds; read in page order, through turndown.
// NOTE: unverified - written from ChatGPT's known page structure, not yet run
// on the live page (docs/.agents/things-to-check.md). A new selector goes in
// front of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "chatgpt",
		name: "ChatGPT",
		service: "chatgpt.com",
		selectors: {
			user: ["[data-message-author-role='user']"],
			assistant: ["[data-message-author-role='assistant']"],
		},
		detect: (_doc, url) => new URL(url).hostname === "chatgpt.com",
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\s*[-|]\s*ChatGPT$/, "").trim();
			return { title: title === "ChatGPT" ? "" : title, turns };
		},
	});
})();
