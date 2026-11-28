// Grok, a conversation at https://grok.com/c/<id>.
// Seen live through the debug gate (2026-11-28, scrapnote "live look: Grok"): its classes are
// hashed (grok-78zum5...) but its test ids stay: [data-testid="user-message"] and
// [data-testid="assistant-message"], each in a div#response-<uuid> (the message's key),
// starting with a heading only for the eye and the screen reader, "You" / "Grok"
// (h2#turn-heading-..., data-no-copy, which Grok's own copy leaves out too). The transcript:
// [data-testid="chat-transcript-scroller"].
// The list: the sidebar's chats are buttons without an address; the history page,
// https://grok.com/history, links them, /c/<id> - gather from there.
// NOTE: tried on short chats only. A new selector goes in front of its set (or as an
// override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "grok",
		name: "Grok",
		service: "grok.com",
		selectors: {
			transcript: ["[data-testid='chat-transcript-scroller']"],
			user: ["[data-testid='user-message']"],
			assistant: ["[data-testid='assistant-message']"],
			hidden: ["[data-no-copy]", "h2[id^='turn-heading-']"],
		},
		detect: (_doc, url) => new URL(url).hostname === "grok.com",
		read(doc, _url, sets) {
			const key = (el) => el.closest("[id^='response-']")?.id;
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { hidden: sets.hidden, key });
			const named = doc.querySelector("[data-testid='conversation-title']")?.textContent.trim();
			return { title: named || doc.title.replace(/\s*-\s*Grok$/, "").trim(), turns };
		},
	});
})();
