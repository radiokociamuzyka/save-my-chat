// Loads the extension's classic scripts into a fresh jsdom window, the way
// Firefox loads them into a page: one after another, sharing globalThis.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const SRC = new URL("../src/", import.meta.url);

export function load(files, { html = "<!doctype html><body></body>", url = "https://example.com/" } = {}) {
	const dom = new JSDOM(html, { url, runScripts: "outside-only" });
	for (const file of files) dom.window.eval(readFileSync(new URL(file, SRC), "utf8"));
	return dom.window;
}

export function fixture(name) {
	return readFileSync(new URL(`fixtures/${name}`, import.meta.url), "utf8");
}
