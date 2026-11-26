// NOTE: unverified. Written without the live page: the selectors below are
// guesses to be replaced by Sett's existing script for Copilot chat, or
// checked against a saved page (tests/fixtures/github-copilot.html).
// The immersive chat lives at https://github.com/copilot/c/<id>.
(() => {
	const SMC = globalThis.SaveMyChat;

	const SELECTORS = {
		message: "[data-smc-role], [data-testid$='-message'], [class*='ChatMessage-module__chatMessage']",
		body: "[data-smc-body], .markdown-body",
		title: "[data-smc-title], h1",
	};

	function roleOf(el) {
		const hint = [el.dataset.smcRole, el.dataset.testid, el.className, el.getAttribute("aria-label")]
			.join(" ")
			.toLowerCase();
		if (/user|you\b/.test(hint)) return "user";
		if (/copilot|assistant|ai\b/.test(hint)) return "assistant";
		return null;
	}

	SMC.reader({
		id: "github-copilot",
		name: "GitHub Copilot",
		service: "github.com/copilot",
		detect: (_doc, url) => new URL(url).pathname.startsWith("/copilot"),
		read(doc) {
			const turns = [];
			for (const el of doc.querySelectorAll(SELECTORS.message)) {
				const role = roleOf(el);
				if (!role) continue;
				turns.push(SMC.turn(role, el.querySelector(SELECTORS.body) || el));
			}
			const title = doc.querySelector(SELECTORS.title)?.textContent || doc.title.replace(/ · GitHub$/, "");
			return { title, turns };
		},
	});
})();
