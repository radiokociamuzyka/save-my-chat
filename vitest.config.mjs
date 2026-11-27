// The tests load src/vendor/ (gitignored, Q10): it is gathered before any test
// runs, so `npx vitest` works on a fresh clone or after switching branches.
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: { globalSetup: ["tests/setup.js"] },
});
