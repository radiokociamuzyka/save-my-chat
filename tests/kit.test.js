import { describe, expect, it } from "vitest";
import { load } from "./load.js";

function mdOf(html) {
	const w = load(["core/kit.js"], { html: `<!doctype html><body><div id="x">${html}</div></body>` });
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
		expect(mdOf("<ol start='3'><li>one</li><li>two</li></ol><ul><li>x</li></ul>")).toBe("3. one\n4. two\n\n- x");
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
		const w = load(["core/kit.js"]);
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
		const w = load(["core/kit.js"]);
		expect(() => w.SaveMyChat.turn("bot", "x")).toThrow(/unknown role/);
	});

	it("reads a page with the first reader that detects it", () => {
		const w = load(["core/kit.js"], { html: "<body><p class='q'>Q</p><p class='a'>A</p></body>" });
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
		const c = w.SaveMyChat.readPage();
		expect(c.turns.map((t) => t.text)).toEqual(["Q", "A"]);
		expect(w.SaveMyChat.present()).toEqual({ id: "demo", name: "Demo" });
	});
});
