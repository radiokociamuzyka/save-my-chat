// The default readers against small hand-made pages built on the classes
// Sett saw on the live webapps; tests against real saved pages come with
// phase 1 (tests/fixtures/).
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

	it("github-copilot reads .message-container by its user__ / ai__ class, like Sett's snippet", async () => {
		const html = `<head><title>Fix the build · GitHub Copilot</title></head><body>
			<div class="message-container user__k2Xq9">Why does <code>npm ci</code> fail?</div>
			<div class="message-container ai__Pz31a"><div class="markdown-body"><p>Missing <code>await</code>.</p>
				<pre><code>await run();</code></pre></div><button>Copy</button></div>
			<div class="message-container ChatMessage-module__user__Ab12">And now?</div>
			<div class="message-container ChatMessage-module__ai__Cd34"><p>Green.</p></div>
			<div class="detail__x message-container">not a message of either role</div>
		</body>`;
		const w = load([...KIT, "readers/github-copilot.js"], { html, url: "https://github.com/copilot/c/abc" });
		const c = await w.SaveMyChat.readPage();
		expect(c.title).toBe("Fix the build");
		expect(c.warnings).toBeUndefined();
		expect(c.turns).toEqual([
			{ role: "user", text: "Why does `npm ci` fail?" },
			{ role: "assistant", text: "Missing `await`.\n\n```\nawait run();\n```" },
			{ role: "user", text: "And now?" },
			{ role: "assistant", text: "Green." },
		]);
	});

	it("github-copilot finds a renamed container once an override names it", async () => {
		const html = `<body><div class="chat-msg you">Q</div><div class="message-container ai__a">A</div></body>`;
		const w = load([...KIT, "readers/github-copilot.js"], { html, url: "https://github.com/copilot/c/abc" });
		const c = await w.SaveMyChat.readPage(undefined, undefined, { user: [".chat-msg.you"] });
		expect(c.turns.map((t) => t.role)).toEqual(["user", "assistant"]);
	});

	it("inspect says what each selector found, without the conversation's text", async () => {
		const html = `<body><div class="message-container user__a">secret question</div>
			<div class="message-container ai__b">secret answer</div><div class="message-container ai__c">two</div></body>`;
		const w = load([...KIT, "readers/github-copilot.js"], { html, url: "https://github.com/copilot/c/abc" });
		const seen = await w.SaveMyChat.inspect(undefined, undefined, { user: ["div[", ".gone"] });
		expect(seen.reader).toBe("github-copilot");
		expect(seen.host).toBe("github.com");
		expect(seen.turns).toEqual({ user: 1, assistant: 2 });
		expect(seen.warnings).toEqual(["2 answers but 1 question: a user selector may be out of date."]);
		expect(seen.parts.user).toEqual([
			{ css: "div[", found: null, override: true },
			{ css: ".gone", found: 0, override: true },
			{ css: ".message-container[class*='user__']", found: 1, override: false },
		]);
		expect(JSON.stringify(seen)).not.toMatch(/secret/);
	});

	it("google-ai-mode keeps the chronology when each question sits inside its answer's block", async () => {
		// querySelectorAll lists an ancestor before what it holds: an answer block
		// holding its question came out first, 1,0,3,2,5,4 (Sett, 2026-11-27)
		const block = (n) => `<div class="CKgc1d"><div class="L4dlbc">Question ${n}</div><p>Answer ${n}.</p></div>`;
		const html = `<body>${block(1)}${block(2)}${block(3)}</body>`;
		const w = load([...KIT, "readers/google-ai-mode.js"], {
			html,
			url: "https://www.google.com/search?q=Question+1&udm=50",
		});
		const c = await w.SaveMyChat.readPage();
		expect(c.turns.map((t) => t.text)).toEqual([
			"Question 1",
			"Answer 1.",
			"Question 2",
			"Answer 2.",
			"Question 3",
			"Answer 3.",
		]);
		expect(c.turns.map((t) => t.role)).toEqual(["user", "assistant", "user", "assistant", "user", "assistant"]);
		expect(c.warnings).toBeUndefined();
	});
});
