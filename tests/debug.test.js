// The debug gate (Sett, RR8, Q15): the page's tools in jsdom, the background's tools with
// Firefox stubbed, the native framing, the host and the MCP server talking over a real
// socket with the extension played by the test, samples kept to the shares listed.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { host } from "../scripts/debug/host.mjs";
import { manifest, places } from "../scripts/debug/install.mjs";
import { debugManifest } from "../scripts/debug/manifest.mjs";
import { listed, masked, save } from "../scripts/debug/samples.mjs";
import { ask, handle, NOT_CONNECTED } from "../scripts/debug/server.mjs";
import { TOOLS } from "../scripts/debug/tools.mjs";
import { frame, frames, lines } from "../scripts/debug/wire.mjs";
import { KIT, load } from "./load.js";

const PAGE = `<!doctype html><title>Rows - Claude</title><body><main id="m">
	<div data-perf-row="human" class="row"><div data-testid="user-message">Hi?</div></div>
	<div data-perf-row="assistant" class="row"><p>Hello.</p></div>
	<div data-perf-row="human" class="row"><div data-testid="user-message">More?</div></div>
	<script>secret()</script></main></body>`;

const page = () => {
	const w = load([...KIT, "debug/page.js"], { html: PAGE, url: "https://claude.ai/chat/1" });
	w.requestAnimationFrame = (f) => setTimeout(f, 0);
	w.cancelAnimationFrame = () => {};
	return w;
};
const run = async (w, name, args) => {
	const { result, error } = await w.SaveMyChatDebug.run(name, args);
	if (error) throw new Error(error);
	return result;
};

