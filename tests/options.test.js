// The options page's selector editor, in jsdom with storage.local stubbed.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { load } from "./load.js";

function page(stored = {}) {
	const w = load(["core/kit.js", "core/readers.js", "readers/google-ai-mode.js", "readers/github-copilot.js"], {
		html: '<!doctype html><body><ul id="readers"></ul></body>',
	});
	const data = structuredClone(stored);
	w.browser = {
		storage: {
			local: {
				get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])),
				set: async (values) => Object.assign(data, structuredClone(values)),
			},
		},
	};
	w.eval(readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8"));
	return { w, data, settle: () => new Promise((done) => setTimeout(done, 20)) };
}

describe("options: selector overrides", () => {
	it("shows each reader's parts with the built-in selectors and the user's own", async () => {
		const { w, settle } = page({ selectors: { "github-copilot": { user: [".mine"] } } });
		await settle();
		const legends = [...w.document.querySelectorAll("legend")].map((l) => l.textContent);
		expect(legends).toEqual(["user", "assistant", "user", "assistant"]);
		const areas = w.document.querySelectorAll("textarea");
		expect(areas[2].value).toBe(".mine");
		expect(w.document.querySelector(".built-in").textContent).toContain(".ilZyRc");
	});

	it("saves valid selectors, refuses invalid ones, and goes back to built-in", async () => {
		const { w, data, settle } = page();
		await settle();
		const [user] = w.document.querySelectorAll("textarea");
		const [save, reset] = w.document.querySelectorAll("li")[0].querySelectorAll("button");
		user.value = "div[\n.ok";
		save.click();
		await settle();
		expect(data.selectors).toBeUndefined();
		expect(w.document.querySelector("[role=status]").textContent).toMatch(/Not valid CSS: user: div\[/);
		user.value = " .ok \n\n.also";
		save.click();
		await settle();
		expect(data.selectors).toEqual({ "google-ai-mode": { user: [".ok", ".also"] } });
		reset.click();
		await settle();
		expect(data.selectors).toEqual({});
	});
});
