// ChatGPT, a conversation at https://chatgpt.com/c/<id> (or /g/<gpt>/c/<id>).
// Each message carried the role of its author in an attribute,
// data-message-author-role="user" or "assistant", and sat in an <article>
// data-turn="user" | "assistant". On the live page of RR8 (Sett's snippet,
// drafted-snippets/chatgpt.js) the user's messages are told by the class
// group/user-message, and every message is a child of one transcript,
// [data-rail-chat-transcript] (data-thread-find-target="conversation"). When
// the attributes give no answer of ChatGPT's, the transcript's children are read
// as rows: one holding a user's message is the user's, any other ChatGPT's.
// NOTE: unverified - the transcript and the class are Sett's, seen 2026-11-28;
// the reader has not been run on the live page (docs/.agents/things-to-check.md).
// A new selector goes in front of its set (or as an override in the Readers tab);
// keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "chatgpt",
		name: "ChatGPT",
		service: "chatgpt.com",
		selectors: {
			transcript: ["[data-rail-chat-transcript]", "[data-thread-find-target='conversation']"],
			user: ["[data-message-author-role='user']", "article[data-turn='user']", "[class~='group/user-message']"],
			assistant: ["[data-message-author-role='assistant']", "article[data-turn='assistant']"],
		},
		detect: (_doc, url) => new URL(url).hostname === "chatgpt.com",
		read(doc, _url, sets) {
			let turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
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
