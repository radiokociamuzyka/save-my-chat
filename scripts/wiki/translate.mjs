// Markdown translated without breaking it (the wiki in more than one language, phase 2).
// The text is cut into units: a paragraph (its wrapped lines joined), a heading, a list
// item, a table cell. Code (fenced and inline), link targets, URLs and quoted lines (the
// owner's words, kept word for word in every language) never reach the translator.
// What was translated once is kept in a memory, resources/data/translations/<code>.json.
import { execFileSync } from "node:child_process";

const FENCE = /^\s*(```|~~~)/;
const LIST = /^(\s*(?:[-*+]|\d+\.)\s+(?:\[[ x]\]\s+)?)(.*)$/;
const HEADING = /^(#{1,6}\s+)(.*)$/;

// the lines of a page as units: { keep } stays as it is, { lead, text } has text to translate
export function units(markdown) {
	const out = [];
	let fence = false;
	let open = null; // the paragraph or list item that wrapped lines continue
	for (const line of markdown.split("\n")) {
		if (FENCE.test(line)) fence = !fence;
		if (fence || FENCE.test(line)) {
			out.push({ keep: line });
			open = null;
			continue;
		}
		if (!line.trim() || /^\s*>/.test(line) || /^\s*<!--/.test(line) || /^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
			out.push({ keep: line });
			open = null;
			continue;
		}
		if (/^\s*\|/.test(line)) {
			if (/^\s*\|[\s|:-]+\|\s*$/.test(line)) out.push({ keep: line });
			else
				out.push({
					cells: line
						.trim()
						.replace(/^\||\|$/g, "")
						.split("|")
						.map((c) => c.trim()),
				});
			open = null;
			continue;
		}
		const heading = HEADING.exec(line);
		if (heading) {
			out.push({ lead: heading[1], text: heading[2] });
			open = null;
			continue;
		}
		const item = LIST.exec(line);
		if (item) {
			open = { lead: item[1], text: item[2] };
			out.push(open);
			continue;
		}
		if (open && (open.lead === "" || /^\s+/.test(line))) {
			open.text += ` ${line.trim()}`;
			continue;
		}
		open = { lead: "", text: line.trim() };
		out.push(open);
	}
	return out;
}

export function join(list) {
	return list
		.map((u) => {
			if ("keep" in u) return u.keep;
			if (u.cells) return `| ${u.cells.join(" | ")} |`;
			return u.lead + u.text;
		})
		.join("\n");
}

// code, link targets and URLs out of the text, as numbered marks the translators leave alone
// code, link targets, URLs, paths, bold marks, dates and versions (2026-11-27, v0.1.3, 0.2.x),
// words with a digit (Q7, PP1, M1, 18rem)
const GUARDED =
	/`[^`]+`|\]\([^)]*\)|<[^>\s]+>|https?:\/\/\S+|\{\d+\}|\*\*|__|\b[\w.-]+(?:\/[\w.*-]+)+|\b[vV]?\d+(?:[-.:/](?:\d+|[xyzXYZ]))+\b|\b[A-Za-z_]*\d\w*\b/g;

export function guard(text) {
	const kept = [];
	const plain = text.replace(GUARDED, (found) => {
		kept.push(found);
		return `{${kept.length - 1}}`;
	});
	return { plain, kept };
}

// the marks put back, and the spacing translators add around markdown repaired; null when a
// mark was lost or doubled: then the unit stays in the source language rather than lose code
export function unguard(text, kept) {
	const seen = kept.map((_, n) => (text.match(new RegExp(`\\{\\s*${n}\\s*\\}`, "g")) || []).length);
	if (seen.some((count) => count !== 1)) return null;
	let out = text.replace(/\{\s*(\d+)\s*\}/g, (all, n) => kept[Number(n)] ?? all);
	out = out.replace(/\s+(\]\()/g, "$1"); // "[text ](target)" -> "[text](target)"
	out = out.replace(/\*\*\s*([^*]+?)\s*\*\*/g, "**$1**"); // "** Met: **" -> "**Met:**"
	out = out.replace(/(^|\s)\*\s+([^*]+?)\s+\*(?=\s|$|[.,;:])/g, "$1*$2*"); // "* note *" -> "*note*"
	out = out.replace(/(\p{L})- (\p{L})/gu, "$1-$2"); // "add- on" -> "add-on"
	return out;
}

