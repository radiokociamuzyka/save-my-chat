// The toolbar button: which reader sees this tab, what it saw there, and saving
// through the background. "What the reader saw" holds no text of the chat: the
// selectors, how many elements each found, the messages per role; "Copy report"
// puts that on the clipboard for an issue (the user's own act, rule 4).
(async () => {
	const state = document.getElementById("state");
	const actions = document.getElementById("actions");
	const result = document.getElementById("result");
	const seenBox = document.getElementById("seen");
	const seenText = document.getElementById("seen-text");
	const copy = document.getElementById("copy");

	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	const reader = tab ? await browser.runtime.sendMessage({ type: "save-my-chat:present", tabId: tab.id }) : null;

	if (!reader) {
		state.textContent = "No supported chat on this page.";
		return;
	}
	state.textContent = `Reader: ${reader.name}`;
	actions.hidden = false;

	const seen = await browser.runtime.sendMessage({ type: "save-my-chat:inspect", tabId: tab.id });
	if (seen) {
		const report = reportOf(seen, browser.runtime.getManifest().version);
		const roles = Object.entries(seen.turns);
		state.textContent += roles.length
			? ` - sees ${roles.map(([role, n]) => `${n} ${role}`).join(", ")}`
			: " - sees no messages";
		seenText.textContent = report;
		seenBox.hidden = false;
		copy.addEventListener("click", async () => {
			await navigator.clipboard.writeText(report);
			copy.textContent = "Copied";
		});
		for (const warning of seen.error ? [seen.error, ...seen.warnings] : seen.warnings) say(warning, "warning");
	}

	actions.addEventListener("click", async (event) => {
		const as = event.target.dataset?.as;
		if (!as) return;
		result.className = "";
		result.textContent = "Saving…";
		try {
			const done = await browser.runtime.sendMessage({ type: "save-my-chat:save", tabId: tab.id, as });
			result.textContent = `Saved "${done.title}", ${done.turns} messages.`;
			for (const warning of done.warnings) say(warning, "warning");
		} catch (error) {
			result.className = "error";
			result.textContent = error.message;
		}
	});

	function say(text, kind) {
		const line = document.createElement("span");
		line.className = kind;
		line.textContent = text;
		result.append(document.createElement("br"), line);
	}

	function reportOf(s, version) {
		const lines = [`save-my-chat ${version}, reader ${s.reader}, on ${s.host}`];
		const roles = Object.entries(s.turns);
		lines.push(`messages: ${roles.length ? roles.map(([role, n]) => `${role} ${n}`).join(", ") : "none"}`);
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
})();
