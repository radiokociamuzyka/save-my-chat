// What the debug gate's pieces say to each other (src/debug/background.js says why).
//   Firefox <-> host.mjs: native messaging, each message JSON after its length in
//   4 bytes, little-endian (MDN, Native messaging).
//   host.mjs <-> server.mjs: a Unix socket (a named pipe on Windows) only the user can
//   open, one JSON message per line.
import { tmpdir } from "node:os";
import { join } from "node:path";

export const NAME = "save_my_chat_debug";
export const EXTENSION = "save-my-chat@radiokociamuzyka.pl";

export const socketPath = (env = process.env, platform = process.platform) =>
	platform === "win32"
		? "\\\\.\\pipe\\save-my-chat-debug"
		: join(env.SMC_DEBUG_SOCKET_DIR || env.XDG_RUNTIME_DIR || tmpdir(), "save-my-chat-debug.sock");

export function frame(message) {
	const body = Buffer.from(JSON.stringify(message), "utf8");
	const head = Buffer.alloc(4);
	head.writeUInt32LE(body.length, 0);
	return Buffer.concat([head, body]);
}

// fed chunks of a native messaging stream, gives each whole message to `on`
export function frames(on) {
	let pending = Buffer.alloc(0);
	return (chunk) => {
		pending = Buffer.concat([pending, chunk]);
		while (pending.length >= 4) {
			const size = pending.readUInt32LE(0);
			if (pending.length < 4 + size) break;
			on(JSON.parse(pending.subarray(4, 4 + size).toString("utf8")));
			pending = pending.subarray(4 + size);
		}
	};
}

// fed chunks of text, gives each whole line, parsed, to `on`
export function lines(on) {
	let pending = "";
	return (chunk) => {
		pending += chunk;
		for (let at = pending.indexOf("\n"); at >= 0; at = pending.indexOf("\n")) {
			const line = pending.slice(0, at).trim();
			pending = pending.slice(at + 1);
			if (line) on(JSON.parse(line));
		}
	};
}
