// Microsoft Copilot, a conversation at https://copilot.com/chat/conversation/<id> (it was
// copilot.microsoft.com, which now leads there).
// Seen live through the debug gate (2026-11-28): the messages in
// #llm-web-ui-messageList-scrollable-container, each a [data-message-index]; the user's text
// in [data-testid="chatQuestion"], the answer in [data-testid="copilot-message-reply-div"],
// each opening with a heading only a screen reader says, "You said:" / "Copilot said:"
// (.fai-UserMessage__accessibleHeading, .fai-CopilotMessage__accessibleHeading), left out.
// The list: the sidebar's links /chat/conversation/<id>, their query dropped.
// NOTE: tried on a short chat. A new selector goes in front of its set (or as an override in
// the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;
	const HOSTS = ["copilot.com", "copilot.microsoft.com"];

	SMC.reader({
		id: "microsoft-copilot",
		name: "Microsoft Copilot",
		service: "copilot.com",
		selectors: {
			transcript: ["#llm-web-ui-messageList-scrollable-container", "[data-testid='MessageListContainer']"],
			user: ["[data-testid='chatQuestion']"],
			assistant: ["[data-testid='copilot-message-reply-div']"],
			hidden: [".fai-UserMessage__accessibleHeading", ".fai-CopilotMessage__accessibleHeading"],
		},
		detect: (_doc, url) => HOSTS.includes(new URL(url).hostname),
		list(doc) {
			return [...doc.querySelectorAll("a[href*='/chat/conversation/']")].map((a) => {
				const href = new URL(a.getAttribute("href"), doc.baseURI);
				return { url: href.origin + href.pathname, title: (a.getAttribute("aria-label") || a.textContent).trim() };
			});
		},
		read(doc, _url, sets) {
			const key = (el) => {
				const index = el.closest("[data-message-index]")?.getAttribute("data-message-index");
				return index && `${index}:${el.matches("[data-testid='chatQuestion']") ? "user" : "assistant"}`;
			};
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { hidden: sets.hidden, key });
			const title = doc.title.replace(/\s*[-|]\s*(Microsoft )?Copilot.*$/, "").trim();
			return { title, turns };
		},
	});
})();
