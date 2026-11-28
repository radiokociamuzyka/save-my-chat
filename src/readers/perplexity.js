// Perplexity, a conversation at https://www.perplexity.ai/session/<id> (older ones /search/<id>).
// Seen live through the debug gate (2026-11-28): the thread is a virtual list of blocks, only
// those near the screen filled (read whole); a question is the bubble [data-message-bubble=
// "right"], its text rendered in [data-renderer="lm"] (a long one is folded on screen, whole in
// the page), its block numbered by data-workflow-entry (its key); an answer's text is the
// [data-renderer="lm"] of its [data-workflow-final-text] block - which leaves out the steps'
// header ("Finished") and the buttons. The list: the library's and sidebar's links
// /session/<id>.
// NOTE: tried on one thread. A new selector goes in front of its set (or as an override in the
// Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "perplexity",
		name: "Perplexity",
		service: "www.perplexity.ai",
		selectors: {
			user: ["[data-message-bubble='right'] [data-renderer='lm']"],
			assistant: ["[data-workflow-final-text] [data-renderer='lm']"],
		},
		detect: (_doc, url) => new URL(url).hostname === "www.perplexity.ai",
		read(doc, _url, sets) {
			const key = (el) => {
				const entry = el.closest("[data-workflow-entry]")?.getAttribute("data-workflow-entry");
				return entry && `${entry}:${el.closest("[data-message-bubble]") ? "user" : "assistant"}`;
			};
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { key });
			return { title: doc.title.replace(/\s*[-|]\s*Perplexity.*$/, "").trim(), turns };
		},
	});
})();
