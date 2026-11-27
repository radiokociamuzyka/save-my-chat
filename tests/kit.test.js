import { describe, expect, it } from "vitest";
import { KIT, load } from "./load.js";

function mdOf(html) {
	const w = load(KIT, { html: `<!doctype html><body><div id="x">${html}</div></body>` });
	return w.SaveMyChat.markdown(w.document.getElementById("x"));
}

describe("DOM to markdown", () => {
	it("keeps paragraphs, emphasis and links", () => {
		expect(mdOf('<p>Hello <strong>bold</strong> and <em>it</em>.</p><p>See <a href="/a">a</a>.</p>')).toBe(
			"Hello **bold** and *it*.\n\nSee [a](https://example.com/a).",
		);
	});

	it("fences code blocks with their language and survives backticks inside", () => {
		const md = mdOf('<pre><code class="language-js">const a = "```";\n</code></pre>');
		expect(md).toBe('````js\nconst a = "```";\n````');
	});

	it("writes nested and ordered lists", () => {
		expect(mdOf("<ol start='3'><li>one</li><li>two</li></ol><ul><li>x</li></ul>")).toBe("3.  one\n4.  two\n\n-   x");
	});

	it("writes tables", () => {
		expect(mdOf("<table><tr><th>a</th><th>b</th></tr><tr><td>1</td><td>2|3</td></tr></table>")).toBe(
			"| a | b |\n| --- | --- |\n| 1 | 2\\|3 |",
		);
	});

	it("drops scripts, buttons and hidden parts", () => {
		expect(mdOf('<p>keep</p><script>x()</script><button>Copy</button><span aria-hidden="true">no</span>')).toBe("keep");
	});
});

describe("the unified format", () => {
	it("stamps a conversation that validates", () => {
		const w = load(KIT);
		const S = w.SaveMyChat;
		const c = S.conversation(
			{ id: "t", service: "test" },
			{ title: " T ", turns: [S.turn("user", "hi"), S.turn("assistant", "yo"), { role: "assistant", text: "" }] },
			"https://example.com/c",
			new Date("2026-11-26T00:00:00Z"),
		);
		expect(c).toEqual({
			format: "save-my-chat/0",
			source: { reader: "t", service: "test", url: "https://example.com/c" },
			title: "T",
			savedAt: "2026-11-26T00:00:00.000Z",
			turns: [
				{ role: "user", text: "hi" },
				{ role: "assistant", text: "yo" },
			],
		});
		expect(S.validate(c)).toEqual([]);
	});

	it("rejects unknown roles", () => {
		const w = load(KIT);
		expect(() => w.SaveMyChat.turn("bot", "x")).toThrow(/unknown role/);
	});

	it("reads a page with the first reader that detects it", async () => {
		const w = load(KIT, { html: "<body><p class='q'>Q</p><p class='a'>A</p></body>" });
		w.SaveMyChat.reader({
			id: "demo",
			name: "Demo",
			detect: () => true,
			read: (doc) => ({
				title: "Demo",
				turns: [
					w.SaveMyChat.turn("user", doc.querySelector(".q")),
					w.SaveMyChat.turn("assistant", doc.querySelector(".a")),
				],
			}),
		});
		const c = await w.SaveMyChat.readPage();
		expect(c.turns.map((t) => t.text)).toEqual(["Q", "A"]);
		expect(w.SaveMyChat.present()).toEqual({ id: "demo", name: "Demo" });
	});
});

describe("selector sets", () => {
	it("joins valid candidates and skips broken ones", () => {
		const w = load(KIT);
		expect(w.SaveMyChat.selector([".a", "", "..broken[", ".b"])).toBe(".a, .b");
	});

	it("puts the user's overrides in front of the reader's sets", () => {
		const w = load(KIT);
		expect(w.SaveMyChat.effective({ user: [".old"], assistant: [".ai"] }, { user: ".new" })).toEqual({
			user: [".new", ".old"],
			assistant: [".ai"],
		});
	});

	it("collects turns of every role in page order", () => {
		const html = `<body>
			<div class="u">first question</div>
			<div class="a"><p>first answer</p></div>
			<div class="u2">second question</div>
			<div class="a"><p>second answer</p></div>
		</body>`;
		const w = load(KIT, { html });
		const turns = w.SaveMyChat.turnsBy(w.document, { user: [".u", ".u2"], assistant: [".a"] });
		expect(turns.map((t) => `${t.role}: ${t.text}`)).toEqual([
			"user: first question",
			"assistant: first answer",
			"user: second question",
			"assistant: second answer",
		]);
	});

	it("keeps a nested turn of another role apart and skips duplicates of the same role", () => {
		const html = `<body>
			<div class="a"><p>intro</p><div class="u">a question inside</div><div class="a"><p>inner copy</p></div><p>outro</p></div>
		</body>`;
		const w = load(KIT, { html });
		const turns = w.SaveMyChat.turnsBy(w.document, { user: [".u"], assistant: [".a"] });
		expect(turns).toEqual([
			{ role: "assistant", text: "intro\n\ninner copy\n\noutro" },
			{ role: "user", text: "a question inside" },
		]);
	});

	it("warns when a chat does not go user, agent, user, agent... ending with the agent", () => {
		const w = load(KIT);
		const s = (roles) => w.SaveMyChat.suspicions(roles.map((role) => ({ role, text: "x" })));
		expect(s(["user", "assistant", "user", "assistant", "user", "assistant"])).toEqual([]);
		expect(s(["assistant", "user", "assistant", "user"])).toEqual([
			"It starts with an answer: the order may be wrong.",
			"It ends with a question: its answer is missing or still being written.",
		]);
		expect(s(["user", "assistant", "user"])).toEqual([
			"It ends with a question: its answer is missing or still being written.",
		]);
	});
});
