// The public site (Q13): Astro builds site/ into dist/pages/, published on the
// github-pages branch after each release (pages.yml) at
// https://radiokociamuzyka.github.io/save-my-chat/. Its Vue islands are the
// extension's own components (src/viewer, src/popup, src/options), shown without
// the extension. Like the extension, the site loads nothing from anywhere else, but
// the statements of docs/statements/, read raw from the repository's master (Sett, #7).
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

export default defineConfig({
	root: "site",
	srcDir: "site/src",
	publicDir: "site/public",
	outDir: "dist/pages",
	site: "https://radiokociamuzyka.github.io",
	base: "/save-my-chat",
	trailingSlash: "ignore",
	integrations: [vue()],
	devToolbar: { enabled: false },
	telemetry: false,
});
