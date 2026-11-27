// Gemini, a conversation at https://gemini.google.com/app/<id>.
// Gemini is built of custom elements that keep their names: a question is a
// <user-query> whose text is .query-text, an answer a <model-response> whose
// text is its <message-content>; read in page order, through turndown. The
// page's title is Gemini's own, so a chat is named by its title in the
// sidebar, else by its first question.
// NOTE: unverified - written from Gemini's known page structure, not yet run on
// the live page (docs/.agents/things-to-check.md). A new selector goes in front
// of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "gemini",
		name: "Gemini",
		service: "gemini.google.com",
		selectors: {
			user: ["user-query .query-text"],
			assistant: ["model-response message-content"],
			title: [".conversation.selected .conversation-title", "[aria-current='page'] .conversation-title"],
		},
		detect: (_doc, url) => new URL(url).hostname === "gemini.google.com",
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const named = SMC.selector(sets.title, doc);
			const title =
				(named && doc.querySelector(named)?.textContent.trim()) || turns[0]?.text.split("\n")[0].slice(0, 80);
			return { title, turns };
		},
	});
})();
