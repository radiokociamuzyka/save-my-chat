// The notice of what the extension is built from (almanac: licenses-met): every
// package whose code ends up in dist/extension/, bundled by Vite into the pages or
// copied into src/vendor/, with its version, license and where its source is.
// Written by the build as THIRD-PARTY.md at the root of the extension, so each copy
// of it says what it holds: the notice LGPL-3.0 4(a) asks of ZenFS and its helpers,
// with the texts 4(b) asks for beside it (vendor/zenfs-core.LICENSE, the LGPL;
// licenses/GPL-3.0.txt, the GPL it supplements).
// A license not in LICENSES fails the build: a new one is a question for Sett first.
import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);

// what the extension (MPL-2.0) may be built with, and what each asks of it
export const LICENSES = {
	MIT: "the copyright notice and license kept (src/vendor/, this list)",
	ISC: "the copyright notice and license kept",
	"BSD-2-Clause": "the copyright notice and license kept",
	"BSD-3-Clause": "the copyright notice and license kept; its authors' names not used to promote",
	"Apache-2.0": "the license and any NOTICE kept; changes marked",
	Zlib: "the notice kept; changes marked",
	"LGPL-3.0-or-later":
		"section 4: this notice; the LGPL and GPL with each copy (linked, as ZenFS's COPYING.md allows); " +
		"the library's source at its version; our own code free to rebuild with a changed library " +
		"(the release's source archive, not minified)",
};

const LGPL = [
	"[GNU LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.html)",
	"[GNU GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.html)",
];

// "(MIT AND Zlib)" -> ["MIT", "Zlib"]; an "OR" is not taken apart: it is a question
export const licensesOf = (spdx) =>
	String(spdx)
		.replace(/^\((.*)\)$/, "$1")
		.split(/\s+AND\s+/);

// node_modules/a/node_modules/@b/c/x.js -> @b/c, the innermost package of a path
export function packageOf(id) {
	const all = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/g);
	return all ? all.at(-1).slice("node_modules/".length) : null;
}

// a package's facts, from the package.json of the path a module was found at
// (absolute, or relative to the repository), so nested versions are told apart
export function facts(id) {
	const path = id.replace(/^\0/, "").replace(/\?.*$/, "");
	const name = packageOf(path);
	const dir = `${path.slice(0, path.lastIndexOf(`node_modules/${name}/`))}node_modules/${name}/`;
	const file = dir.startsWith("/") ? dir : new URL(dir, ROOT).pathname;
	const pkg = JSON.parse(readFileSync(`${file}package.json`, "utf8"));
	const repo = (typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url) ?? "";
	const source = repo
		.replace(/^git\+/, "")
		.replace(/^git:\/\//, "https://")
		.replace(/^git@github\.com:/, "https://github.com/")
		.replace(/^github:/, "https://github.com/")
		.replace(/^([\w.-]+\/[\w.-]+)$/, "https://github.com/$1")
		.replace(/\.git$/, "");
	const license = typeof pkg.license === "object" ? pkg.license.type : pkg.license;
	return { name: pkg.name, version: pkg.version, license, source };
}

// the packages, sorted and once each; throws on a license not in LICENSES
export function notice(packages) {
	const seen = new Map();
	for (const p of packages) seen.set(`${p.name}@${p.version}`, p);
	const list = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
	const unknown = list.filter((p) => licensesOf(p.license).some((l) => !LICENSES[l]));
	if (unknown.length)
		throw new Error(
			`licenses not yet looked at (scripts/notice.mjs LICENSES): ${unknown.map((p) => `${p.name}@${p.version} ${p.license}`).join(", ")}`,
		);
	const lines = list.map((p) => {
		const lgpl = licensesOf(p.license).some((l) => l.startsWith("LGPL"));
		const at = p.source ? ` - source: ${p.source}${lgpl ? ` (version ${p.version})` : ""}` : "";
		return `- ${p.name} ${p.version}, ${p.license}${at}`;
	});
	const lgpl = list.filter((p) => licensesOf(p.license).some((l) => l.startsWith("LGPL")));
	return [
		"# Third-party software in save-my-chat",
		"",
		"save-my-chat is under the Mozilla Public License 2.0 (LICENSE in its",
		"source). It is built with the packages below, unchanged; the licenses of",
		"those it depends on directly are in `vendor/`, and each package's at its",
		"source.",
		"",
		...(lgpl.length
			? [
					`${lgpl.map((p) => p.name).join(", ")} ${lgpl.length === 1 ? "is" : "are"} used in it and covered by the`,
					`${LGPL[0]} (\`vendor/zenfs-core.LICENSE\`), which supplements the`,
					`${LGPL[1]} (\`licenses/GPL-3.0.txt\`); ZenFS also by its COPYING.md`,
					"(`vendor/zenfs-core.COPYING`). Their source at the versions built in is",
					"linked below; the source of save-my-chat, to rebuild it with a changed",
					"version of them, is attached to each release:",
					"https://github.com/radiokociamuzyka/save-my-chat/releases",
					"",
				]
			: []),
		...lines,
		"",
	].join("\n");
}
