// The default readers against small hand-made pages. These pages use the
// data-smc-* hooks of each reader, so they test the reader's logic only;
// tests against real saved pages come with phase 1 (tests/fixtures/).
import { describe, expect, it } from "vitest";
import { KIT, load } from "./load.js";

describe("readers", () => {
	it("every default reader is listed once and registers itself", () => {
		const w = load([...KIT, "core/readers.js"]);
		const ids = w.SaveMyChat.defaults.map((r) => r.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const r of w.SaveMyChat.defaults) {
			const page = load([...KIT, r.file]);
			expect(page.SaveMyChat.readers.has(r.id)).toBe(true);
		}
	});

	it("google-ai-mode reads exchanges on a udm=50 page", async () => {
		const html = `<body>
			<div data-smc-exchange><div data-smc-question>What is MV3?</div><div data-smc-answer><p>Manifest <b>V3</b>.</p></div></div>
			<div data-smc-exchange><div data-smc-question>And Firefox?</div><div data-smc-answer><p>Event pages.</p></div></div>
		</body>`;
		const w = load([...KIT, "readers/google-ai-mode.js"], {
			html,
			url: "https://www.google.com/search?q=what+is+mv3&udm=50",
		});
		const c = await w.SaveMyChat.readPage();
		expect(c.title).toBe("what is mv3");
		expect(c.turns).toEqual([
			{ role: "user", text: "What is MV3?" },
			{ role: "assistant", text: "Manifest **V3**." },
			{ role: "user", text: "And Firefox?" },
			{ role: "assistant", text: "Event pages." },
		]);
	});

	it("google-ai-mode ignores ordinary search pages", () => {
		const w = load([...KIT, "readers/google-ai-mode.js"], { url: "https://www.google.com/search?q=x" });
		expect(w.SaveMyChat.present()).toBeNull();
	});

	it("github-copilot reads messages by role", async () => {
		const html = `<body><h1 data-smc-title>Fix the build</h1>
			<div data-smc-role="user"><div data-smc-body>Why does it fail?</div></div>
			<div data-smc-role="assistant"><div data-smc-body><p>Missing <code>await</code>.</p></div></div>
		</body>`;
		const w = load([...KIT, "readers/github-copilot.js"], { html, url: "https://github.com/copilot/c/abc" });
		const c = await w.SaveMyChat.readPage();
		expect(c.title).toBe("Fix the build");
		expect(c.turns).toEqual([
			{ role: "user", text: "Why does it fail?" },
			{ role: "assistant", text: "Missing `await`." },
		]);
	});
});
