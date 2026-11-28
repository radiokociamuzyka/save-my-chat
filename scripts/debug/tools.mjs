// The debug gate's tools as the agent sees them (MCP tools/list). Each is run by the
// extension (src/debug/background.js TOOLS, the same names) but `sample`, which the
// server does from the extension's snapshot. They take data - tab ids, selectors,
// labels - never code (rule 5).
const tab = { tabId: { type: "number", description: "a tab's id, from the tabs tool" } };
const selector = { selector: { type: "string", description: "a CSS selector" } };
const object = (properties, required = []) => ({ type: "object", properties, required });

export const TOOLS = [
	{
		name: "tabs",
		description:
			"The tabs open in the user's Firefox: id, address, title, and the save-my-chat reader whose pages it is on.",
		inputSchema: object({}),
	},
	{
		name: "open",
		description: "Opens an address in a new tab of the user's Firefox, in front, and gives its tabId.",
		inputSchema: object({ url: { type: "string" } }, ["url"]),
	},
	{
		name: "outline",
		description:
			"The page as an indented outline: one line per element (tag#id.class[data-*]), its child count and the start of its own text; siblings alike folded into one line (×N). Start here on a new page, then narrow with a selector.",
		inputSchema: object(
			{
				...tab,
				selector: { type: "string", description: "the element to start from (default: body)" },
				depth: { type: "number", description: "levels below it (default 4)" },
				limit: { type: "number", description: "most lines (default 300)" },
			},
			["tabId"],
		),
	},
	{
		name: "query",
		description:
			"What a CSS selector finds on the page: how many, and for the first ones their path, attributes, classes and text.",
		inputSchema: object({ ...tab, ...selector, limit: { type: "number" } }, ["tabId", "selector"]),
	},
	{
		name: "element",
		description:
			"One element a selector finds (index, default 0): its outer HTML (cut at `html` characters, default 4000), text, and the selectors that would find it, each with how many elements it finds.",
		inputSchema: object({ ...tab, ...selector, index: { type: "number" }, html: { type: "number" } }, [
			"tabId",
			"selector",
		]),
	},
	{
		name: "highlight",
		description:
			"Draws marks over the page for the user to see what you think should be read: each mark a selector, a label (user, assistant, title, list or your own) and a colour; they stay, following the page, until cleared. Gives how many elements each found.",
		inputSchema: object(
			{
				...tab,
				marks: {
					type: "array",
					items: object({ selector: { type: "string" }, label: { type: "string" }, color: { type: "string" } }, [
						"selector",
					]),
				},
			},
			["tabId", "marks"],
		),
	},
	{ name: "clear", description: "Takes the marks off the page.", inputSchema: object({ ...tab }, ["tabId"]) },
	{
		name: "point",
		description:
			"Brings the tab to the front and lets the user point: they click elements and label each (user, assistant, title, list, other, with a note); read what they picked with the picks tool. on: false stops it.",
		inputSchema: object({ ...tab, on: { type: "boolean" } }, ["tabId"]),
	},
	{
		name: "picks",
		description:
			"What the user pointed at, oldest first: the label they gave, their note, the element's path, attributes, text, and suggested selectors with their counts. clear: true empties the list after reading it.",
		inputSchema: object({ clear: { type: "boolean" } }),
	},
	{
		name: "read",
		description: "What the tab's save-my-chat reader reads now: the conversation in the unified format, its warnings.",
		inputSchema: object({ ...tab }, ["tabId"]),
	},
	{
		name: "inspect",
		description:
			"What the tab's reader sees, without the text: each selector candidate and how many it finds, the messages per role.",
		inputSchema: object({ ...tab }, ["tabId"]),
	},
	{
		name: "try",
		description:
			"What the tab's reader would read with these selectors put in front of its own, per part (as the Readers tab's overrides do), without keeping them: { read, seen }.",
		inputSchema: object(
			{
				...tab,
				selectors: {
					type: "object",
					description: 'per part, a list of CSS selectors, e.g. { "user": ["..."], "assistant": ["..."] }',
					additionalProperties: { type: "array", items: { type: "string" } },
				},
			},
			["tabId", "selectors"],
		),
	},
	{
		name: "list",
		description:
			"The chats the tab's page lists (as the popup's Gather does); load: true scrolls the list to its end first, which takes a while.",
		inputSchema: object({ ...tab, load: { type: "boolean" } }, ["tabId"]),
	},
	{
		name: "sample",
		description:
			"Saves the tab's page (scripts and styles left out, e-mail addresses masked) and what the reader reads into resources/samples/DN_<host>/<name>/ - only for an address listed in resources/samples/.map.json, the public shares the user chose. Look the files over before they are committed.",
		inputSchema: object({ ...tab, name: { type: "string", description: "the sample's folder name" } }, [
			"tabId",
			"name",
		]),
		server: true,
	},
];
