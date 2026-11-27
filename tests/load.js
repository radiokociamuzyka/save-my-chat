// Loads the extension's classic scripts into a fresh jsdom window, the way
// Firefox loads them into a page: one after another, sharing globalThis.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

// paths, not new URL(..., import.meta.url): Vite rewrites that into an asset in a jsdom test
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "../src");

// What a page gets before a reader: turndown, its GFM plugin, the kit.
export const KIT = ["vendor/turndown.js", "vendor/turndown-plugin-gfm.js", "core/kit.js"];

export function load(files, { html = "<!doctype html><body></body>", url = "https://example.com/" } = {}) {
	const dom = new JSDOM(html, { url, runScripts: "outside-only" });
	for (const file of files) dom.window.eval(readFileSync(join(SRC, file), "utf8"));
	return dom.window;
}

// a file of src/ as text, to eval into a window that load() made
load.source = (file) => readFileSync(join(SRC, file), "utf8");

export function fixture(name) {
	return readFileSync(join(HERE, "fixtures", name), "utf8");
}
