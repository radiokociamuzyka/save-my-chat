// @vitest-environment jsdom
// A chat as a secret gist (Q9): what is sent, and that nothing is sent before the click,
// the permission asked first in it, and the user's own token.
import { runInThisContext } from "node:vm";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import GistShare from "../src/options/GistShare.vue";
import { API, DATA, filesOf, share } from "../src/options/gist.js";
import { load } from "./load.js";

const CHAT = {
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/1" },
	title: "Fix the build",
	savedAt: "2026-11-27T10:00:00.000Z",
	turns: [{ role: "user", text: "Why?" }],
};
let SMC;
beforeAll(() => {
	runInThisContext(load.source("core/kit.js"));
	runInThisContext(load.source("core/markdown.js"));
	SMC = globalThis.SaveMyChat;
});

describe("the gist", () => {
	it("holds the chat's two files, named as the downloads, and is secret", async () => {
		const tools = { markdown: SMC.toMarkdown, fileName: SMC.fileName };
		expect(Object.keys(filesOf(CHAT, tools))).toEqual(["2026-11-27-fix-the-build.md", "2026-11-27-fix-the-build.json"]);
		const asked = [];
		const octokit = {
			request: async (route, body) => (
				asked.push({ route, body }), { data: { html_url: "https://gist.github.com/x" } }
			),
		};
		expect(await share(CHAT, "t", tools, octokit)).toBe("https://gist.github.com/x");
		expect(asked[0].route).toBe("POST /gists");
		expect(asked[0].body.public).toBe(false);
		expect(asked[0].body.files["2026-11-27-fix-the-build.md"].content).toBe(SMC.toMarkdown(CHAT));
	});

	it("keeps the user's token, asks for GitHub on the click, and says when it is refused", async () => {
		const data = {};
		const requests = [];
		globalThis.browser = {
			storage: {
				local: {
					get: async (k) => ({ [k]: data[k] }),
					set: async (v) => Object.assign(data, v),
					remove: async (k) => delete data[k],
				},
			},
			permissions: {
				request: async (p) => {
					requests.push(p);
					return false;
				},
			},
		};
		const box = mount(GistShare, { props: { chat: CHAT } });
		await flushPromises();
		expect(box.find("button.send").exists()).toBe(false);
		await box.find("input.token").setValue(" ghp_x ");
		await box.find("button.keep").trigger("click");
		await flushPromises();
		expect(data.githubToken).toBe("ghp_x");
		expect(requests).toEqual([]); // nothing asked, nothing sent, before the click
		await box.find("button.send").trigger("click");
		await flushPromises();
		expect(requests).toEqual([{ origins: [API], data_collection: DATA }]);
		expect(box.find(".gist-status").text()).toBe("Not sent: GitHub was not allowed.");
		await box.find("button.forget-token").trigger("click");
		await flushPromises();
		expect(data.githubToken).toBeUndefined();
	});
});
