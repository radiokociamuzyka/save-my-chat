// `task run`: Firefox with the built extension (Q12), rebuilt on every change of src/ -
// Vite watches the pages and the files it copies, web-ext reloads the extension when
// dist/extension/ changes. Ctrl+C, or Firefox closed, stops both. Expects one build done
// (npm start does it). The debug build (SMC_DEBUG=1, the debug gate) unless SMC_DEBUG=0.
//
// RR9: on Ubuntu, Firefox is a snap, and a snap has a /tmp of its own: the temporary
// profile web-ext made there did not exist for Firefox ("profile does not exist"). So
// Firefox runs on a profile kept in the project, dist/firefox-profile/, which also keeps
// the logins of the webapps between runs (what the debug gate looks at). `-p <profile>`
// passed on (task run -- -p ...) is used instead.
// And Vite and web-ext run as node processes of their own group, not through npx: killing
// npx left `vite build --watch` running, whose lock then stopped the next `task run`.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const bin = (path) => `${root}node_modules/${path}`;
export const PROFILE = `${root}dist/firefox-profile`;

// web-ext's arguments: the kept profile, unless one was asked for
export function webExtArgs(extra) {
	if (extra.some((a) => a === "-p" || a.startsWith("--firefox-profile"))) return ["run", ...extra];
	return ["run", "--firefox-profile", PROFILE, "--profile-create-if-missing", "--keep-profile-changes", ...extra];
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const extra = process.argv.slice(2);
	const env = { ...process.env, SMC_DEBUG: process.env.SMC_DEBUG ?? "1" };
	mkdirSync(PROFILE, { recursive: true });
	// each in a process group of its own, so stopping one stops all it started
	const start = (file, args, options = {}) =>
		spawn(process.execPath, [bin(file), ...args], { stdio: "inherit", detached: true, ...options });
	const vite = start("vite/bin/vite.js", ["build", "--watch"], { env });
	const firefox = start("web-ext/bin/web-ext.js", webExtArgs(extra));
	const kill = (child) => {
		try {
			process.kill(-child.pid, "SIGTERM");
		} catch {
			// gone already
		}
	};
	const stop = (code = 0) => {
		kill(vite);
		kill(firefox);
		process.exit(code);
	};
	firefox.on("exit", (code) => stop(code ?? 0));
	vite.on("exit", (code) => stop(code ?? 0));
	process.on("SIGINT", () => stop(0));
	process.on("SIGTERM", () => stop(0));
	process.on("SIGHUP", () => stop(0));
}
