// Gemini, a conversation at https://gemini.google.com/app/<id>.
// Gemini is built of custom elements that keep their names: a question is a
// <user-query> whose text is .query-text, an answer a <model-response> whose
// text is its <message-content>; read in page order, through turndown. The
// page's title is Gemini's own, so a chat is named by its title in the
// sidebar, else by its first question.
// Read right on the live page through the debug gate (2026-11-28): 10 questions, 10
// answers. The sidebar's chats are links /app/<id> carrying the page's own query
// (?hl=pl&pli=1), named in their aria-label; the open one has aria-current="page".
// Listed by the address alone, so a chat is one chat. A new selector goes in front
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
			title: [
				"a[aria-current='page'][href*='/app/'] [dir='auto']",
				".conversation.selected .conversation-title",
				"[aria-current='page'] .conversation-title",
			],
		},
		detect: (_doc, url) => new URL(url).hostname === "gemini.google.com",
		list(doc) {
			return [...doc.querySelectorAll("a[href*='/app/']")].flatMap((a) => {
				const href = new URL(a.getAttribute("href"), doc.baseURI);
				if (!/^\/app\/[\w-]+$/.test(href.pathname)) return [];
				return [{ url: href.origin + href.pathname, title: (a.getAttribute("aria-label") || a.textContent).trim() }];
			});
		},
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const named = SMC.selector(sets.title, doc);
			const title =
				(named && doc.querySelector(named)?.textContent.trim()) || turns[0]?.text.split("\n")[0].slice(0, 80);
			return { title, turns };
		},
	});
})();