describe("the debug gate in a page", () => {
	it("outlines the page, alike siblings folded, scripts left out", async () => {
		const { outline } = await run(page(), "outline", { selector: "#m" });
		expect(outline.split("\n")).toEqual([
			"main#m (3)",
			'  div.row[data-perf-row="human"] (1)',
			'    div[data-testid="user-message"] "Hi?"',
			'  div.row[data-perf-row="assistant"] (1)',
			'    p "Hello."',
			'  div.row[data-perf-row="human"] (1)',
			'    div[data-testid="user-message"] "More?"',
		]);
		const folded = await run(page(), "outline", { selector: "#m", depth: 0 });
		expect(folded.outline).toMatch(/^main#m \(3\)\n {2}… "Hi\? Hello\. More\?/);
	});

	it("says what a selector finds, and which selectors find an element", async () => {
		const w = page();
		const found = await run(w, "query", { selector: "[data-perf-row='human']" });
		expect(found.found).toBe(2);
		expect(found.items[1]).toMatchObject({ tag: "div", attrs: { "data-perf-row": "human" }, text: "More?" });
		expect(found.items[1].path).toBe("#m > div:nth-of-type(3)");
		const one = await run(w, "element", { selector: ".row", index: 1 });
		expect(one.suggest.slice(0, 2)).toEqual([
			{ css: '[data-perf-row="assistant"]', found: 1 },
			{ css: "[data-perf-row]", found: 3 },
		]);
		expect(one.html).toBe('<div data-perf-row="assistant" class="row"><p>Hello.</p></div>');
		expect((await w.SaveMyChatDebug.run("element", { selector: ".none" })).error).toMatch(/no element 0/);
		expect((await w.SaveMyChatDebug.run("eval", {})).error).toBe("no page tool eval");
	});

	it("marks what the agent thinks should be read, and takes the marks off", async () => {
		const w = page();
		const marks = await run(w, "highlight", {
			marks: [
				{ selector: "[data-perf-row='human']", label: "user" },
				{ selector: "[data-perf-row='assistant']", label: "assistant" },
			],
		});
		expect(marks).toEqual([
			{ selector: "[data-perf-row='human']", label: "user", found: 2 },
			{ selector: "[data-perf-row='assistant']", label: "assistant", found: 1 },
		]);
		const layer = () => w.document.getElementById("save-my-chat-debug").shadowRoot.querySelectorAll(".box");
		expect([...layer()].map((b) => b.textContent)).toEqual(["user 1", "user 2", "assistant"]);
		await run(w, "clear");
		expect(layer()).toHaveLength(0);
	});

	it("lets the user point: a click, a label, a pick sent to the background", async () => {
		const w = page();
		const sent = [];
		w.browser = { runtime: { sendMessage: async (msg) => sent.push(msg) } };
		expect(await run(w, "point", { on: true })).toEqual({ pointing: true });
		const target = w.document.querySelector("[data-testid='user-message']");
		target.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
		const bar = w.document.getElementById("save-my-chat-debug").shadowRoot.querySelector(".bar");
		expect(bar.textContent).toMatch(/Picked div\[data-testid="user-message"\] "Hi\?"/);
		bar.querySelector("input").value = "the user's question";
		[...bar.querySelectorAll("button")].find((b) => b.textContent === "user").click();
		await new Promise((done) => setTimeout(done, 0));
		expect(sent[0].type).toBe("save-my-chat:debug-pick");
		expect(sent[0].pick).toMatchObject({
			label: "user",
			note: "the user's question",
			path: "#m > div:nth-of-type(1) > div",
			text: "Hi?",
			url: "https://claude.ai/chat/1",
		});
		expect(sent[0].pick.suggest[0]).toEqual({ css: '[data-testid="user-message"]', found: 2 });
		expect(await run(w, "point", { on: false })).toEqual({ pointing: false });
	});

	it("scrolls the box an element sits in and says where it stands after the wait", async () => {
		const w = page();
		const m = w.document.getElementById("m");
		m.style.overflowY = "auto";
		Object.defineProperty(m, "scrollHeight", { get: () => 1000 + m.children.length * 100 });
		Object.defineProperty(m, "clientHeight", { get: () => 300 });
		let top = 400;
		Object.defineProperty(m, "scrollTop", { get: () => top, set: (v) => (top = Math.max(0, v)) });
		setTimeout(() => {
			m.prepend(w.document.createElement("div")); // the webapp loads older ones...
			top = 100; // ...and keeps what was on screen in place
		}, 5);
		const seen = await run(w, "scroll", { selector: ".row", to: "top", wait: 20, count: "#m > div" });
		expect(seen.box).toBe("main#m");
		expect(seen.before).toMatchObject({ scrollTop: 400, atTop: false, count: 3 });
		expect(seen.moved).toMatchObject({ scrollTop: 0, atTop: true });
		expect(seen.after).toMatchObject({ scrollTop: 100, atTop: false, scrollHeight: 1500, count: 4 });
	});

	it("snapshots the page without its scripts", async () => {
		const shot = await run(page(), "snapshot");
		expect(shot.html).toMatch(/^<!doctype html>\n<html>/);
		expect(shot.html).not.toMatch(/secret/);
		expect(shot.title).toBe("Rows - Claude");
	});
});

describe("the debug gate in the background", () => {
	function background({ granted = true, stored: given = {} } = {}) {
		const w = load(["core/kit.js", "core/readers.js"]);
		const posted = [];
		const listeners = [];
		const port = {
			postMessage: (m) => posted.push(m),
			onMessage: { addListener: (f) => listeners.push(f) },
			onDisconnect: { addListener: () => {} },
			disconnect: () => {},
		};
		const stored = given;
		const session = {};
		const made = []; // the tabs open made
		const removed = [];
		w.browser = {
			permissions: { contains: async () => granted },
			runtime: {
				connectNative: (name) => {
					port.name = name;
					return port;
				},
				onMessage: { addListener: () => {} },
			},
			tabs: {
				query: async () => [
					{ id: 4, windowId: 1, active: true, url: "https://claude.ai/chat/1", title: "Rows" },
					...made.map((id) => ({ id, windowId: 1, active: false })),
				],
				create: async () => {
					made.push(10 + made.length);
					return { id: made.at(-1) };
				},
				remove: async (ids) => {
					removed.push(...ids);
					made.splice(0, made.length, ...made.filter((id) => !ids.includes(id)));
				},
			},
			storage: {
				local: {
					get: async (k) => ({ [k]: stored[k] }),
					set: async (v) => Object.assign(stored, v),
				},
				session: {
					get: async (k) => ({ [k]: session[k] }),
					set: async (v) => Object.assign(session, v),
				},
			},
		};
		w.eval(load.source("debug/background.js"));
		return { w, posted, port, listeners, stored, removed };
	}

	it("has every tool the server lists, but the server's own", () => {
		const { w } = background();
		const theirs = TOOLS.filter((t) => !t.server).map((t) => t.name);
		expect(Object.keys(w.SaveMyChat.debug.TOOLS).sort()).toEqual([...theirs, "snapshot"].sort());
	});

	it("closes only the tabs it opened", async () => {
		const { w, removed } = background();
		const { TOOLS: tools } = w.SaveMyChat.debug;
		await tools.open({ url: "https://chatgpt.com/" });
		await tools.open({ url: "https://claude.ai/" });
		expect(await tools.close({ tabId: 4 })).toEqual({ closed: [], kept: [4] }); // the user's
		expect(await tools.close({ tabId: 10 })).toEqual({ closed: [10], kept: [] });
		expect(await tools.close()).toEqual({ closed: [11], kept: [] });
		expect(await tools.close()).toEqual({ closed: [], kept: [] });
		expect(removed).toEqual([10, 11]);
	});

	it("connects again on load when the user left it connected, not after a disconnect", async () => {
		const first = background();
		await first.w.SaveMyChat.debug.resumed;
		expect(first.port.name).toBeUndefined(); // never connected: not on load either
		await first.w.SaveMyChat.debug.connect();
		const again = background({ stored: first.stored });
		expect(await again.w.SaveMyChat.debug.resumed).toEqual({ connected: true, error: "" });
		expect(again.port.name).toBe("save_my_chat_debug");
		await again.w.SaveMyChat.debug.disconnect();
		const after = background({ stored: again.stored });
		await after.w.SaveMyChat.debug.resumed;
		expect(after.port.name).toBeUndefined();
	});

	it("connects to the native host once allowed, and answers by id", async () => {
		expect(
			await background({ granted: false })
				.w.SaveMyChat.debug.connect()
				.catch((e) => e.message),
		).toBe("Allow native messaging first.");
		const { w, posted, port } = background();
		expect(await w.SaveMyChat.debug.connect()).toEqual({ connected: true, error: "" });
		expect(port.name).toBe("save_my_chat_debug");
		await w.SaveMyChat.debug.answer({ id: 7, tool: "tabs" });
		expect(posted[0]).toEqual({
			id: 7,
			result: [
				{ tabId: 4, windowId: 1, active: true, url: "https://claude.ai/chat/1", title: "Rows", reader: "claude" },
			],
		});
		await w.SaveMyChat.debug.answer({ id: 8, tool: "outline", args: {} });
		expect(posted[1]).toEqual({ id: 8, error: "tabId: a number, from the tabs tool" });
		await w.SaveMyChat.debug.answer({ id: 9, tool: "constructor" });
		expect(posted[2]).toEqual({ id: 9, error: "no tool constructor" });
	});
});

describe("the debug gate's wire, host and MCP server", () => {
	it("frames native messages and splits a stream back into them", () => {
		const got = [];
		const feed = frames((m) => got.push(m));
		const both = Buffer.concat([frame({ a: 1 }), frame({ b: "ż" })]);
		feed(both.subarray(0, 5));
		feed(both.subarray(5));
		expect(got).toEqual([{ a: 1 }, { b: "ż" }]);
		const said = [];
		const line = lines((m) => said.push(m));
		line('{"x":1}\n{"y"');
		line(":2}\n");
		expect(said).toEqual([{ x: 1 }, { y: 2 }]);
	});

	it("carries a tool call from the server through the host to the extension and back", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "smc-")), "debug.sock");
		const input = new PassThrough(); // what Firefox writes to the host
		const output = new PassThrough(); // what the host writes to Firefox
		const { server, close } = host({ input, output, path, log: () => {} });
		await new Promise((done) => server.once("listening", done));
		// the extension: answers each request with its tool's name
		output.on(
			"data",
			frames((req) => input.write(frame({ id: req.id, result: { tool: req.tool, args: req.args } }))),
		);
		expect(await ask("tabs", { a: 1 }, { path })).toEqual({ tool: "tabs", args: { a: 1 } });
		const call = { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "query", arguments: { tabId: 1 } } };
		const answer = await handle(call, { path });
		expect(JSON.parse(answer.result.content[0].text)).toEqual({ tool: "query", args: { tabId: 1 } });
		close();
	});

	it("speaks MCP: initialize, tools/list, and a tool call with Firefox not connected", async () => {
		const init = await handle({
			jsonrpc: "2.0",
			id: 1,
			method: "initialize",
			params: { protocolVersion: "2025-06-18" },
		});
		expect(init.result).toMatchObject({ protocolVersion: "2025-06-18", capabilities: { tools: {} } });
		expect(init.result.serverInfo.name).toBe("save-my-chat-debug");
		expect(await handle({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
		const { result } = await handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
		expect(result.tools.map((t) => t.name)).toEqual(TOOLS.map((t) => t.name));
		for (const t of result.tools) expect(t.inputSchema.type).toBe("object");
		const path = join(mkdtempSync(join(tmpdir(), "smc-")), "none.sock");
		const off = await handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "tabs" } }, { path });
		expect(off.result).toEqual({ content: [{ type: "text", text: NOT_CONNECTED }], isError: true });
		expect((await handle({ jsonrpc: "2.0", id: 4, method: "nope" })).error.code).toBe(-32601);
	});
});

