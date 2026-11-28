// NotebookLM, now "Gemini Notebook" at https://notebook.google.com/notebook/<id> (it was
// notebooklm.google.com): a notebook's chat beside its sources.
// Seen live through the debug gate (2026-11-28): each message a chat-message, the user's in
// .from-user-container, the answer in .to-user-container, the text in .message-content; an
// answer opens with its thoughts, thinking-chain-view, left out (the format has no place for
// reasoning yet). The title: the page's, "<notebook> - Gemini Notebook". The list: the
// notebooks of the welcome page, each card's link /notebook/<id> named by the element its
// aria-labelledby points at (.project-button-title).
// NOTE: tried on one notebook. A new selector goes in front of its set (or as an override in
// the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;
	const HOSTS = ["notebook.google.com", "notebooklm.google.com"];

	SMC.reader({
		id: "notebooklm",
		name: "NotebookLM",
		service: "notebook.google.com",
		selectors: {
			user: [".from-user-container .message-content"],
			assistant: [".to-user-container .message-content"],
			hidden: ["thinking-chain-view"],
		},
		detect: (_doc, url) => HOSTS.includes(new URL(url).hostname),
		list(doc) {
			return [...doc.querySelectorAll("a[href*='/notebook/']")].map((a) => {
				const href = new URL(a.getAttribute("href"), doc.baseURI);
				const named = (a.getAttribute("aria-labelledby") || "").split(/\s+/)[0];
				const title = (named && doc.getElementById(named)?.textContent) || a.textContent;
				return { url: href.origin + href.pathname, title: title.trim() };
			});
		},
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { hidden: sets.hidden });
			return { title: doc.title.replace(/\s*-\s*(Gemini Notebook|NotebookLM)$/, "").trim(), turns };
		},
	});
})();
