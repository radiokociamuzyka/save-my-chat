// The build step (Q12): Vite builds the extension's pages that are Vue (PAGES) into
// dist/extension/, and copies the rest of src/ - the manifest, the background, the
// kit, the readers, src/vendor/ - as it is. web-ext runs, lints and packs
// dist/extension/. Not minified, file names without hashes: what AMO's reviewers
// read stays close to the source uploaded with it.
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const SRC = new URL("src/", import.meta.url).pathname;
const OUT = new URL("dist/extension/", import.meta.url).pathname;
export const PAGES = ["popup"];
// not part of the extension: Sett's snippets (Q5)
const LEFT_OUT = ["readers/drafted-snippets"];

const copied = (from) => !LEFT_OUT.some((left) => from.startsWith(`${SRC}${left}`));

// every file copied as it is, so `vite build --watch` (task run) copies again what changed
function files(dir = SRC) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (dir === SRC && PAGES.includes(e.name)) return [];
		if (!copied(path)) return [];
		return e.isDirectory() ? files(path) : [path];
	});
}

// src/ as it is, but the pages Vite builds and what is left out
function copyRest() {
	return {
		name: "save-my-chat:copy-rest",
		buildStart() {
			for (const file of files()) this.addWatchFile(file);
		},
		closeBundle() {
			for (const name of readdirSync(SRC)) {
				if (PAGES.includes(name)) continue;
				cpSync(`${SRC}${name}`, `${OUT}${name}`, {
					recursive: true,
					filter: copied,
				});
			}
			if (!existsSync(`${OUT}manifest.json`)) throw new Error("the build has no manifest.json");
		},
	};
}

export default defineConfig({
	root: SRC,
	base: "/",
	plugins: [vue(), copyRest()],
	build: {
		outDir: OUT,
		emptyOutDir: true,
		minify: false,
		modulePreload: { polyfill: false }, // an inline script: the extension's CSP refuses it
		rollupOptions: {
			input: Object.fromEntries(PAGES.map((p) => [p, `${SRC}${p}/${p}.html`])),
			output: {
				entryFileNames: "[name]/[name].js",
				chunkFileNames: "chunks/[name].js",
				assetFileNames: "assets/[name][extname]",
			},
		},
	},
});
