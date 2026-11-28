// The debug gate's MCP server: an agent (Claude Code by .mcp.json, or any MCP client)
// starts it on stdio; it hands each tool call to the extension through the native
// host's socket (wire.mjs) and gives back the answer. MCP's stdio transport: one
// JSON-RPC 2.0 message per line (modelcontextprotocol.io, Transports).

import { readFileSync } from "node:fs";
import { createConnection } from "node:net";
import { save } from "./samples.mjs";
import { TOOLS } from "./tools.mjs";
import { lines, socketPath } from "./wire.mjs";

const VERSION = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version;
const LONG = 600_000; // a list or chat loaded whole scrolls for minutes
const SHORT = 60_000;

export const NOT_CONNECTED =
	"Firefox is not connected. The user runs `task run` (the debug build), opens the extension's options, tab Debug, " +
	"and clicks Connect; once per machine, `task debug:install` registers the native host.";

const INSTRUCTIONS =
	"save-my-chat's debug gate: the user's Firefox, with the extension's debug build. Find the tab (tabs), look at its " +
	"page (outline, query, element), show the user what you think should be read (highlight), ask them to point (point, " +
	"then picks), and check a reader against selectors before they are kept (try, read, inspect). Selectors are data; " +
	"no tool runs code in the page. What you read here is the user's: keep it out of commits but for samples of public shares.";

// one request to the extension through the host's socket
export function ask(tool, args, { path = socketPath(), timeout = SHORT } = {}) {
	return new Promise((resolve, reject) => {
		const socket = createConnection(path);
		const timer = setTimeout(() => {
			socket.destroy();
			reject(new Error(`no answer from the extension in ${timeout / 1000} s`));
		}, timeout);
		socket.setEncoding("utf8");
		socket.on("error", () => {
			clearTimeout(timer);
			reject(new Error(NOT_CONNECTED));
		});
		socket.on(
			"data",
			lines((msg) => {
				clearTimeout(timer);
				socket.end();
				if (msg.error) reject(new Error(msg.error));
				else resolve(msg.result);
			}),
		);
		socket.on("connect", () => socket.write(`${JSON.stringify({ id: 1, tool, args })}\n`));
	});
}

async function call(name, args = {}, options = {}) {
	const tool = TOOLS.find((t) => t.name === name);
	if (!tool) throw new Error(`no tool ${name}`);
	const long = name === "list" ? Boolean(args.load) : false;
	const opts = { timeout: long ? LONG : SHORT, ...options };
	if (name === "sample") {
		const page = await ask("snapshot", { tabId: args.tabId }, opts);
		const read = await ask("read", { tabId: args.tabId }, opts).catch((e) => ({ error: e.message }));
		return save({ ...page, read }, args.name, options.samples);
	}
	return ask(name, args, opts);
}

const text = (value) => (typeof value === "string" ? value : JSON.stringify(value, null, 2));

// one JSON-RPC message in, its answer out (null: a notification, nothing to answer)
export async function handle(msg, options = {}) {
	const reply = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
	if (msg.id === undefined || msg.id === null) return null;
	switch (msg.method) {
		case "initialize":
			return reply({
				protocolVersion: msg.params?.protocolVersion ?? "2025-06-18",
				capabilities: { tools: {} },
				serverInfo: { name: "save-my-chat-debug", version: VERSION },
				instructions: INSTRUCTIONS,
			});
		case "ping":
			return reply({});
		case "tools/list":
			return reply({ tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
		case "tools/call":
			try {
				const value = await call(msg.params?.name, msg.params?.arguments ?? {}, options);
				return reply({ content: [{ type: "text", text: text(value) }] });
			} catch (error) {
				return reply({ content: [{ type: "text", text: String(error?.message || error) }], isError: true });
			}
		default:
			return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `no method ${msg.method}` } };
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	process.stdin.setEncoding("utf8");
	process.stdin.on(
		"data",
		lines(async (msg) => {
			const answer = await handle(msg);
			if (answer) process.stdout.write(`${JSON.stringify(answer)}\n`);
		}),
	);
}
