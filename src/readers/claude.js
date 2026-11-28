// Claude, a conversation at https://claude.ai/chat/<id>.
// Fitted from Sett's snippet, drafted-snippets/claude-basic-handle.js (RR7, RR8): on
// the live page every message is an element with a data-perf-row attribute, "human"
// for the user's and "assistant" for Claude's (Sett, RR8). Another value is guessed
// from its words (user / model...), else by the user's message
// ([data-testid="user-message"]) inside the row: a row without one is Claude's. The older layout, without rows (user-message
// and font-claude-response), is read when no row is found. The page's title is
// "<chat> - Claude".
// NOTE: the rows and their values are Sett's, seen on 2026-11-27 and 28; this
// reader has not been run on the live page. A new selector goes in front
// of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	function roleOf(row, userCss) {
		const value = row.getAttribute("data-perf-row") || "";
		if (value === "human") return "user";
		if (value === "assistant") return "assistant";
		if (/user|human/i.test(value)) return "user";
		if (/assistant|claude|response|model|\bai\b/i.test(value)) return "assistant";
		return userCss && (row.matches(userCss) || row.querySelector(userCss)) ? "user" : "assistant";
	}

	SMC.reader({
		id: "claude",
		name: "Claude",
		service: "claude.ai",
		selectors: {
			row: ["[data-perf-row]"],
			user: ["[data-testid='user-message']"],
			assistant: [".font-claude-response", ".font-claude-message"],
		},
		detect: (_doc, url) => new URL(url).hostname === "claude.ai",
		read(doc, _url, sets) {
			const rowCss = SMC.selector(sets.row, doc);
			const userCss = SMC.selector(sets.user, doc);
			// a row inside another row is part of it, not a message of its own
			const rows = rowCss ? [...doc.querySelectorAll(rowCss)].filter((row) => !row.parentElement?.closest(rowCss)) : [];
			const turns = rows.length
				? rows.map((row) => SMC.turn(roleOf(row, userCss), row))
				: SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\s*-\s*Claude$/, "").trim();
			return { title: title === "Claude" ? "" : title, turns };
		},
	});
})();
