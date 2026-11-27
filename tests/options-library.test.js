// The options page's library section, the background answered by a stub.
import { describe, expect, it } from "vitest";
import { load } from "./load.js";

describe("options: the library", () => {
	it("lists what was saved, saves it again, forgets it, searches", async () => {
		const w = load([], {
			html: '<!doctype html><body><input id="library-search"><span id="library-status"></span><ul id="library"></ul></body>',
		});
		let entries = [
			{
				key: "k",
				title: "Turtles",
				url: "https://x/",
				service: "google.com/search",
				turns: 2,
				savedAt: "2026-11-28T09:00:00Z",
				saves: 2,
			},
		];
		const sent = [];
		w.browser = {
			runtime: {
				sendMessage: async (msg) => {
					sent.push(msg);
					if (msg.type === "save-my-chat:library") return entries.filter((e) => e.title.includes(msg.query));
					if (msg.type === "save-my-chat:library-forget") entries = [];
				},
			},
		};
		w.eval(load.source("options/library.js"));
		const settle = () => new Promise((done) => setTimeout(done, 20));
		await settle();
		const li = w.document.querySelector("#library li");
		expect(li.textContent).toMatch(
			/^Turtles google.com\/search, 2 messages, saved .* \(2 times\) Markdown JSON Forget$/,
		);
		const [md, json, forget] = li.querySelectorAll("button");
		md.click();
		json.click();
		expect(sent.filter((m) => m.type === "save-my-chat:library-save").map((m) => m.as)).toEqual(["md", "json"]);
		const search = w.document.getElementById("library-search");
		search.value = "Cats";
		search.dispatchEvent(new w.Event("input"));
		await settle();
		expect(w.document.getElementById("library-status").textContent).toBe("Nothing saved matches that.");
		search.value = "";
		search.dispatchEvent(new w.Event("input"));
		await settle();
		w.document.querySelector("#library li button:last-child").click();
		await settle();
		expect(w.document.getElementById("library-status").textContent).toMatch(/Nothing saved yet/);
		expect(forget).toBeTruthy();
	});
});
