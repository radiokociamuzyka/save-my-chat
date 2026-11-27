// One version for the whole repository: the `version` of package.json (Q7: every commit bumps Z).
//   node scripts/version.mjs sync           every other version field written from it
//   node scripts/version.mjs bump minor     X.Y.Z bumped (major, minor or patch), then sync - used by the workflows
//   node scripts/version.mjs bump-commit    on a branch of .github/bos.json versioning.commits: the patch bumped, then sync
//   node scripts/version.mjs merge O A B    git merge driver: the higher version of A and B, then a three-way merge
//   node scripts/version.mjs show           the version, for scripts
// Ported from P_JOL_ROLL's src/devtools/version.ts (as in the BOS core: bos flow bump-commit, merge-version).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const at = (path) => new URL(path, ROOT);
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

// Files that carry a copy of the version: what stands before it, the version between quotes, what after.
const COPIES = [["src/manifest.json", /("version":\s*")[^"]+(")/]];

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function parse(version) {
	const found = SEMVER.exec(version);
	if (!found) throw new Error(`not a version X.Y.Z: ${version}`);
	return found.slice(1).map(Number);
}

export function higher(a, b) {
	const [x, y] = [parse(a), parse(b)];
	for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? a : b;
	return a;
}

export function next(version, kind) {
	const [x, y, z] = parse(version);
	if (kind === "major") return `${x + 1}.0.0`;
	if (kind === "minor") return `${x}.${y + 1}.0`;
	return `${x}.${y}.${z + 1}`;
}

// package.json, src/manifest.json or package-lock.json (its root package too).
// Only the version's text is replaced: the merge driver must not reformat a
// file (src/manifest.json is indented with tabs, its short arrays on one line).
const VERSION = /("version":\s*")[^"]*(")/;
export function withVersion(text, version) {
	const json = JSON.parse(text);
	let out = json.version === undefined ? text : text.replace(VERSION, `$1${version}$2`);
	const root = out.indexOf('"": {');
	if (json.packages?.[""] && root >= 0) out = out.slice(0, root) + out.slice(root).replace(VERSION, `$1${version}$2`);
	const back = JSON.parse(out);
	if (json.version !== undefined && back.version !== version) throw new Error("the version was not where expected");
	return out;
}

function setVersion(path, version) {
	writeFileSync(path, withVersion(readFileSync(path, "utf8"), version));
}

function sync() {
	const { version } = readJson(at("package.json"));
	parse(version);
	setVersion(at("package-lock.json"), version);
	const files = ["package.json", "package-lock.json"];
	for (const [file, where] of COPIES) {
		const text = readFileSync(at(file), "utf8");
		if (!where.test(text)) throw new Error(`no version found in ${file}`);
		writeFileSync(at(file), text.replace(where, `$1${version}$2`));
		files.push(file);
	}
	return { version, files };
}

function bump(kind) {
	const pkg = readJson(at("package.json"));
	pkg.version = next(pkg.version, kind);
	writeJson(at("package.json"), pkg);
	return sync();
}

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

// "dev/*" -> every branch that starts with "dev/"
export const matches = (branch, pattern) =>
	pattern.endsWith("*") ? branch.startsWith(pattern.slice(0, -1)) : branch === pattern;

function bumpCommit() {
	const commits = readJson(at(".github/bos.json")).versioning?.commits ?? {};
	const branch = git("rev-parse", "--abbrev-ref", "HEAD");
	if (!(commits.branches ?? []).some((pattern) => matches(branch, pattern))) {
		console.log(`version: ${branch} does not bump`);
		return;
	}
	const kind = commits.bump ?? "patch";
	const { version, files } = bump(kind);
	git("add", "--", ...files);
	console.log(`version: ${version} (${kind} of ${branch})`);
}

// git calls it with the ancestor, ours (the result goes here) and theirs
function merge(base, ours, theirs) {
	const version = higher(readJson(ours).version ?? "0.0.0", readJson(theirs).version ?? "0.0.0");
	for (const path of [base, ours, theirs]) {
		try {
			setVersion(path, version);
		} catch {
			// an ancestor that is not JSON (or empty): the three-way merge decides
		}
	}
	try {
		execFileSync("git", ["merge-file", ours, base, theirs]);
	} catch {
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const [command, ...args] = process.argv.slice(2);
	if (command === "sync") {
		const { version, files } = sync();
		console.log(`version: ${version} in ${files.join(", ")}`);
	} else if (command === "bump-commit") bumpCommit();
	else if (command === "bump" && ["major", "minor", "patch"].includes(args[0])) {
		const { version, files } = bump(args[0]);
		console.log(`version: ${version} in ${files.join(", ")}`);
	} else if (command === "merge" && args.length === 3) merge(...args);
	else if (command === "show") console.log(readJson(at("package.json")).version);
	else {
		console.error(
			"usage: version.mjs sync | show | bump major|minor|patch | bump-commit | merge <base> <ours> <theirs>",
		);
		process.exit(2);
	}
}
