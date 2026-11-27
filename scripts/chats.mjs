// resources/data/chats.yaml written into the extension (Q10): the default
// readers' list (src/core/readers.js) and the manifest's host_permissions.
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

export function readersJs(chats) {
	const entries = chats
		.filter((c) => c.status === "default")
		.map(
			(c) =>
				`\t\t{\n\t\t\tid: ${q(c.id)},\n\t\t\tname: ${q(c.name)},\n\t\t\tmatches: [${c.matches.map(q).join(", ")}],\n\t\t\tchats: [${c.chats.map(q).join(", ")}],\n\t\t\tfile: ${q(c.reader)},\n\t\t},\n`,
		)
		.join("");
	return `// Written by scripts/chats.mjs from resources/data/chats.yaml (Q10): edit the YAML,
// then \`npm run chats\` (or \`task build\`). The default readers shipped with the
// extension; the background registers each enabled one as a content script,
// core/kit.js first, then its file. Their hosts are the manifest's host_permissions.
// chats: the addresses of one conversation, how the links a page lists are found.
(() => {
\tglobalThis.SaveMyChat.defaults = [
${entries}\t];
})();
`;
}

export function hosts(chats) {
	return [
		...new Set(chats.filter((c) => c.status === "default").flatMap((c) => c.domains.map((d) => `https://${d}/*`))),
	];
}

// only the host_permissions line changes, the manifest's formatting stays
export function manifestWith(text, list) {
	const out = text.replace(/("host_permissions":\s*)\[[^\]]*\]/, `$1[${list.map(q).join(", ")}]`);
	JSON.parse(out);
	return out;
}

export function outputs() {
	const { chats } = parse(readFileSync(at("resources/data/chats.yaml"), "utf8"));
	return {
		[READERS]: readersJs(chats),
		[MANIFEST]: manifestWith(readFileSync(at(MANIFEST), "utf8"), hosts(chats)),
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
