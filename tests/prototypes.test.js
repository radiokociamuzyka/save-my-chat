// The options page's prototypes, in jsdom with Firefox's APIs stubbed.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { load } from "./load.js";

const HTML = `<!doctype html><body>
	<button id="allow" hidden></button><span id="allowed"></span>
	<ul id="prototypes"></ul>
	<button id="export"></button><input type="file" id="import"><span id="prototypes-status"></span></body>`;

function page({ stored = {}, granted = false } = {}) {
	const w = load(["core/kit.js", "core/readers.js"], { html: HTML });
	const data = structuredClone(stored);
	const state = { granted, asked: 0 };
	w.browser = {
		storage: {
			local: {
				get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])),
				set: async (values) => Object.assign(data, structuredClone(values)),
			},
		},
		permissions: {
			contains: async (p) =>
				p.permissions
					? state.granted
					: p.origins.every((o) => ["https://www.google.com/*", "https://github.com/*"].includes(o)),
			request: async () => {
				state.asked++;
				state.granted = true;
				return true;
			},
		},
	};
	// the real reader files, as the options page fetches them (a stub once hid RR2's bug)
	w.fetch = async (path) => ({ text: async () => load.source(path.replace(/^\.\.\//, "")) });
	w.eval(load.source("options/prototypes.js"));
	const settle = () => new Promise((done) => setTimeout(done, 30));
	const $ = (css) => w.document.querySelector(css);
	return { w, data, state, settle, $ };
}

describe("options: prototypes", () => {
	it("asks for user scripts only on the user's click", async () => {
		const { $, state, settle } = page();
		await settle();
		expect($("#allow").hidden).toBe(false);
		expect($("#allowed").textContent).toMatch(/asks you to allow once/);
		$("#allow").click();
		await settle();
		expect(state.asked).toBe(1);
		expect($("#allow").hidden).toBe(true);
	});

	it("copies a default reader's file into an editor, saved as a prototype", async () => {
		const { $, data, settle, w } = page({ granted: true });
		await settle();
		const copies = [...w.document.querySelectorAll("#prototypes button")];
		expect(copies.map((b) => b.textContent)).toEqual([
			"Make a prototype of Google Search, AI Mode",
			"Make a prototype of GitHub Copilot",
		]);
		copies[1].click();
		await settle();
		expect(data.prototypes["github-copilot"]).toEqual({
			id: "github-copilot",
			name: "GitHub Copilot",
			from: "github-copilot",
			matches: ["https://github.com/copilot*"],
			code: load.source("readers/github-copilot.js"),
			enabled: true,
		});
		expect($("legend").textContent).toBe("GitHub Copilot, your prototype");
		// saved unchanged, as RR2 did: accepted
		w.document.querySelector("fieldset button").click();
		await settle();
		expect($("fieldset [role=status]").textContent).toBe("Saved. Reload the chat's page to run it.");
	});

	it("saves an edit, refuses a site it may not read or code with no reader, turns off and deletes", async () => {
		const proto = {
			id: "github-copilot",
			name: "GitHub Copilot",
			from: "github-copilot",
			matches: ["https://github.com/copilot*"],
			code: "SaveMyChat.reader({})",
			enabled: true,
		};
		const { $, data, settle, w } = page({ granted: true, stored: { prototypes: { "github-copilot": proto } } });
		await settle();
		const [matches, code] = w.document.querySelectorAll("fieldset textarea");
		const [save, drop] = w.document.querySelectorAll("fieldset button");
		matches.value = "https://evil.example/*";
		save.click();
		await settle();
		expect($("fieldset [role=status]").textContent).toMatch(/Not a site this extension may read: https:\/\/evil/);
		matches.value = "https://github.com/copilot/c/*";
		code.value = "console.log(1)";
		save.click();
		await settle();
		expect($("fieldset [role=status]").textContent).toMatch(/registers no reader/);
		code.value = "SaveMyChat.reader({ id: 'github-copilot' })";
		save.click();
		await settle();
		expect(data.prototypes["github-copilot"]).toMatchObject({
			matches: ["https://github.com/copilot/c/*"],
			code: "SaveMyChat.reader({ id: 'github-copilot' })",
		});
		const enabled = $("fieldset input[type=checkbox]");
		enabled.checked = false;
		enabled.dispatchEvent(new w.Event("change"));
		await settle();
		expect(data.prototypes["github-copilot"].enabled).toBe(false);
		drop.click();
		await settle();
		expect(data.prototypes).toEqual({});
	});

	it("imports a file of prototypes turned off, skipping broken ones and fields it does not know", async () => {
		const { $, data, settle, w } = page({ granted: true });
		await settle();
		const file = {
			format: "save-my-chat/prototypes/0",
			prototypes: [
				{
					id: "mine",
					name: "Mine",
					from: "github-copilot",
					matches: ["https://github.com/*"],
					code: "x",
					enabled: true,
					extra: 1,
				},
				{ id: "../bad", name: "Bad", matches: [], code: "" },
			],
		};
		Object.defineProperty($("#import"), "files", {
			value: [{ text: async () => JSON.stringify(file) }],
			configurable: true,
		});
		$("#import").dispatchEvent(new w.Event("change"));
		await settle();
		expect(data.prototypes).toEqual({
			mine: {
				id: "mine",
				name: "Mine",
				from: "github-copilot",
				matches: ["https://github.com/*"],
				code: "x",
				enabled: false,
			},
		});
		expect($("#prototypes-status").textContent).toBe(
			"1 imported, turned off: look at each, then turn it on. 1 skipped as broken.",
		);
	});
});

it("the options page loads the prototypes' script and has their places", () => {
	const html = readFileSync(new URL("../src/options/options.html", import.meta.url), "utf8");
	for (const id of ["allow", "allowed", "prototypes", "export", "import", "prototypes-status"])
		expect(html).toContain(`id="${id}"`);
	expect(html).toContain('<script src="prototypes.js"></script>');
});
