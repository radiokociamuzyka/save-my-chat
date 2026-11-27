// The built extension in a real Firefox (Q14): its pages run under the extension's
// CSP, the kit and readers load as classic scripts, Vue mounts, the background answers.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { all, find, open, ROOT, run, shot, start, texts } from "./firefox.js";

const CHAT = {
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/1" },
	title: "Fix the build",
	savedAt: "2026-11-27T10:00:00.000Z",
	turns: [
		{ role: "user", text: "Why does `npm test` fail on CI?" },
		{
			role: "assistant",
			author: "GPT-5",
			text: "The **runner** lacks a display:\n\n```yaml\n- run: xvfb-run npm test\n```\n\n| Option | Why |\n|---|---|\n| xvfb | a display |\n\n![diagram](https://example.org/d.png)",
		},
	],
};

let driver;
beforeAll(async () => {
	driver = await start();
});
afterAll(async () => {
	await driver?.quit();
});

describe("in Firefox: the options", () => {
	it("open on the library, empty, with the five tabs", async () => {
		await open(driver, "options/options.html");
		await find(driver, ".library-status");
		expect(await texts(driver, ".tabs li")).toEqual(["Library", "Viewer", "Files", "Gather", "Readers", "Prototypes"]);
		expect(await (await find(driver, ".library-status")).getText()).toMatch(/Nothing saved yet/);
	});

	it("list the readers with their built-in selectors, from the classic scripts", async () => {
		await open(driver, "options/options.html#readers");
		await find(driver, ".reader");
		expect(await texts(driver, ".reader strong")).toEqual(["Google Search, AI Mode", "GitHub Copilot"]);
		expect((await texts(driver, ".built-in")).length).toBeGreaterThan(0);
		await shot(driver, "readers");
	});

	it("keep what the library holds, and read it in the viewer", async () => {
		await open(driver, "options/options.html");
		await find(driver, ".library-status");
		const key = `${CHAT.source.reader} ${CHAT.source.url}`;
		const entry = {
			key,
			title: CHAT.title,
			reader: "github-copilot",
			service: CHAT.source.service,
			url: CHAT.source.url,
			turns: 2,
			firstSavedAt: CHAT.savedAt,
			savedAt: CHAT.savedAt,
			saves: 1,
		};
		await run(driver, "await browser.storage.local.set(args[0]);", {
			library: { [key]: entry },
			[`chat:${key}`]: CHAT,
		});
		await driver.navigate().refresh();
		await (await find(driver, ".entry button.read")).click();
		await find(driver, ".chat-view h2");
		expect(await texts(driver, ".tabs li.is-active")).toEqual(["Viewer"]);
		expect(await texts(driver, ".turn .tag")).toEqual(["User", "Assistant"]);
		expect(await (await find(driver, ".turn.assistant pre code")).getText()).toBe("- run: xvfb-run npm test");
		expect(await all(driver, ".chat-view img")).toHaveLength(0);
		await shot(driver, "viewer");
	});

	it("keep the library as files in IndexedDB, with their history", async () => {
		await open(driver, "options/options.html#files");
		await driver.wait(async () => (await all(driver, "a.file")).length === 2, 15_000);
		expect(await texts(driver, "a.file")).toEqual(["2026-11-27-fix-the-build.json", "2026-11-27-fix-the-build.md"]);
		await (await all(driver, "a.file"))[1].click();
		await find(driver, ".version");
		expect(await (await find(driver, ".version")).getText()).toContain("Fix the build (2 messages)");
		await shot(driver, "files");
		await (await find(driver, ".version button.read")).click();
		expect(await (await find(driver, ".chat-view h2")).getText()).toBe("Fix the build");
		await run(driver, "await browser.storage.local.clear();");
	});

	it("open a saved file in the viewer", async () => {
		// in dist/, not the system's temp: a Firefox of a snap sees only its own /tmp
		const file = join(ROOT, "dist/firefox-test-chat.json");
		writeFileSync(file, JSON.stringify({ ...CHAT, title: "From a file" }));
		await open(driver, "options/options.html#viewer");
		await (await find(driver, "input.open-file")).sendKeys(file);
		expect(await (await find(driver, ".chat-view h2")).getText()).toBe("From a file");
	});
});

describe("in Firefox: the popup", () => {
	it("mounts, and says when the tab holds no chat", async () => {
		await open(driver, "popup/popup.html");
		const state = await find(driver, ".state");
		await driver.wait(async () => (await state.getText()) !== "Looking for a conversation…", 10_000);
		expect(await state.getText()).toBe("No supported chat on this page.");
		await shot(driver, "popup");
	});
});
