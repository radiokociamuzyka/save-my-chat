// Mistral Le Chat, a conversation at https://chat.mistral.ai/chat/<id>, or /work/<id> in its
// "Vibe Work" mode.
// Seen live through the debug gate (2026-11-28): each message a [data-message-author-role=
// "user"|"assistant"] with a data-message-id (its key); the user's text in [dir="auto"], an
// answer's in [data-message-part-type="answer"] - which leaves out each message's time row
// and its buttons; a code block's header (the language's icon and name) left out. The list: the sidebar's links /chat/<id> and /work/<id>.
// NOTE: tried on one chat. A new selector goes in front of its set (or as an override in the
// Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "mistral-le-chat",
		name: "Mistral Le Chat",
		service: "chat.mistral.ai",
		selectors: {
			user: ["[data-message-author-role='user'] [dir='auto']"],
			assistant: ["[data-message-author-role='assistant'] [data-message-part-type='answer']"],
			// a code block's header: its language's icon and name ("python"), and Copy
			hidden: ["[data-testid='code-block'] div:has(> i[role='img'][aria-label$=' icon'])"],
		},
		detect: (_doc, url) => new URL(url).hostname === "chat.mistral.ai",
		read(doc, _url, sets) {
			const key = (el) => {
				const id = el.closest("[data-message-id]")?.getAttribute("data-message-id");
				return (
					id &&
					`${id}:${[...el.closest("[data-message-id]").querySelectorAll(SMC.selector(sets.assistant, doc) || "x")].indexOf(el)}`
				);
			};
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { hidden: sets.hidden, key });
			return { title: doc.title.replace(/\s*[-|]\s*(Le Chat|Mistral).*$/, "").trim(), turns };
		},
	});
})();
