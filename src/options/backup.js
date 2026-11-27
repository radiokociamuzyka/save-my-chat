// The library packed into one .zip, a backup (phase 5, Sett 2026-11-27): every chat
// as Markdown and JSON, at the paths of the Files tab (src/explorer/repo.js pathsOf)
// under save-my-chat/, and library.json, the index, to know what each file was.
// Made in the options page and handed to the downloads API: nothing leaves the machine.
import { strToU8, zipSync } from "fflate";
import { pathsOf } from "../explorer/repo.js";

const ROOT = "save-my-chat";

// { path: text } of every chat; two chats of one name on one day get -2, -3...
//   entries: the library's index; chats: { key: conversation }; markdown(c), slug(t): of core/markdown.js
export function filesOf(entries, chats, { markdown, slug }) {
	const files = {};
	const index = [];
	for (const entry of [...entries].sort((a, b) => a.firstSavedAt.localeCompare(b.firstSavedAt))) {
		const c = chats[entry.key];
		if (!c) continue;
		let { md, json } = pathsOf(entry, slug);
		for (let n = 2; files[`${ROOT}/${md}`]; n++) ({ md, json } = renamed(pathsOf(entry, slug), n));
		files[`${ROOT}/${md}`] = markdown(c);
		files[`${ROOT}/${json}`] = `${JSON.stringify(c, null, "\t")}\n`;
		index.push({ ...entry, files: { md, json } });
	}
	files[`${ROOT}/library.json`] = `${JSON.stringify({ format: "save-my-chat/library/0", chats: index }, null, "\t")}\n`;
	return files;
}

const renamed = ({ md, json }, n) => ({
	md: md.replace(/\.md$/, `-${n}.md`),
	json: json.replace(/\.json$/, `-${n}.json`),
});

// the .zip's bytes, compressed
export const zip = (files) =>
	zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])), { level: 6 });

// the name the downloads API is given
export const zipName = (now = new Date()) => `${ROOT}/backup-${now.toISOString().slice(0, 10)}.zip`;

// the whole library asked of the background, packed, downloaded; resolves to how many chats
//   ask(msg): browser.runtime.sendMessage; tools: { markdown, slug }
export async function backup(ask, tools, downloads = globalThis.browser?.downloads) {
	const entries = await ask({ type: "save-my-chat:library" });
	const chats = {};
	for (const e of entries) chats[e.key] = await ask({ type: "save-my-chat:library-chat", key: e.key });
	const files = filesOf(entries, chats, tools);
	const url = URL.createObjectURL(new Blob([zip(files)], { type: "application/zip" }));
	try {
		await downloads.download({ url, filename: zipName(), saveAs: false });
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
	}
	return Object.keys(chats).filter((k) => chats[k]).length;
}
