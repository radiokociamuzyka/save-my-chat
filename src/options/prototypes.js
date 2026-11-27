// Prototypes (phase 3): the user's own copy of a default reader, kept in
// storage.local ("prototypes": { <id>: { id, name, from, matches, code, enabled } })
// and run by the background through the userScripts API in place of the default
// it was copied from (rule 5: run as a user script, never evaluated by the
// extension). What the options' panel checks, and the file they travel in.
export const FORMAT = "save-my-chat/prototypes/0";

// the defaults call it through a name of their own (const SMC = globalThis.SaveMyChat)
export const registers = (code) => /\.reader\s*\(/.test(code);

export const patternsOf = (text) =>
	text
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);

// the origin a match pattern needs among the host permissions, or null
export function originOf(pattern) {
	const m = /^(\*|https?):\/\/([^/]+)\//.exec(pattern);
	return m ? `${m[1]}://${m[2]}/*` : null;
}

// a prototype as a file may hold it: nothing else is kept, and it comes turned off
export function imported(p) {
	const ok =
		p &&
		typeof p.id === "string" &&
		/^[\w-]+$/.test(p.id) &&
		typeof p.name === "string" &&
		typeof p.code === "string" &&
		Array.isArray(p.matches) &&
		p.matches.every((m) => typeof m === "string");
	if (!ok) return null;
	return {
		id: p.id,
		name: p.name,
		from: typeof p.from === "string" ? p.from : p.id,
		matches: p.matches,
		code: p.code,
		enabled: false, // an imported prototype runs only once the user turns it on
	};
}

export const fileOf = (all) => `${JSON.stringify({ format: FORMAT, prototypes: all }, null, "\t")}\n`;
