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

	it("google-ai-mode reads both roles in page order, like Sett's snippet", async () => {
		const html = `<body>
			<div class="ilZyRc">What is MV3?</div>
			<div class="CKgc1d"><p>Manifest <b>V3</b>.</p><pre><code class="language-json">{"manifest_version": 3}</code></pre></div>
			<div class="L4dlbc">And Firefox?</div>
			<div class="CKgc1d"><p>Event pages.</p><button>Copy</button></div>
		</body>`;
		const w = load([...KIT, "readers/google-ai-mode.js"], {
			html,
			url: "https://www.google.com/search?q=What+is+MV3%3F&udm=50",
		});
		const c = await w.SaveMyChat.readPage();
		expect(c.title).toBe("What is MV3?");
		expect(c.warnings).toBeUndefined();
		expect(c.turns).toEqual([
			{ role: "user", text: "What is MV3?" },
			{ role: "assistant", text: 'Manifest **V3**.\n\n```json\n{"manifest_version": 3}\n```' },
			{ role: "user", text: "And Firefox?" },
			{ role: "assistant", text: "Event pages." },
		]);
	});

	it("google-ai-mode takes the first question from the address and warns of a missing one", async () => {
		const html = `<body>
			<div class="CKgc1d"><p>First answer.</p></div>
			<div class="unknownNewClass">Second question</div>
			<div class="CKgc1d"><p>Second answer.</p></div>
		</body>`;
		const w = load([...KIT, "readers/google-ai-mode.js"], {
			html,
			url: "https://www.google.com/search?q=first+question&udm=50",
		});
		const c = await w.SaveMyChat.readPage();
		expect(c.turns.map((t) => [t.role, t.text])).toEqual([
			["user", "first question"],
			["assistant", "First answer."],
			["assistant", "Second answer."],
		]);
		expect(c.turns[0].from).toBe("address");
		expect(c.warnings).toEqual(["2 answers but 1 question: a user selector may be out of date."]);
	});

	it("google-ai-mode finds the renamed class once an override names it", async () => {
		const html = `<body><div class="newUser">Q</div><div class="CKgc1d"><p>A</p></div></body>`;
		const w = load([...KIT, "readers/google-ai-mode.js"], { html, url: "https://www.google.com/search?q=Q&udm=50" });
		const c = await w.SaveMyChat.readPage(undefined, undefined, { user: [".newUser"] });
		expect(c.turns.map((t) => t.role)).toEqual(["user", "assistant"]);
		expect(c.turns[0].from).toBeUndefined();
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
