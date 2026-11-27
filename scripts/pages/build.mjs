// The project's static page (phase 2) into dist/pages/: resources/pages/ with its {{marks}}
// filled from package.json and resources/data/chats.yaml. .github/workflows/pages.yml
// publishes it on the github-pages branch after a release.
//   node scripts/pages/build.mjs               into dist/pages
//   node scripts/pages/build.mjs --out <dir>   somewhere else
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const ROOT = new URL("../../", import.meta.url);
const at = (path) => new URL(path, ROOT);
const REPO = "https://github.com/radiokociamuzyka/save-my-chat";
const DOCS = "https://save-my-chat.readthedocs.io/en/latest/";

const html = (text) =>
	String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// the readers shipped, a row each; a conversation's address with its `*` written as an ellipsis
export function rows(chats) {
	return chats
		.filter((c) => c.status === "default")
		.map((c) => {
			const address = (c.chats ?? []).map((a) => `<code>${html(a.replaceAll("*", "…"))}</code>`).join("<br>");
			const state = c.verified ? "checked on live chats" : "not yet checked on a live chat";
			return `\t\t\t\t\t<tr><td>${html(c.name)}</td><td>${address}</td><td>${state}</td></tr>`;
		})
		.join("\n");
}

export function planned(chats) {
	return html(
		chats
			.filter((c) => c.status === "planned")
			.map((c) => c.name)
			.join(", "),
	);
}

// the template's marks filled; a mark left unknown is an error, not a hole in the page
export function fill(template, values) {
	return template.replace(/\{\{(\w+)\}\}/g, (_all, name) => {
		if (!(name in values)) throw new Error(`pages: no value for {{${name}}}`);
		return values[name];
	});
}

export function build({ out = "dist/pages" } = {}) {
	const { version } = JSON.parse(readFileSync(at("package.json"), "utf8"));
	const { chats } = parse(readFileSync(at("resources/data/chats.yaml"), "utf8"));
	const values = {
		version: html(version),
		download: `${REPO}/releases/latest/download/save-my-chat.zip`,
		docs: DOCS,
		repo: REPO,
		readers: rows(chats),
		planned: planned(chats),
	};
	rmSync(at(`${out}/`), { recursive: true, force: true });
	mkdirSync(at(`${out}/`), { recursive: true });
	const files = readdirSync(at("resources/pages/"));
	for (const name of files) {
		if (name.endsWith(".html"))
			writeFileSync(at(`${out}/${name}`), fill(readFileSync(at(`resources/pages/${name}`), "utf8"), values));
		else copyFileSync(at(`resources/pages/${name}`), at(`${out}/${name}`));
	}
	writeFileSync(at(`${out}/.nojekyll`), ""); // served as written, not through Jekyll
	return { version, files: files.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const i = process.argv.indexOf("--out");
	const { version, files } = build({ out: i > 0 ? process.argv[i + 1] : undefined });
	console.log(`pages: ${files} files, v${version}`);
}
