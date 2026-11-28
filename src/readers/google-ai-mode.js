// Google Search, AI Mode (udm=50; a follow-up keeps the same address).
// Fitted from Sett's proof of work, drafted-snippets/google-ai-mode.turndown.js:
// one query over the classes of both roles, read in page order.
// NOTE: the class names are Google's generated ones, seen by Sett on
// 2026-11-26; Google renames them with its builds. Add a new name in front
// of its set (or as an override in storage.local) and keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;
	const THREAD = "smc-thread";
	let opened = null; // the thread this page was asked to open, by its id

	SMC.reader({
		id: "google-ai-mode",
		name: "Google Search, AI Mode",
		service: "google.com/search (AI Mode)",
		selectors: {
			user: [".ilZyRc", ".L4dlbc"],
			assistant: [".CKgc1d"],
		},
		detect: (_doc, url) => new URL(url).searchParams.get("udm") === "50",
		// The history (seen live through the debug gate, 2026-11-28): no links, but a button
		// per thread in its side panel, button[data-thread-id], aria-label "<title>, <n> z
		// <total>", 10 in the page at a time of a virtual list. A thread opens by its button
		// only: its address's mtid is not its thread id, and an address made of the title
		// and an id starts a new search (it did, once). So each is listed under an address
		// naming its id, smc-thread, which opens an empty AI Mode page and sends no search;
		// gathering them is clicking their buttons (phase 7, next).
		listItems: (doc) => doc.querySelectorAll("button[data-thread-id]"),
		// The thread an address of the list names, opened by its button: the panel is a
		// virtual list, so it is stepped through from its top until the button is there.
		async open(doc, url) {
			const id = new URL(url).searchParams.get(THREAD);
			if (!id) return false;
			const css = `button[data-thread-id="${CSS.escape(id)}"]`;
			const first = doc.querySelector("button[data-thread-id]");
			if (!first) return false;
			const box = SMC.scroller(first, doc);
			box.scrollTop = 0;
			await SMC.pause(300);
			let button = doc.querySelector(css);
			while (!button && box.scrollTop + box.clientHeight < box.scrollHeight - 2) {
				box.scrollTop += Math.max(box.clientHeight * 0.7, 100);
				await SMC.pause(300);
				button = doc.querySelector(css);
			}
			if (!button) return false;
			button.click();
			opened = id;
			return true;
		},
		list(doc) {
			return [...doc.querySelectorAll("button[data-thread-id]")].map((b) => ({
				url: `https://www.google.com/search?udm=50&smc-thread=${encodeURIComponent(b.getAttribute("data-thread-id"))}`,
				title: (b.textContent || b.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(),
			}));
		},
		read(doc, url, sets) {
			const q = (new URL(url).searchParams.get("q") || "").trim();
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			// Sett's snippet missed user messages too. The first question is
			// always in the address: if no user turn opens the conversation,
			// it is taken from there rather than lost.
			if (q && turns[0]?.role !== "user") turns.unshift(SMC.turn("user", q, { from: "address" }));
			// a thread opened from the list keeps the list's address: the page's own changes
			// with every load (its mtid), and the library knows a chat by its address
			const own = opened ? `https://www.google.com/search?udm=50&${THREAD}=${encodeURIComponent(opened)}` : undefined;
			return { title: q || doc.title.replace(/ - Google Search$/, ""), turns, url: own };
		},
	});
})();
