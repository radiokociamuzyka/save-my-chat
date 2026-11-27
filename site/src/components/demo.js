// Firefox's APIs played by the page (Q13), so the extension's own popup and options
// run on the site with made-up chats. The kit and the default readers are the
// extension's files, run here as they run in the options page; nothing is saved
// anywhere but this page's memory.
import "./kit.js";
import { SOURCES } from "./readers.js";

const day = (d) => `2026-11-${d}T10:00:00.000Z`;
const CHATS = [
	{
		format: "save-my-chat/0",
		source: { reader: "github-copilot", service: "github.com/copilot", url: "https://github.com/copilot/c/demo-1" },
		title: "Why does the build fail on CI?",
		savedAt: day(27),
		turns: [
			{ role: "user", text: "Why does `npm test` fail on CI but not on my machine?" },
			{
				role: "assistant",
				author: "GPT-5",
				text: "The runner has **no display**, and the tests open a browser. Run them headless:\n\n```yaml\n- run: npm test -- --headless\n```\n\n| Where | Display |\n|---|---|\n| your machine | yes |\n| the runner | no |",
			},
			{ role: "user", text: "That was it, thanks." },
		],
	},
	{
		format: "save-my-chat/0",
		source: { reader: "google-ai-mode", service: "google.com/search", url: "https://www.google.com/search?q=turtles&udm=50" },
		title: "How long do turtles live?",
		savedAt: day(25),
		turns: [
			{ role: "user", text: "How long do turtles live?" },
			{ role: "assistant", text: "Many species live **50 to 100 years**; some giant tortoises well over 150." },
		],
	},
];
const keyOf = (c) => `${c.source.reader} ${c.source.url}`;
const entryOf = (c, saves = 1) => ({
	key: keyOf(c),
	title: c.title,
	reader: c.source.reader,
	service: c.source.service,
	url: c.source.url,
	turns: c.turns.length,
	firstSavedAt: c.savedAt,
	savedAt: c.savedAt,
	saves,
});

const data = {
	library: Object.fromEntries(CHATS.map((c, i) => [keyOf(c), entryOf(c, i + 1)])),
	...Object.fromEntries(CHATS.map((c) => [`chat:${keyOf(c)}`, c])),
};
let granted = false;

const SEEN = {
	reader: "github-copilot",
	host: "github.com",
	parts: {
		user: [{ css: ".message-container[class*='user__']", found: 2, override: false }],
		assistant: [{ css: ".message-container[class^='ai__']", found: 1, override: false }],
	},
	turns: { user: 2, assistant: 1 },
	order: "U A U",
	warnings: ["The chat ends with a question: its answer may still be coming."],
};

function answer(msg) {
	const library = Object.values(data.library);
	switch (msg.type) {
		case "save-my-chat:present":
			return { id: "github-copilot", name: "GitHub Copilot" };
		case "save-my-chat:inspect":
			return SEEN;
		case "save-my-chat:since":
			return { savedAt: day(26), saved: 2, now: 3, grew: 1 };
		case "save-my-chat:save":
			return { title: CHATS[0].title, turns: 3, warnings: [] };
		case "save-my-chat:library": {
			const words = (msg.query || "").toLowerCase().split(/\s+/).filter(Boolean);
			return library
				.filter((e) => {
					const text = [e.title, e.service, ...data[`chat:${e.key}`].turns.map((t) => t.text)].join("\n").toLowerCase();
					return words.every((w) => text.includes(w));
				})
				.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
		}
		case "save-my-chat:library-chat":
			return data[`chat:${msg.key}`] ?? null;
		case "save-my-chat:library-forget":
			delete data.library[msg.key];
			return undefined;
		default:
			return undefined; // saving again: nothing to download on a web page
	}
}

globalThis.browser = {
	runtime: {
		getManifest: () => ({ version: "demo" }),
		sendMessage: async (msg) => structuredClone(answer(msg)),
	},
	tabs: { query: async () => [{ id: 1, url: CHATS[0].source.url }] },
	storage: {
		local: {
			get: async (keys) => Object.fromEntries([].concat(keys).map((k) => [k, structuredClone(data[k])])),
			set: async (values) => Object.assign(data, structuredClone(values)),
		},
	},
	permissions: {
		contains: async (p) => (p.permissions ? granted : true),
		request: async () => {
			granted = true;
			return true;
		},
	},
};

// the prototypes' panel copies a reader's file: the extension's own, built in here
const pageFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (path, ...rest) => {
	const name = typeof path === "string" && /^\/readers\/([\w-]+\.js)$/.exec(path)?.[1];
	const source = name && SOURCES[`../../../src/readers/${name}`];
	return source ? new Response(source) : pageFetch(path, ...rest);
};
