// Google AI Studio, a conversation at https://aistudio.google.com/prompts/<id>.
// Seen live through the debug gate (2026-11-28): each message is an ms-chat-turn#turn-<uuid>
// (its key) holding [data-turn-role="User"] or "Model", whose content is drawn only while it
// is on screen (a virtual list: read whole). A turn opens with its author and time,
// .author-label ("Model 11:06 PM"), left out; a model's thoughts, ms-thought-chunk, are left
// out too (the format has no place for reasoning yet), so a turn of thoughts alone is empty
// and dropped. The title: h1.mode-title (the page's is cut). The list: the library's table,
// https://aistudio.google.com/library, each chat an a.name-link to /prompts/<id>.
// NOTE: tried on one chat. A new selector goes in front of its set (or as an override in the
// Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "google-ai-studio",
		name: "Google AI Studio",
		service: "aistudio.google.com",
		selectors: {
			user: ["[data-turn-role='User']"],
			assistant: ["[data-turn-role='Model']"],
			hidden: [".author-label", "ms-thought-chunk"],
			title: ["h1.mode-title", ".page-title"],
		},
		detect: (_doc, url) => new URL(url).hostname === "aistudio.google.com",
		list(doc) {
			return [...doc.querySelectorAll("a.name-link[href*='/prompts/']")].map((a) => {
				const href = new URL(a.getAttribute("href"), doc.baseURI);
				return { url: href.origin + href.pathname, title: a.textContent.trim() };
			});
		},
		read(doc, _url, sets) {
			const key = (el) => el.closest("ms-chat-turn")?.id;
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { hidden: sets.hidden, key });
			const named = SMC.selector(sets.title, doc);
			const title =
				(named &&
					doc
						.querySelector(named)
						?.textContent.replace(/\s*edit$/, "")
						.trim()) ||
				"";
			return { title: title || doc.title.replace(/\s*\|\s*Google AI Studio$/, "").trim(), turns };
		},
	});
})();
