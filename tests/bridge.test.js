// The kit's match patterns, and a prototype's bridge out of the USER_SCRIPT world.
import { describe, expect, it } from "vitest";
import { KIT, load } from "./load.js";

describe("match patterns", () => {
	const w = load(KIT);
	const m = (pattern, url) => w.SaveMyChat.matches(pattern, url);

	it("matches as Firefox does", () => {
		expect(m("https://github.com/copilot*", "https://github.com/copilot/c/12")).toBe(true);
		expect(m("https://github.com/copilot*", "https://github.com/settings")).toBe(false);
		expect(m("https://www.google.com/search*", "https://www.google.com/search?q=a&udm=50")).toBe(true);
		expect(m("*://*.example.com/*", "http://a.b.example.com/x")).toBe(true);
		expect(m("*://*.example.com/*", "https://example.com/")).toBe(true);
		expect(m("*://*.example.com/*", "https://notexample.com/")).toBe(false);
		expect(m("https://github.com/*", "http://github.com/")).toBe(false);
		expect(m("https://github.com/a.b*", "https://github.com/aXb")).toBe(false);
		expect(m("<all_urls>", "https://x.org/")).toBe(true);
		expect(m("not a pattern", "https://x.org/")).toBe(false);
	});
});

describe("a prototype's bridge", () => {
	function world() {
		const w = load([...KIT, "readers/github-copilot.js"], {
			url: "https://github.com/copilot/c/1",
			html: `<!doctype html><title>A chat · GitHub</title><body>
				<div class="message-container user__a1">Hi?</div>
				<div class="message-container ai__b2">Hello.</div></body>`,
		});
		const sent = [];
		// the USER_SCRIPT world with messaging on: runtime.sendMessage, no onMessage
		w.browser = { runtime: { sendMessage: async (msg) => sent.push(msg) } };
		const logged = [];
		w.console.info = (line) => logged.push(line);
		w.eval(load.source("core/bridge.js"));
		const ask = (detail) => w.document.dispatchEvent(new w.CustomEvent("save-my-chat:ask", { detail }));
		const settle = () => new Promise((done) => setTimeout(done, 20));
		return { w, sent, ask, settle, logged };
	}

	it("answers a question by sending the answer to the extension, marked a prototype", async () => {
		const { sent, ask, settle } = world();
		ask(JSON.stringify({ id: "1", type: "save-my-chat:present" }));
		ask(JSON.stringify({ id: "2", type: "save-my-chat:read" }));
		await settle();
		expect(sent[0]).toEqual({
			type: "save-my-chat:answer",
			id: "1",
			answer: { id: "github-copilot", name: "GitHub Copilot", prototype: true },
		});
		expect(sent[1].answer.turns.map((t) => [t.role, t.text])).toEqual([
			["user", "Hi?"],
			["assistant", "Hello."],
		]);
	});

	it("says in the page's console which reader the prototype registered", () => {
		expect(world().logged).toEqual(["save-my-chat: prototype loaded, reader github-copilot"]);
	});

	it("ignores what is not a question, and says an error instead of throwing", async () => {
		const { w, sent, ask, settle } = world();
		ask("not json");
		ask(JSON.stringify({ type: "save-my-chat:read" }));
		await settle();
		expect(sent).toEqual([]);
		w.SaveMyChat.readers.get("github-copilot").read = () => {
			throw new Error("broken prototype");
		};
		ask(JSON.stringify({ id: "3", type: "save-my-chat:read" }));
		await settle();
		expect(sent).toEqual([{ type: "save-my-chat:answer", id: "3", error: "broken prototype" }]);
	});
});
