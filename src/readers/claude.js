// Claude, a conversation at https://claude.ai/chat/<id>.
// The user's messages are [data-testid="user-message"]; Claude's answers sit in
// an element of the class font-claude-response (font-claude-message before),
// read in page order, through turndown. The page's title is "<chat> - Claude".
// NOTE: unverified - written from claude.ai's known page structure, not yet run
// on the live page (docs/.agents/things-to-check.md). A new selector goes in
// front of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "claude",
		name: "Claude",
		service: "claude.ai",
		selectors: {
			user: ["[data-testid='user-message']"],
			assistant: [".font-claude-response", ".font-claude-message"],
		},
		detect: (_doc, url) => new URL(url).hostname === "claude.ai",
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\s*-\s*Claude$/, "").trim();
			return { title: title === "Claude" ? "" : title, turns };
		},
	});
})();
