// GitHub Copilot, the immersive chat at https://github.com/copilot/c/<id>.
// Fitted from Sett's proof of work, drafted-snippets/github-copilot.turndown.js:
// every message is a .message-container; a user's carries a class "user__…",
// Copilot's "ai__…" (CSS-module names: the part after "__" changes with
// GitHub's builds, the prefix stays). Read in page order, through turndown.
// NOTE: the classes are Sett's, seen on 2026-11-27; this reader itself was
// not yet run on the live page. A new name goes in front of its set (or as
// an override in storage.local); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "github-copilot",
		name: "GitHub Copilot",
		service: "github.com/copilot",
		selectors: {
			user: [".message-container[class*='user__']"],
			assistant: [
				".message-container[class^='ai__']",
				".message-container[class*=' ai__']",
				".message-container[class*='_ai__']",
			],
		},
		detect: (_doc, url) => new URL(url).pathname.startsWith("/copilot"),
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\s*·\s*GitHub( Copilot)?$/, "").trim();
			return { title: title === "Copilot" ? "" : title, turns };
		},
	});
})();
