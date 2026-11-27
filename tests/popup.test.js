// @vitest-environment jsdom
// The toolbar popup (Q12: a Vue component), mounted with the background stubbed.
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { reportOf, sinceLine } from "../src/popup/report.js";
import ToolbarPopup from "../src/popup/ToolbarPopup.vue";

const SEEN = {
	reader: "github-copilot",
	host: "github.com",
	parts: { user: [{ css: ".u", found: 2, override: false }], assistant: [{ css: ".a", found: 2, override: true }] },
	turns: { user: 2, assistant: 2 },
	order: "U A U A",
	warnings: [],
};

function popup(answers) {
	const sent = [];
	globalThis.browser = {
		runtime: {
			getManifest: () => ({ version: "9.9.9" }),
			sendMessage: vi.fn(async (msg) => {
				sent.push(msg);
				const a = answers[msg.type];
				return typeof a === "function" ? a(msg) : a;
			}),
		},
		tabs: { query: async () => [{ id: 7, url: "https://github.com/copilot/c/1" }] },
	};
	return { wrapper: mount(ToolbarPopup), sent };
}

describe("the toolbar popup", () => {
	it("names the reader, what it sees, and when the chat was saved before", async () => {
		const { wrapper } = popup({
			"save-my-chat:present": { id: "github-copilot", name: "GitHub Copilot" },
			"save-my-chat:inspect": SEEN,
			"save-my-chat:since": { savedAt: "2026-11-27T10:00:00Z", saved: 2, now: 4, grew: 2 },
		});
		await flushPromises();
		expect(wrapper.find(".state").text()).toBe("Reader: GitHub Copilot - sees 2 user, 2 assistant");
		expect(wrapper.text()).toMatch(/with 2 messages: 2 new since\./);
		expect(wrapper.find("pre").text()).toBe(reportOf(SEEN, "9.9.9"));
	});

	it("saves, and says what was saved or what went wrong", async () => {
		let fail = false;
		const { wrapper, sent } = popup({
			"save-my-chat:present": { id: "github-copilot", name: "GitHub Copilot" },
			"save-my-chat:inspect": SEEN,
			"save-my-chat:since": null,
			"save-my-chat:save": () => {
				if (fail) throw new Error("No conversation found on this page.");
				return { title: "A chat", turns: 4, warnings: ["one warning"] };
			},
		});
		await flushPromises();
		await wrapper.findAll("button")[1].trigger("click");
		await flushPromises();
		expect(sent.at(-1)).toEqual({ type: "save-my-chat:save", tabId: 7, as: "json" });
		expect(wrapper.text()).toMatch(/Saved "A chat", 4 messages\.\s*one warning/);
		fail = true;
		await wrapper.findAll("button")[0].trigger("click");
		await flushPromises();
		expect(wrapper.find(".has-text-danger").text()).toBe("No conversation found on this page.");
	});

	it("says when there is no chat, and when a prototype needs the page reloaded", async () => {
		expect((await mounted({ "save-my-chat:present": null })).find(".state").text()).toBe(
			"No supported chat on this page.",
		);
		const blocked = await mounted({
			"save-my-chat:present": { id: "x", name: "X", prototype: true, error: "reload the page" },
		});
		expect(blocked.find(".state").text()).toBe("Reader: X (your prototype)");
		expect(blocked.text()).toContain("reload the page");
		expect(blocked.findAll("button")).toHaveLength(0);
	});

	it("words the library's line", () => {
		expect(sinceLine(null)).toBeNull();
		expect(sinceLine({ savedAt: "2026-11-27T10:00:00Z", saved: 4, now: 4, grew: 0 }).kind).toBe("note");
	});
});

async function mounted(answers) {
	const { wrapper } = popup(answers);
	await flushPromises();
	return wrapper;
}
