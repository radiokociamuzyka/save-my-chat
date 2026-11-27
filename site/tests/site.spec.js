// The public site, built (Q13): the project page, the viewer needing no extension,
// and the extension's own popup and options run with Firefox's APIs played by the page.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

const CHAT = {
	format: "save-my-chat/0",
	source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/1" },
	title: "From a file",
	savedAt: "2026-11-27T10:00:00.000Z",
	turns: [
		{ role: "user", text: "Hi? <img src=x onerror=alert(1)>" },
		{ role: "assistant", text: "Hello, see ![a cat](https://cats.example/c.png)." },
	],
};

// the site loads nothing from anywhere else: every request stays on localhost
test.beforeEach(async ({ page }) => {
	const away = [];
	page.on("request", (r) => {
		if (!r.url().startsWith("http://localhost:4321/")) away.push(r.url());
	});
	page.away = away;
});
test.afterEach(async ({ page }) => {
	expect(page.away).toEqual([]);
});

test("the project page lists every reader shipped", async ({ page }) => {
	await page.goto("./");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your AI chats, saved on your own machine.");
	await expect(page.getByRole("link", { name: "Add to Firefox" })).toHaveAttribute("href", /addons\.mozilla\.org/);
	const shipped = parse(readFileSync("resources/data/chats.yaml", "utf8")).chats.filter((c) => c.status === "default");
	await expect(page.locator("table.readers tbody tr")).toHaveCount(shipped.length);
	for (const c of shipped) await expect(page.locator("table.readers")).toContainText(c.name);
});

test("the viewer reads a saved file, its HTML as text and its images not loaded", async ({ page }) => {
	await page.goto("viewer/");
	await page.locator("input.open-file").setInputFiles({
		name: "chat.json",
		mimeType: "application/json",
		buffer: Buffer.from(JSON.stringify(CHAT)),
	});
	await expect(page.locator(".chat-view h2")).toHaveText("From a file");
	await expect(page.locator(".turn .tag")).toHaveText(["User", "Assistant"]);
	await expect(page.locator(".chat-view")).toContainText("<img src=x onerror=alert(1)>");
	await expect(page.locator(".chat-view img")).toHaveCount(0);
	await expect(page.locator(".chat-view")).toContainText("[image: a cat]");
	await page.locator("input.open-file").setInputFiles({ name: "notes.md", mimeType: "text/markdown", buffer: Buffer.from("# notes") });
	await expect(page.locator(".viewer-status")).toHaveText("notes.md: Not a file saved by save-my-chat: no front matter.");
});

test("the popup runs on the site, sees the made-up chat and saves it", async ({ page }) => {
	await page.goto("demo/");
	const popup = page.locator(".demo-popup");
	await expect(popup.locator(".state")).toHaveText("Reader: GitHub Copilot - sees 2 user, 1 assistant");
	await popup.getByRole("button", { name: "Save as Markdown" }).click();
	await expect(popup).toContainText('Saved "Why does the build fail on CI?", 3 messages.');
});

test("the options run on the site: the library, its search, the viewer, the readers", async ({ page }) => {
	await page.goto("demo/");
	const options = page.locator(".demo-options");
	await expect(options.locator(".entry")).toHaveCount(2);
	await options.locator("input[type=search]").fill("turtles");
	await expect(options.locator(".entry")).toHaveCount(1);
	await options.locator(".entry button.read").click();
	await expect(options.locator(".tabs li.is-active")).toHaveText("Viewer");
	await expect(options.locator(".chat-view h2")).toHaveText("How long do turtles live?");
	await options.getByRole("link", { name: "Readers" }).click();
	await expect(options.locator(".reader strong")).toHaveText(["Google Search, AI Mode", "GitHub Copilot"]);
	await options.getByRole("link", { name: "Prototypes" }).click();
	await options.getByRole("button", { name: "Make a prototype of GitHub Copilot" }).click();
	await expect(options.locator("textarea.code")).toHaveValue(/SMC\.reader\(/);
});
