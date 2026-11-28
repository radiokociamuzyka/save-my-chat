// The native messaging host of the debug gate: Firefox starts it when the user connects
// in the Debug tab (the manifest `task debug:install` wrote names it), and ends it when
// the port closes. It listens on the socket (wire.mjs) for the MCP server's requests,
// sends each to the extension with an id of its own, and the answer back to the asker.
// It logs to stderr, which Firefox shows in its browser console.
import { chmodSync, existsSync, unlinkSync } from "node:fs";
import { createServer } from "node:net";
import { frame, frames, lines, socketPath } from "./wire.mjs";

export function host({
	input = process.stdin,
	output = process.stdout,
	path = socketPath(),
	log = console.error,
} = {}) {
	const waiting = new Map(); // our id -> { socket, id }
	let next = 1;

	input.on(
		"data",
		frames((msg) => {
			const asker = waiting.get(msg?.id);
			if (!asker) return;
			waiting.delete(msg.id);
			const { id: _, ...rest } = msg;
			asker.socket.write(`${JSON.stringify({ id: asker.id, ...rest })}\n`);
		}),
	);

	const server = createServer((socket) => {
		socket.setEncoding("utf8");
		socket.on(
			"data",
			lines((msg) => {
				const id = next++;
				waiting.set(id, { socket, id: msg.id });
				output.write(frame({ id, tool: msg.tool, args: msg.args ?? {} }));
			}),
		);
		socket.on("error", () => {});
		socket.on("close", () => {
			for (const [id, w] of waiting) if (w.socket === socket) waiting.delete(id);
		});
	});

	if (process.platform !== "win32" && existsSync(path)) unlinkSync(path); // a host before this one, gone
	server.listen(path, () => {
		if (process.platform !== "win32") chmodSync(path, 0o600);
		log(`save-my-chat debug host: listening on ${path}`);
	});

	const close = () => {
		server.close();
		if (process.platform !== "win32" && existsSync(path)) unlinkSync(path);
	};
	input.on("end", close); // the extension closed the port
	return { server, close };
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const { close } = host();
	process.stdin.on("end", () => process.exit(0));
	process.on("SIGTERM", () => {
		close();
		process.exit(0);
	});
}
