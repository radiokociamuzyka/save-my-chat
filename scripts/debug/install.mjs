// `task debug:install`: the debug gate's native host registered for Firefox, once per
// machine (MDN, Native manifests): a manifest naming the host and the one extension
// allowed to start it, and a launcher that runs host.mjs with this Node (Firefox's
// PATH may not hold it). Writes into the user's home only; `-- --remove` undoes it.
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { EXTENSION, NAME } from "./wire.mjs";

const HOST = new URL("host.mjs", import.meta.url).pathname;

export function places(home = homedir(), platform = process.platform) {
	const manifests = {
		linux: join(home, ".mozilla", "native-messaging-hosts"),
		darwin: join(home, "Library", "Application Support", "Mozilla", "NativeMessagingHosts"),
	}[platform];
	if (!manifests)
		throw new Error(`${platform}: register the host by hand (MDN, Native manifests; Windows: the registry)`);
	return {
		manifest: join(manifests, `${NAME}.json`),
		launcher: join(home, ".local", "share", "save-my-chat", "debug-host.sh"),
	};
}

export function manifest(launcher) {
	return {
		name: NAME,
		description: "save-my-chat's debug gate: the agent's MCP server reaching the extension's debug build",
		path: launcher,
		type: "stdio",
		allowed_extensions: [EXTENSION],
	};
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const where = places();
	if (process.argv.includes("--remove")) {
		for (const file of Object.values(where)) if (existsSync(file)) rmSync(file);
		console.log("removed:", Object.values(where).join(", "));
	} else {
		for (const file of Object.values(where)) mkdirSync(join(file, ".."), { recursive: true });
		writeFileSync(where.launcher, `#!/bin/sh\nexec "${process.execPath}" "${HOST}" "$@"\n`);
		chmodSync(where.launcher, 0o755);
		writeFileSync(where.manifest, `${JSON.stringify(manifest(where.launcher), null, "\t")}\n`);
		console.log(`the native host registered:\n  ${where.manifest}\n  ${where.launcher}`);
	}
}
