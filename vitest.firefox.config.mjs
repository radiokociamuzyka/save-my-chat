// The extension in a real Firefox (Q14): Selenium drives geckodriver, the built
// dist/extension/ is loaded as a temporary add-on. Slow, so not part of `npm test`:
// `npm run test:firefox` (task test:firefox), and the checks' job of its own.
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/firefox/**/*.test.js"],
		testTimeout: 60_000,
		hookTimeout: 120_000,
		fileParallelism: false,
	},
});