// the translators: each takes plain texts and gives them back translated, in order
export function translator(kind, { from, url = process.env.LIBRETRANSLATE_URL, key } = {}) {
	if (kind === "none") return null;
	if (kind === "libretranslate") {
		const base = (url || "http://127.0.0.1:5000").replace(/\/$/, "");
		return async (texts, to) => {
			const response = await fetch(`${base}/translate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					q: texts,
					source: from,
					target: to,
					format: "text",
					api_key: key ?? process.env.LIBRETRANSLATE_API_KEY ?? "",
				}),
			});
			if (!response.ok) throw new Error(`LibreTranslate ${response.status}: ${await response.text()}`);
			const { translatedText } = await response.json();
			return [].concat(translatedText);
		};
	}
	if (kind === "argos")
		return async (texts, to) =>
			texts.map((t) =>
				execFileSync("argos-translate", ["--from-lang", from, "--to-lang", to, t], { encoding: "utf8" }).trim(),
			);
	throw new Error(`unknown translator: ${kind}`);
}

// texts translated in batches; one that loses a mark is tried again sentence by sentence,
// and a sentence that still loses one stays in the source language
async function translateAll(texts, to, translate, batch) {
	const done = new Map();
	const failed = [];
	for (let i = 0; i < texts.length; i += batch) {
		const part = texts.slice(i, i + batch).map(guard);
		const back = await translate(
			part.map((p) => p.plain),
			to,
		);
		part.forEach((p, n) => {
			const text = unguard(back[n], p.kept);
			if (text === null) failed.push(texts[i + n]);
			else done.set(texts[i + n], text);
		});
	}
	for (const text of failed) {
		const sentences = text.split(/(?<=[.!?;:])\s+(?=[\p{Lu}`*[(])/u).map(guard);
		const back = await translate(
			sentences.map((s) => s.plain),
			to,
		);
		done.set(
			text,
			sentences
				.map((s, n) => unguard(back[n], s.kept) ?? s.kept.reduce((all, k, j) => all.replace(`{${j}}`, k), s.plain))
				.join(" "),
		);
	}
	return done;
}

// a page in another language: the memory first, the translator for what it lacks
export async function translatePage(markdown, to, { memory, translate, batch = 40 }) {
	const list = units(markdown);
	const texts = [];
	for (const u of list) {
		if (u.cells) texts.push(...u.cells.filter((c) => /\p{L}/u.test(c)));
		else if ("text" in u && /\p{L}/u.test(u.text)) texts.push(u.text);
	}
	const missing = [...new Set(texts.filter((t) => !(t in memory)))];
	let untranslated = 0;
	if (translate) {
		// bold spans and the text between them translated as pieces of their own: translators
		// mangle the ** around a label, "**Met:** 2026-11-26" came back broken
		const pieces = (text) => text.split(/(\*\*[^*]+\*\*)/).filter((p) => p.trim());
		const all = [...new Set(missing.flatMap(pieces).map((p) => p.replace(/^\*\*(.+)\*\*$/, "$1").trim()))].filter((p) =>
			/\p{L}/u.test(p),
		);
		const done = await translateAll(all, to, translate, batch);
		for (const text of missing) {
			memory[text] = text
				.split(/(\*\*[^*]+\*\*)/)
				.map((p) => {
					const bold = /^\*\*(.+)\*\*$/.exec(p);
					const inner = (bold ? bold[1] : p).trim();
					const lead = (bold ? "" : p.match(/^\s*/)[0]) || "";
					const tail = (bold ? "" : p.match(/\s*$/)[0]) || "";
					const said = done.get(inner) ?? inner;
					return bold ? `**${said}**` : inner ? lead + said + tail : p;
				})
				.join("");
		}
	} else untranslated = missing.length;
	const tr = (t) => (/\p{L}/u.test(t) ? (memory[t] ?? t) : t);
	for (const u of list) {
		if (u.cells) u.cells = u.cells.map(tr);
		else if ("text" in u) u.text = tr(u.text);
	}
	return { markdown: join(list), untranslated, used: texts };
}
