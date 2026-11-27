// Every dependency of package.json gathered into src/vendor/, unchanged (Q10):
// src/vendor/ is not in git, like node_modules; `npm run build` (task build),
// the checks and `task run` fill it first. Which files of a package are taken,
// and under which name, is package.json "vendor": { package: { from: to } }.
// A dependency without an entry, or an entry without a dependency, is an error,
// so nothing listed in package.json is left out of the packed add-on.
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const at = (path) => new URL(path, ROOT);
const OUT = "src/vendor/";

export function plan(pkg) {
	const deps = Object.keys(pkg.dependencies ?? {});
	const vendor = pkg.vendor ?? {};
	const problems = [
		...deps.filter((d) => !vendor[d]).map((d) => `${d}: a dependency with no "vendor" entry in package.json`),
		...Object.keys(vendor)
			.filter((v) => !deps.includes(v))
			.map((v) => `${v}: a "vendor" entry that is not a dependency`),
	];
	if (problems.length) throw new Error(problems.join("\n"));
	return deps.flatMap((d) =>
		Object.entries(vendor[d]).map(([from, to]) => ({ from: `node_modules/${d}/${from}`, to: OUT + to })),
	);
}

export function gather() {
	const copies = plan(JSON.parse(readFileSync(at("package.json"), "utf8")));
	rmSync(at(OUT), { recursive: true, force: true });
	mkdirSync(at(OUT), { recursive: true });
	for (const { from, to } of copies) copyFileSync(at(from), at(to));
	return copies.length;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(`vendor: ${gather()} files into ${OUT}`);
