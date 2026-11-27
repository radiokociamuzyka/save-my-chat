// The public site in browsers (Q13, Q14): Playwright against the built site served
// by `astro preview`, in Chromium and Firefox. `npm run test:site` (task test:site).
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "site/tests",
	outputDir: "dist/playwright",
	reporter: [["list"]],
	use: { baseURL: "http://localhost:4321/save-my-chat/" },
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
	],
	webServer: {
		command: "npx astro preview --port 4321",
		url: "http://localhost:4321/save-my-chat/",
		reuseExistingServer: !process.env.CI,
	},
});
