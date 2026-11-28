// Grok on X, a conversation at https://x.com/i/grok/c/<id> - the same conversations as
// grok.com, under the same ids, in X's own page.
// Seen live through the debug gate (2026-11-28, scrapnote "live look: Grok"): no test ids
// on the messages; each exchange is a div[data-turn-id="<uuid>"] holding the user's part,
// [class~="group/user"], and Grok's answer, [data-quotable-message="<uuid>"] (the ids are
// grok.com's response-<uuid>, so a message is keyed the same on both). The list: the
// chats' sidebar is closed by default; https://x.com/i/grok/history links them,
// /i/grok/c/<id> - gather from there.
// NOTE: tried on short chats only. A new selector goes in front of its set (or as an
// override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "x-grok",
		name: "Grok on X",
		service: "x.com/i/grok",
		selectors: {
			user: ["[data-turn-id] > [class~='group/user']"],
			assistant: ["[data-quotable-message]"],
		},
		detect: (_doc, url) => {
			const u = new URL(url);
			return u.hostname === "x.com" && u.pathname.startsWith("/i/grok");
		},
		read(doc, _url, sets) {
			const key = (el) =>
				el.getAttribute("data-quotable-message") || el.closest("[data-turn-id]")?.getAttribute("data-turn-id");
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { key });
			const title = doc.title.replace(/\s*\/\s*X$/, "").trim();
			return { title: title === "Grok" ? "" : title, turns };
		},
	});
})();
