// The tests load src/vendor/ (gitignored, Q10): it is gathered before any test
// runs, so `npx vitest` works on a fresh clone or after switching branches.
// The Vue plugin lets them mount the pages' .vue files (Q12).
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [vue()],
	test: { globalSetup: ["tests/setup.js"] },
});
