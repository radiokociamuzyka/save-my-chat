// "What the reader saw" as text, for the popup and the clipboard: the build, the
// reader, every selector with how many elements it found, the messages per role,
// the order, the warnings. No text of the conversation (rule 4).
export function reportOf(s, version) {
	const lines = [`save-my-chat ${version}, reader ${s.reader}, on ${s.host}`];
	const roles = Object.entries(s.turns);
	lines.push(`messages: ${roles.length ? roles.map(([role, n]) => `${role} ${n}`).join(", ") : "none"}`);
	if (s.order) lines.push(`order: ${s.order} (U user, A agent)`);
	for (const [part, list] of Object.entries(s.parts)) {
		lines.push(`${part}:`);
		for (const c of list)
			lines.push(`  ${c.found === null ? "invalid" : c.found} - ${c.css}${c.override ? " (override)" : ""}`);
	}
	for (const [where, n] of Object.entries(s.nested || {})) lines.push(`nested: ${n} ${where}`);
	if (s.error) lines.push(`error: ${s.error}`);
	for (const w of s.warnings) lines.push(`warning: ${w}`);
	return lines.join("\n");
}

// the popup's line on the library (PP1): saved before, grown since?
export function sinceLine(before) {
	if (!before) return null;
	const day = new Date(before.savedAt).toLocaleDateString();
	return before.grew
		? { kind: "grew", text: `Saved on ${day} with ${before.saved} messages: ${before.grew} new since.` }
		: { kind: "note", text: `Saved on ${day}; nothing new since.` };
}
