// The wiki generated from docs/ (phase 2): the devlog, the changelog and the almanac, in
// each language of resources/data/wiki.yaml. Pages go to dist/wiki/; .github/workflows/wiki.yml
// pushes them to save-my-chat.wiki.git after a release.
//   node scripts/wiki/build.mjs                    translate what the memory lacks (wiki.yaml's translator)
//   node scripts/wiki/build.mjs --translator none  the memory only; untranslated text stays English
//   node scripts/wiki/build.mjs --out <dir>        somewhere else than dist/wiki
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, posix } from "node:path";
import { parse } from "yaml";
import { translatePage, translator } from "./translate.mjs";

const ROOT = new URL("../../", import.meta.url);
const at = (path) => new URL(path, ROOT);
const BLOB = "https://github.com/radiokociamuzyka/save-my-chat/blob/master/";
const MEMORY = (code) => `resources/data/translations/${code}.json`;

// wiki.yaml's pages, a "*" in the source matched against the files of its directory
export function expand(pages, list = (dir) => readdirSync(at(dir))) {
	const out = [];
	for (const p of pages) {
		if (!p.from.includes("*")) {
			out.push({ page: p.page, from: p.from, group: p.group });
			continue;
		}
		const dir = dirname(p.from);
		const pattern = new RegExp(`^${posix.basename(p.from).replace(".", "\\.").replace("*", "(.+)")}$`);
		const found = list(dir)
			.map((name) => [name, pattern.exec(name)])
			.filter(([, m]) => m)
			.sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));
		for (const [name, m] of found)
			out.push({ page: p.page.replace("*", m[1]), from: `${dir}/${name}`, group: p.group });
	}
	return out;
}

export const nameIn = (page, code, source) => (code === source ? page : `${page}-${code}`);

// relative links of a source: to the wiki page made from their target, else to GitHub
export function relink(markdown, from, byPath, code, source) {
	return markdown.replace(/\]\((?!https?:|#|mailto:)([^)\s]+?)(#[^)\s]*)?\)/g, (_all, target, hash = "") => {
		const path = posix.normalize(posix.join(posix.dirname(from), target));
		const page = byPath.get(path);
		return page ? `](${nameIn(page, code, source)}${hash})` : `](${BLOB}${path}${hash})`;
	});
}

function banner(p, code, config) {
	const switcher = config.languages
		.map((l) => (l.code === code ? `**${l.name}**` : `[${l.name}](${nameIn(p.page, l.code, config.source)})`))
		.join(" · ");
	const note =
		code === config.source
			? "Generated from"
			: "Translated by machine from the English page, which is the one to trust. Generated from";
	return `${switcher}\n\n*${note} [${p.from}](${BLOB}${p.from}); edit the source, not this page.*\n\n---\n\n`;
}

function home(pages, code, config) {
	const groups = new Map();
	for (const p of pages) groups.set(p.group, [...(groups.get(p.group) || []), p]);
	const lines = [
		"# save-my-chat wiki",
		"",
		"For developers and contributors: how the work goes (the devlog), what happened (the changelog) and what was learnt the hard way (the almanac). The user's documentation is on [Read the Docs](https://save-my-chat.readthedocs.io).",
		"",
	];
	for (const [group, list] of groups) {
		lines.push(`## ${group}`, "");
		for (const p of list) lines.push(`- [${p.page.replaceAll("-", " ")}](${nameIn(p.page, code, config.source)})`);
		lines.push("");
	}
	return lines.join("\n");
}

function sidebar(config) {
	return config.languages
		.map((l) => `**${l.name}**: [Home](${nameIn("Home", l.code, config.source)})`)
		.join(" · ")
		.concat("\n");
}

export async function build({ out = "dist/wiki", translatorKind } = {}) {
	const config = parse(readFileSync(at("resources/data/wiki.yaml"), "utf8"));
	const pages = expand(config.pages);
	const byPath = new Map(pages.map((p) => [p.from, p.page]));
	const kind = translatorKind ?? config.translator ?? "none";
	const translate = translator(kind, { from: config.source });
	rmSync(at(`${out}/`), { recursive: true, force: true });
	mkdirSync(at(`${out}/`), { recursive: true });
	const write = (name, text) => writeFileSync(at(`${out}/${name}.md`), text.endsWith("\n") ? text : `${text}\n`);
	const report = {};
	for (const lang of config.languages) {
		const { code } = lang;
		let memory = {};
		const used = new Set();
		if (code !== config.source) {
			try {
				memory = JSON.parse(readFileSync(at(MEMORY(code)), "utf8"));
			} catch {
				memory = {};
			}
		}
		let untranslated = 0;
		const render = async (text) => {
			if (code === config.source) return text;
			const done = await translatePage(text, code, { memory, translate });
			for (const t of done.used) used.add(t);
			untranslated += done.untranslated;
			return done.markdown;
		};
		for (const p of pages) {
			const source = readFileSync(at(p.from), "utf8");
			const page = banner(p, code, config) + relink(source, p.from, byPath, code, config.source);
			write(nameIn(p.page, code, config.source), await render(page));
		}
		write(nameIn("Home", code, config.source), await render(home(pages, code, config)));
		if (code !== config.source) {
			// the memory keeps what the wiki uses now, sorted, so its diffs read well
			const kept = Object.fromEntries(
				[...used]
					.filter((t) => t in memory)
					.sort()
					.map((t) => [t, memory[t]]),
			);
			writeFileSync(at(MEMORY(code)), `${JSON.stringify(kept, null, "\t")}\n`);
		}
		report[code] = { pages: pages.length + 1, untranslated };
	}
	write("_Sidebar", sidebar(config));
	write("_Footer", "Generated by `task wiki` from the repository's `docs/`; changes made here are written over.");
	return { kind, report };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const arg = (name) => {
		const i = process.argv.indexOf(name);
		return i > 0 ? process.argv[i + 1] : undefined;
	};
	const { kind, report } = await build({ out: arg("--out"), translatorKind: arg("--translator") });
	for (const [code, r] of Object.entries(report))
		console.log(`wiki ${code}: ${r.pages} pages${r.untranslated ? `, ${r.untranslated} texts not translated` : ""}`);
	console.log(`translator: ${kind}`);
}
