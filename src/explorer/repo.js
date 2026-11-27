// The stored files (PP1, Q8): every chat of the library as a Markdown and a JSON
// file in a git repository, on a filesystem of ZenFS kept in the extension's own
// IndexedDB, so each copy saved stays in its history. isomorphic-git does the git;
// nothing of it leaves the machine. Used by the options page only (built by Vite).

import { configure, fs, InMemory } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom";
import { Buffer } from "buffer";
import git from "isomorphic-git";

globalThis.Buffer ??= Buffer; // isomorphic-git reads and writes git objects as Buffers

export const DIR = "/chats";
const AUTHOR = { name: "save-my-chat", email: "save-my-chat@localhost" };
let opened = null;

// the filesystem, once per page: IndexedDB, or memory for the tests
export function open({ memory = false } = {}) {
	opened ??= configure({
		mounts: { "/": memory ? InMemory : { backend: IndexedDB, storeName: "save-my-chat-files" } },
	}).then(async () => {
		if (!(await exists(`${DIR}/.git`))) await git.init({ fs, dir: DIR, defaultBranch: "main" });
		return fs;
	});
	return opened;
}

async function exists(path) {
	try {
		await fs.promises.stat(path);
		return true;
	} catch {
		return false;
	}
}

async function read(path) {
	try {
		return await fs.promises.readFile(path, "utf8");
	} catch {
		return null;
	}
}

// a chat's two files, under its reader, named by the day it was first saved: a chat saved
// again keeps its names, so its history is one file's
export function pathsOf(entry, slug) {
	const base = `${entry.reader}/${entry.firstSavedAt.slice(0, 10)}-${slug(entry.title)}`;
	return { md: `${base}.md`, json: `${base}.json` };
}

// the library brought into the repository: a commit per chat whose copy changed since
//   entries: the library's index; chat(key): its last copy; markdown(c), slug(t): of core/markdown.js
export async function sync(entries, { chat, markdown, slug }) {
	await open();
	const done = [];
	for (const entry of [...entries].sort((a, b) => a.savedAt.localeCompare(b.savedAt))) {
		const c = await chat(entry.key);
		if (!c) continue;
		const paths = pathsOf(entry, slug);
		const files = { [paths.md]: markdown(c), [paths.json]: `${JSON.stringify(c, null, "\t")}\n` };
		let changed = false;
		for (const [path, text] of Object.entries(files)) {
			if ((await read(`${DIR}/${path}`)) === text) continue;
			await fs.promises.mkdir(`${DIR}/${path.split("/")[0]}`, { recursive: true });
			await fs.promises.writeFile(`${DIR}/${path}`, text);
			await git.add({ fs, dir: DIR, filepath: path });
			changed = true;
		}
		if (!changed) continue;
		const when = Math.floor(Date.parse(c.savedAt) / 1000);
		await git.commit({
			fs,
			dir: DIR,
			message: `${c.title} (${c.turns.length} ${c.turns.length === 1 ? "message" : "messages"})`,
			author: { ...AUTHOR, timestamp: when, timezoneOffset: 0 },
		});
		done.push(entry.key);
	}
	return done;
}

// every file of the repository, by folder
export async function files() {
	await open();
	const out = [];
	for (const folder of (await fs.promises.readdir(DIR)).filter((n) => n !== ".git").sort())
		for (const name of (await fs.promises.readdir(`${DIR}/${folder}`)).sort()) out.push(`${folder}/${name}`);
	return out;
}

// a file's history, newest first: { oid, message, savedAt }
export async function history(path) {
	await open();
	try {
		const commits = await git.log({ fs, dir: DIR, filepath: path });
		return commits.map((c) => ({
			oid: c.oid,
			message: c.commit.message.trim(),
			savedAt: new Date(c.commit.author.timestamp * 1000).toISOString(),
		}));
	} catch {
		return [];
	}
}

// a file as it is, or as it was at a commit
export async function text(path, oid) {
	await open();
	if (!oid) return read(`${DIR}/${path}`);
	const { blob } = await git.readBlob({ fs, dir: DIR, oid, filepath: path });
	return new TextDecoder().decode(blob);
}
