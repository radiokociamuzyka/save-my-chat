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
		expect(c.warnings).toEqual([
			"2 answers but 1 question: a user selector may be out of date.",
			"Two messages of one role in a row at 2-3: a message of the other role may be missing.",
		]);
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
		expect(seen.order).toBe("U A A");
		expect(seen.warnings).toEqual([
			"2 answers but 1 question: a user selector may be out of date.",
			"Two messages of one role in a row at 2-3: a message of the other role may be missing.",
		]);
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
		const seen = await w.SaveMyChat.inspect();
		expect(seen.nested).toEqual({ "user in assistant": 3 });
	});

	// made-up pages on the structure each webapp is known by: the readers are unverified
	// until checked on the live page (docs/.agents/things-to-check.md)
	const read = async (file, url, html) => {
		const w = load([...KIT, `readers/${file}.js`], { url, html: `<!doctype html>${html}` });
		return w.SaveMyChat.readPage(w.document, url, {});
	};

	it("chatgpt reads both roles by their author attribute, the title without ChatGPT's name", async () => {
		const c = await read(
			"chatgpt",
			"https://chatgpt.com/c/1",
			`<title>Fix the build - ChatGPT</title><body><main>
			<article><div data-message-author-role="user"><div class="whitespace-pre-wrap">Why does it fail?</div></div></article>
			<article><div data-message-author-role="assistant" data-message-model-slug="gpt-5"><div class="markdown"><p>A <code>path</code>.</p></div>
				<button>Copy</button></div></article></main></body>`,
		);
		expect(c.title).toBe("Fix the build");
		expect(c.turns).toEqual([
			{ role: "user", text: "Why does it fail?" },
			{ role: "assistant", text: "A `path`." },
		]);
	});

	it("chatgpt reads its messages by their search unit keys, the hidden headings left out (live, 2026-11-28)", async () => {
		const c = await read(
			"chatgpt",
			"https://chatgpt.com/c/1",
			`<title>Graphics - ChatGPT</title><body><main>
			<div data-rail-chat-transcript="true"><div class="contents"><div class="flex flex-col">
			<div data-virtualized-turn=""><div data-turn-key="k1"><div>
				<div><h4 class="sr-only" data-conversation-role="user">You said:<span>You</span></h4>
					<div class="group/user-message" data-chatgpt-search-unit-key="u1:0:user"><div class="group/user-message"><p>Draw a cat?</p></div></div></div>
				<div><div><h4 class="sr-only" data-conversation-role="assistant">ChatGPT said:<span>ChatGPT</span></h4>
					<div data-chatgpt-search-unit-key="u1:5:assistant"><h4 class="sr-only" data-conversation-role="assistant">ChatGPT said:</h4><p>A <strong>cat</strong>.</p></div></div></div>
			</div></div></div>
			<div data-virtualized-turn=""><div data-turn-key="k2"><div>
				<div data-chatgpt-search-unit-key="u2:0:user"><p>In Afrikaans?</p></div>
				<div data-chatgpt-search-unit-key="u2:3:assistant"><p>'n Kat.</p></div>
			</div></div></div>
			</div></div></div></main></body>`,
		);
		expect(c.title).toBe("Graphics");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual([
			"user: Draw a cat?",
			"assistant: A **cat**.",
			"user: In Afrikaans?",
			"assistant: 'n Kat.",
		]);
	});

	it("chatgpt reads the transcript's rows when the attributes say nothing, as on RR8's page", async () => {
		const c = await read(
			"chatgpt",
			"https://chatgpt.com/c/1",
			`<title>Rows - ChatGPT</title><body><main>
			<div data-rail-chat-transcript="true" data-thread-find-target="conversation">
				<div><div class="group/user-message flex"><p>Rows?</p></div><button>Edit</button></div>
				<div><div class="markdown"><p>Rows <em>indeed</em>.</p></div></div>
				<div>  </div>
				<div><div class="group/user-message"><p>Two?</p></div></div>
				<div><p>Two.</p></div>
			</div></main></body>`,
		);
		expect(c.title).toBe("Rows");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual([
			"user: Rows?",
			"assistant: Rows *indeed*.",
			"user: Two?",
			"assistant: Two.",
		]);
	});

	it("chatgpt reads articles by their data-turn", async () => {
		const c = await read(
			"chatgpt",
			"https://chatgpt.com/c/1",
			`<title>ChatGPT</title><body><main>
			<article data-turn="user" data-testid="conversation-turn-1"><p>Hi?</p></article>
			<article data-turn="assistant" data-testid="conversation-turn-2"><p>Hello.</p></article></main></body>`,
		);
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual(["user: Hi?", "assistant: Hello."]);
	});

	it("claude tells rows by Sett's values, human and assistant (RR8)", async () => {
		const c = await read(
			"claude",
			"https://claude.ai/chat/1",
			`<title>Values - Claude</title><body>
			<div data-perf-row="human"><p>Mine</p></div>
			<div data-perf-row="assistant"><p>Claude's, with <code>user</code> in it.</p></div></body>`,
		);
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual([
			"user: Mine",
			"assistant: Claude's, with `user` in it.",
		]);
	});

	it("claude reads Sett's [data-perf-row] rows, a row's role by its value or the user's message in it", async () => {
		const c = await read(
			"claude",
			"https://claude.ai/chat/1",
			`<title>Rows - Claude</title><body>
			<div data-perf-row="user"><p>Named?</p></div>
			<div data-perf-row="assistant"><p>Yes.</p><div data-perf-row="inner">part</div></div>
			<div data-perf-row="7"><div data-testid="user-message"><p>Not named?</p></div><button>Edit</button></div>
			<div data-perf-row="8"><p>Then by what is <strong>inside</strong>.</p></div></body>`,
		);
		expect(c.title).toBe("Rows");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual([
			"user: Named?",
			"assistant: Yes.\n\npart",
			"user: Not named?",
			"assistant: Then by what is **inside**.",
		]);
	});

	it("claude lists a chat once, by its address without the artifact's query and its own title", () => {
		const w = load([...KIT, "readers/claude.js"], {
			url: "https://claude.ai/recents",
			html: `<!doctype html><body><nav>
				<a href="/chat/abc?artifact=x1&frame_from=row"><span data-row-label="iconless"><span dir="auto">A draft</span></span><span>Includes an artifact</span></a>
				<a href="/chat/abc">A draft</a>
				<a href="/chat/def">Plain one</a>
				<a href="/new">New chat</a><a href="/chat/def/edit">not a chat</a></nav></body>`,
		});
		expect(w.SaveMyChat.listed(w.document, w.location.href, [])).toEqual([
			{ url: "https://claude.ai/chat/abc", title: "A draft" },
			{ url: "https://claude.ai/chat/def", title: "Plain one" },
		]);
	});

	it("claude reads the older layout without rows: the user's messages and Claude's answers", async () => {
		const c = await read(
			"claude",
			"https://claude.ai/chat/1",
			`<title>Name a variable - Claude</title><body>
			<div data-testid="user-message"><p>A name?</p></div>
			<div class="font-claude-response"><div class="font-claude-response-body"><p>Try <strong>count</strong>.</p></div></div>
			<div data-testid="user-message"><p>Shorter?</p></div>
			<div class="font-claude-message"><p><em>n</em>.</p></div></body>`,
		);
		expect(c.title).toBe("Name a variable");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual([
			"user: A name?",
			"assistant: Try **count**.",
			"user: Shorter?",
			"assistant: *n*.",
		]);
	});

	it("deepseek tells its messages by an answer's markdown, keyed by the virtual list (live, 2026-11-28)", async () => {
		const c = await read(
			"deepseek",
			"https://chat.deepseek.com/a/chat/s/1",
			`<title>Typo greeting - DeepSeek</title><body><div class="ds-virtual-list"><div class="ds-virtual-list-items">
			<div data-virtual-list-item-key="-2"><div class="d29f3d7d ds-message"><div class="ds-collapsible-text">dsadsa</div></div></div>
			<div data-virtual-list-item-key="2"><div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content">
				<p class="ds-markdown-paragraph">Hello! A <strong>typo</strong>?</p></div></div>
				<div class="ds-flex"><div class="ds-button" role="button" aria-label="Read aloud"></div></div></div>
			</div></div></body>`,
		);
		expect(c.title).toBe("Typo greeting");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual(["user: dsadsa", "assistant: Hello! A **typo**?"]);
	});

	it("grok reads its test ids, the 'You' / 'Grok' headings left out (live, 2026-11-28)", async () => {
		const c = await read(
			"grok",
			"https://grok.com/c/1",
			`<title>Memes - Grok</title><body><div data-testid="conversation-title">Technomancy and Memes</div>
			<div role="log" data-testid="chat-transcript-scroller">
			<div id="response-a1" data-user-message-row><div role="article" data-testid="user-message">
				<h2 id="turn-heading-a1" data-no-copy="true">You</h2><span data-bubble-text><p>Memes?</p></span></div>
				<div data-testid="user-message-actions"><button aria-label="Edit message"></button></div></div>
			<div id="response-a2"><div role="article" data-testid="assistant-message">
				<h2 id="turn-heading-a2" data-no-copy="true">Grok</h2><p>An <em>economy</em>.</p></div></div>
			</div></body>`,
		);
		expect(c.title).toBe("Technomancy and Memes");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual(["user: Memes?", "assistant: An *economy*."]);
	});

	it("x-grok reads X's turns, the user's part and the quotable answer (live, 2026-11-28)", async () => {
		const c = await read(
			"x-grok",
			"https://x.com/i/grok/c/1",
			`<title>Memes / X</title><body><main><div class="space-y-4">
			<div class="space-y-4" data-turn-id="t1">
				<div class="group/user flex"><div><div class="rounded-chat">Memes?</div><div><button aria-label="Edit message"></button></div></div></div>
				<div class="group flex" data-quotable-message="r1"><div><p>An <em>economy</em>.</p></div>
					<div><button aria-label="Good response"></button></div></div></div>
			</div></main></body>`,
		);
		expect(c.title).toBe("Memes");
		expect(c.turns.map((t) => `${t.role}: ${t.text}`)).toEqual(["user: Memes?", "assistant: An *economy*."]);
	});

	it("gemini reads its custom elements, named by the sidebar's chat or the first question", async () => {
		const page = (sidebar) => `<title>Gemini</title><body>${sidebar}
			<user-query><span class="cdk-visually-hidden">You said</span><div class="query-text"><p class="query-text-line">Turtles?</p></div></user-query>
			<model-response><message-content><div class="markdown"><p>Slow.</p></div></message-content></model-response></body>`;
		const named = await read(
			"gemini",
			"https://gemini.google.com/app/1",
			page(`<nav><div class="conversation selected"><div class="conversation-title"> About turtles </div></div></nav>`),
		);
		expect(named.title).toBe("About turtles");
		expect(named.turns).toEqual([
			{ role: "user", text: "Turtles?" },
			{ role: "assistant", text: "Slow." },
		]);
		expect((await read("gemini", "https://gemini.google.com/app/1", page(""))).title).toBe("Turtles?");
	});
});