describe("the debug gate's samples and setup", () => {
	it("are saved only for a share the map lists, e-mail addresses masked", () => {
		const dir = mkdtempSync(join(tmpdir(), "smc-samples-"));
		const shot = {
			url: "https://claude.ai/share/abc#x",
			title: "T",
			html: "<p>me@mail.example.com</p>",
			read: { turns: [] },
		};
		expect(() => save(shot, "one", dir)).toThrow(/no resources\/samples\/.map.json/);
		writeFileSync(join(dir, ".map.json"), JSON.stringify({ claude: [{ url: "https://claude.ai/share/abc" }] }));
		expect(() => save({ ...shot, url: "https://claude.ai/chat/private" }, "one", dir)).toThrow(/not in/);
		expect(() => save(shot, "../up", dir)).toThrow(/name/);
		expect(save(shot, "one", dir).files).toEqual(["page.html", "read.json"]);
		expect(readFileSync(join(dir, "DN_claude.ai", "one", "page.html"), "utf8")).toBe("<p>someone@example.invalid</p>");
		expect(JSON.parse(readFileSync(join(dir, "DN_claude.ai", "one", "read.json"), "utf8")).read).toEqual({ turns: [] });
		expect([...listed(["https://a.example/x#y", { b: "not a url" }])]).toEqual(["https://a.example/x"]);
		expect(masked("a.b+c@d-e.org")).toBe("someone@example.invalid");
	});

	it("is a debug build's manifest only, and a native host only this extension may start", () => {
		const release = JSON.parse(readFileSync(new URL("../src/manifest.json", import.meta.url), "utf8"));
		expect(JSON.stringify(release)).not.toMatch(/nativeMessaging|debug/);
		const debug = debugManifest(release);
		expect(debug.name).toBe("save-my-chat (debug)");
		expect(debug.background.scripts.at(-1)).toBe("debug/background.js");
		expect(debug.optional_permissions).toContain("nativeMessaging");
		expect(debug.optional_host_permissions).toEqual(expect.arrayContaining(["https://*/*", "http://*/*"]));
		expect(debug.permissions).toEqual(release.permissions);
		const where = places("/home/u", "linux");
		expect(where.manifest).toBe("/home/u/.mozilla/native-messaging-hosts/save_my_chat_debug.json");
		expect(manifest(where.launcher)).toMatchObject({
			name: "save_my_chat_debug",
			type: "stdio",
			allowed_extensions: ["save-my-chat@radiokociamuzyka.pl"],
		});
		mkdirSync(tmpdir(), { recursive: true });
	});
});
