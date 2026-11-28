// ChatGPT, a conversation at https://chatgpt.com/c/<id> (or /g/<gpt>/c/<id>).
// Seen live through the debug gate (2026-11-28, scrapnote "live look: ChatGPT"): each
// message carries data-chatgpt-search-unit-key="<uuid>:<n>:user" or ":assistant", and
// starts with a heading only a screen reader says, h4[data-conversation-role] ("You
// said:", "ChatGPT said:"), left out. Sett matched the marks of both roles. The older
// hooks stay behind: data-message-author-role, article[data-turn], the class
// group/user-message (Sett's snippet, RR8), and the transcript's children read as rows
// when no answer is found otherwise.
// The transcript is virtualized ([data-virtualized-turn]): only the turns near the screen
// are in the page, so a long chat is whole only once collected while it scrolls (phase 7).
// A new selector goes in front of its set (or as an override in the Readers tab); keep
// the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "chatgpt",
		name: "ChatGPT",
		service: "chatgpt.com",
		selectors: {
			transcript: ["[data-rail-chat-transcript]", "[data-thread-find-target='conversation']"],
			user: [
				"[data-chatgpt-search-unit-key$=':user']",
				"[data-message-author-role='user']",
				"article[data-turn='user']",
				"[class~='group/user-message']",
			],
			assistant: [
				"[data-chatgpt-search-unit-key$=':assistant']",
				"[data-message-author-role='assistant']",
				"article[data-turn='assistant']",
			],
			hidden: ["h4[data-conversation-role]"],
		},
		detect: (_doc, url) => new URL(url).hostname === "chatgpt.com",
		read(doc, _url, sets) {
			let turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }, doc, { hidden: sets.hidden });
			const transcriptCss = SMC.selector(sets.transcript, doc);
			const transcript = transcriptCss && doc.querySelector(transcriptCss);
			if (transcript && !turns.some((t) => t.role === "assistant")) {
				const userCss = SMC.selector(sets.user, doc);
				const rows = [...transcript.children].filter((row) => row.textContent.trim());
				const mine = (row) => userCss && (row.matches(userCss) || row.querySelector(userCss));
				turns = rows.map((row) => SMC.turn(mine(row) ? "user" : "assistant", row));
			}
			const title = doc.title.replace(/\s*[-|]\s*ChatGPT$/, "").trim();
			return { title: title === "ChatGPT" ? "" : title, turns };
		},
	});
})();
