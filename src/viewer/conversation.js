// A saved file read back into a conversation of the unified format (save-my-chat/0):
// the JSON as it is, or the Markdown of core/markdown.js - its front matter, then a
// `## User` / `## Assistant (author)` section per turn. Shared by the extension's
// viewer and the public site's (Q13), so it needs nothing of the extension.
export const FORMAT = "save-my-chat/0";
const ROLES = { User: "user", Assistant: "assistant", System: "system", Tool: "tool" };
const SECTION = /^## (User|Assistant|System|Tool)(?: \((.*)\))?$/;

export function fromJson(text) {
	const c = JSON.parse(text);
	check(c);
	return c;
}

// the front matter's values as core/markdown.js writes them: JSON strings, or plain words
function value(raw) {
	if (raw.startsWith('"')) return JSON.parse(raw);
	return raw;
}

export function fromMarkdown(text) {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	if (lines[0] !== "---") throw new Error("Not a file saved by save-my-chat: no front matter.");
	const end = lines.indexOf("---", 1);
	if (end < 0) throw new Error("Not a file saved by save-my-chat: the front matter does not end.");
	const head = {};
	for (const line of lines.slice(1, end)) {
		const m = /^(\w+): (.*)$/.exec(line);
		if (m) head[m[1]] = value(m[2]);
	}
	const turns = [];
	let turn = null;
	// a section starts after a blank line (or the title), as the file is written
	for (let i = end + 1; i < lines.length; i++) {
		const m = SECTION.exec(lines[i]);
		if (m && (lines[i - 1] === "" || !turn)) {
			turn = { role: ROLES[m[1]], text: [] };
			if (m[2]) turn.author = m[2];
			turns.push(turn);
		} else if (turn) turn.text.push(lines[i]);
	}
	const c = {
		format: head.format,
		source: { reader: head.reader, service: head.service, url: head.url },
		title: head.title,
		savedAt: head.saved,
		turns: turns.map(({ text, ...t }) => ({ ...t, text: text.join("\n").trim() })),
	};
	check(c);
	return c;
}

export function fromFile(name, text) {
	return /\.json$/i.test(name) ? fromJson(text) : fromMarkdown(text);
}

function check(c) {
	if (c?.format !== FORMAT) throw new Error(`Not a file of the unified format (${FORMAT}).`);
	if (!Array.isArray(c.turns) || !c.turns.every((t) => typeof t.text === "string" && t.role in ROLE_NAMES))
		throw new Error("Its messages are not as the format writes them.");
}
const ROLE_NAMES = Object.fromEntries(Object.entries(ROLES).map(([name, role]) => [role, name]));
export const roleName = (role) => ROLE_NAMES[role] ?? role;
