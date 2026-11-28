// `web-ext lint` (AMO's validator, warnings as errors) with its known false positives
// named here, one by one. Anything else it says - an error, a warning, a known one gone
// or seen more often than listed - fails, as web-ext's own warningsAsErrors would.
//   node scripts/lint.mjs        (npm run lint:ext, part of verify): builds the release into dist/verify/ first
import { spawnSync } from "node:child_process";

// Each: what web-ext says, matched exactly, and why it is wrong. Remove an entry the day
// the linter stops saying it: this script fails until then.
export const KNOWN = [
	{
		code: "UNSUPPORTED_API",
		file: "background/main.js",
		message: '"userScripts.register" has been removed in Manifest Version 3 (`manifest_version` property)',
		why:
			"addons-linter 10.14-10.16 holds two userScripts.register in its schema, the MV2 one" +
			" (max_manifest_version 2) and the MV3 one, and checks the first; Firefox has the MV3" +
			" API (MDN). Almanac: linter-userscripts-register; upstream: mozilla/addons-linter#6282.",
	},
	{
		code: "UNSAFE_VAR_ASSIGNMENT",
		file: "chunks/vue.js",
		message: "Unsafe assignment to innerHTML",
		why:
			"Vue's runtime (runtime-dom insertStaticContent), in the chunk Vite shares between the pages (Q12): it is given only" +
			" HTML that Vue's compiler wrote at build time from our own templates; no v-html in src/.",
	},
];

// the linter's findings split into the known ones and the rest
export function sort(found, known = KNOWN) {
	const left = known.map((k) => ({ ...k, seen: 0 }));
	const failing = [];
	for (const f of found) {
		const k = left.find((k) => k.code === f.code && k.file === f.file && k.message === f.message);
		if (k && k.seen === 0) k.seen = 1;
		else failing.push(f);
	}
	const gone = left.filter((k) => k.seen === 0);
	return { failing, gone, excused: left.filter((k) => k.seen) };
}

// The release's build, made into dist/verify/ for the linter (vite.config.mjs SMC_OUT):
// dist/extension/ may be task run's debug build, rebuilt as it runs (RR9).
export const VERIFY = "dist/verify";

if (import.meta.url === `file://${process.argv[1]}`) {
	const root = new URL("../", import.meta.url).pathname;
	const build = spawnSync(process.execPath, [`${root}node_modules/vite/bin/vite.js`, "build", "--logLevel", "warn"], {
		stdio: "inherit",
		env: { ...process.env, SMC_OUT: VERIFY, SMC_DEBUG: "0" },
	});
	if (build.status !== 0) process.exit(build.status ?? 1);
	const run = spawnSync("npx", ["web-ext", "lint", "--output", "json", "--source-dir", VERIFY], { encoding: "utf8" });
	let report;
	try {
		report = JSON.parse(run.stdout);
	} catch {
		process.stderr.write(run.stdout + run.stderr);
		process.exit(1);
	}
	const { failing, gone, excused } = sort([...report.errors, ...report.warnings]);
	for (const f of failing) console.log(`${f._type} ${f.code} ${f.file ?? ""}:${f.line ?? ""} ${f.message}`);
	for (const k of excused) console.log(`known, not counted: ${k.code} ${k.file} (${k.why})`);
	for (const k of gone) console.log(`gone from the linter: ${k.code} ${k.file} - remove it from scripts/lint.mjs`);
	console.log(
		`web-ext lint: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${excused.length} known`,
	);
	process.exit(failing.length || gone.length ? 1 : 0);
}
