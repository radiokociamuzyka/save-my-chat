// A conversation of the unified format as one Markdown file.
(() => {
	const SMC = globalThis.SaveMyChat;
	const LABELS = { user: "User", assistant: "Assistant", system: "System", tool: "Tool" };

	function yamlString(value) {
		return JSON.stringify(String(value));
	}

	function toMarkdown(c) {
		const head = [
			"---",
			`format: ${c.format}`,
			`title: ${yamlString(c.title)}`,
			`reader: ${c.source.reader}`,
			`service: ${yamlString(c.source.service || "")}`,
			`url: ${yamlString(c.source.url)}`,
			`saved: ${c.savedAt}`,
			"---",
			"",
			`# ${c.title}`,
			"",
		];
		const body = c.turns.map((t) => {
			const who = t.author ? `${LABELS[t.role]} (${t.author})` : LABELS[t.role];
			return `## ${who}\n\n${t.text}\n`;
		});
		return `${head.join("\n")}\n${body.join("\n")}`;
	}

	// Letters NFKD does not split into a base letter and a mark.
	const PLAIN = { ł: "l", Ł: "L", đ: "d", Đ: "D", ø: "o", Ø: "O", ß: "ss", æ: "ae", Æ: "AE", œ: "oe", Œ: "OE" };

	function slug(text, max = 60) {
		return (
			String(text)
				.replace(/[łŁđĐøØßæÆœŒ]/g, (ch) => PLAIN[ch])
				.normalize("NFKD")
				.replace(/[̀-ͯ]/g, "")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")
				.slice(0, max)
				.replace(/-+$/, "") || "chat"
		);
	}

	// save-my-chat/<reader>/<YYYY-MM-DD>-<title>.<ext>, relative to Downloads.
	function fileName(c, ext) {
		const day = c.savedAt.slice(0, 10);
		return `save-my-chat/${c.source.reader}/${day}-${slug(c.title)}.${ext}`;
	}

	SMC.toMarkdown = toMarkdown;
	SMC.slug = slug;
	SMC.fileName = fileName;
})();
