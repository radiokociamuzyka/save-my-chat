// resources/data/chats.yaml written into the extension (Q10): the readers' list
// (src/core/readers.js) and the manifest's host permissions: those of the default
// readers asked at install (host_permissions), those of the optional ones only when
// the user turns one on (optional_host_permissions, with the gist's GitHub API).
// Both outputs are committed, so Firefox and AMO read plain files as written;
// tests/chats.test.js fails when they are not what this script writes.
//   node scripts/chats.mjs          write them (part of `npm run build`)
//   node scripts/chats.mjs --check  only say whether they are current
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const ROOT = new URL("../", import.meta.url);
const at = (path) => new URL(path, ROOT);
const READERS = "src/core/readers.js";
const MANIFEST = "src/manifest.json";

const q = (s) => JSON.stringify(s);
const list = (items) => `[${items.map(q).join(", ")}]`;
// a host asked for by something else than a reader: the gist (Q9)
const GIST = "https://api.github.com/*";
const SHIPPED = ["default", "optional"];
const originsOf = (c) => c.domains.map((d) => `https://${d}/*`);

export function readersJs(chats) {
	const entries = chats
		.filter((c) => SHIPPED.includes(c.status))
		.map((c) => {
			const optional = c.status === "optional" ? `\t\t\toptional: true,\n\t\t\torigins: ${list(originsOf(c))},\n` : "";
			return `\t\t{\n\t\t\tid: ${q(c.id)},\n\t\t\tname: ${q(c.name)},\n\t\t\tmatches: ${list(c.matches)},\n\t\t\tchats: ${list(c.chats)},\n${optional}\t\t\tfile: ${q(c.reader)},\n\t\t},\n`;
		})
		.join("");
	return `// Written by scripts/chats.mjs from resources/data/chats.yaml (Q10): edit the YAML,
// then \`npm run chats\` (or \`task build\`). The default readers shipped with the
// extension; the background registers each enabled one as a content script,
// core/kit.js first, then its file. A default's hosts are the manifest's host_permissions;
// an optional one's (origins) are asked when the user turns it on, in the Readers tab.
// chats: the addresses of one conversation, how the links a page lists are found.
(() => {
\tglobalThis.SaveMyChat.defaults = [
${entries}\t];
})();
`;
}

export function hosts(chats, status = "default") {
	return [...new Set(chats.filter((c) => c.status === status).flatMap(originsOf))];
}

// a list of the manifest as Biome writes it: on one line while it fits in 120
// columns (a tab counted as 2), else one item a line
function manifestList(key, items) {
	const line = `"${key}": ${list(items)},`;
	if (line.length + 2 <= 120) return list(items);
	return `[\n${items.map((i) => `\t\t${q(i)}`).join(",\n")}\n\t]`;
}

// only the two host lists change, the manifest's formatting stays
export function manifestWith(text, required, optional = [GIST]) {
	const out = text
		.replace(/("host_permissions":\s*)\[[^\]]*\]/, (_, key) => key + manifestList("host_permissions", required))
		.replace(
			/("optional_host_permissions":\s*)\[[^\]]*\]/,
			(_, key) => key + manifestList("optional_host_permissions", optional),
		);
	JSON.parse(out);
	return out;
}

export function outputs() {
	const { chats } = parse(readFileSync(at("resources/data/chats.yaml"), "utf8"));
	return {
		[READERS]: readersJs(chats),
		[MANIFEST]: manifestWith(readFileSync(at(MANIFEST), "utf8"), hosts(chats), [GIST, ...hosts(chats, "optional")]),
	};
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const check = process.argv.includes("--check");
	const stale = [];
	for (const [path, text] of Object.entries(outputs())) {
		if (readFileSync(at(path), "utf8") === text) continue;
		stale.push(path);
		if (!check) writeFileSync(at(path), text);
	}
	if (check && stale.length) {
		console.error(`chats: not what chats.yaml says: ${stale.join(", ")} (npm run chats)`);
		process.exit(1);
	}
	console.log(stale.length && !check ? `chats: wrote ${stale.join(", ")}` : "chats: current");
}
