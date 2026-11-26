// NOTE: unverified. Written without the live page: the selectors below are
// guesses to be replaced by Sett's existing script for AI Mode, or checked
// against a saved page (tests/fixtures/google-ai-mode.html).
// AI Mode is Google Search with udm=50; a follow-up keeps the same address.
(() => {
	const SMC = globalThis.SaveMyChat;

	const SELECTORS = {
		// one block per exchange: the question asked, then the answer
		exchange: "[data-smc-exchange], [data-scope-id], [data-subtree='aimc']",
		question: "[data-smc-question], [role='heading'][aria-level='2']",
		answer: "[data-smc-answer], [data-container-id='main-col']",
	};

	SMC.reader({
		id: "google-ai-mode",
		name: "Google Search, AI Mode",
		service: "google.com/search (AI Mode)",
		detect: (_doc, url) => new URL(url).searchParams.get("udm") === "50",
		read(doc, url) {
			const turns = [];
			for (const block of doc.querySelectorAll(SELECTORS.exchange)) {
				const q = block.querySelector(SELECTORS.question);
				const a = block.querySelector(SELECTORS.answer);
				if (q) turns.push(SMC.turn("user", q));
				if (a) turns.push(SMC.turn("assistant", a));
			}
			// Fallback: the query of the address and the main column as one answer.
			if (!turns.length) {
				const q = new URL(url).searchParams.get("q");
				const main = doc.querySelector("#rcnt, main, [role='main']");
				if (q) turns.push(SMC.turn("user", q));
				if (main) turns.push(SMC.turn("assistant", main));
			}
			const q = new URL(url).searchParams.get("q");
			return { title: q || doc.title.replace(/ - Google Search$/, ""), turns };
		},
	});
})();
