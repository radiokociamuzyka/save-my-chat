// The kit every context shares: the unified format, DOM to markdown, and the
// registration of readers. A classic script (content scripts cannot be ES
// modules), so it lives on globalThis.SaveMyChat and is safe to load twice.
(() => {
	const root = globalThis;
	if (root.SaveMyChat?.kit) return;

	const FORMAT = "save-my-chat/0";
	const ROLES = ["user", "assistant", "system", "tool"];

	// ---- DOM to markdown -------------------------------------------------
	// Turndown (src/vendor/, loaded before the kit in pages) with its GFM
	// plugin for tables, strikethrough and task lists, as in Sett's proof of
	// work. The background never converts, so it does not load them.

	let service = null;

	function turndown() {
		if (service) return service;
		if (!root.TurndownService) throw new Error("turndown is not loaded before the kit");
		service = new root.TurndownService({
			headingStyle: "atx",
			hr: "---",
			bulletListMarker: "-",
			codeBlockStyle: "fenced",
			emDelimiter: "*",
		});
		if (root.turndownPluginGfm) service.use(root.turndownPluginGfm.gfm);
		service.remove(["script", "style", "noscript", "template", "button", "svg"]);
		// Rules added last win over turndown's and the plugin's own.
		// A fence longer than any run of backticks inside, so code that
		// itself contains ``` does not close its block early.
		service.addRule("fence", {
			filter: (node) => node.nodeName === "PRE",
			replacement: (_content, node) => {
				const code = node.querySelector("code") || node;
				const lang = (code.getAttribute("class") || "").match(/language-([\w+#-]+)/)?.[1] || "";
				const text = code.textContent.replace(/\n$/, "");
				const longest = Math.max(0, ...(text.match(/`+/g) || []).map((run) => run.length));
				const fence = "`".repeat(Math.max(3, longest + 1));
				return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`;
			},
		});
		// A pipe inside a cell escaped, or it splits the cell in two.
		service.addRule("cell", {
			filter: ["th", "td"],
			replacement: (content, node) => {
				const first = node.parentNode.firstElementChild === node;
				const text = content
					.replace(/\n+/g, " ")
					.replace(/(^|[^\\])\|/g, "$1\\|")
					.trim();
				return `${first ? "| " : " "}${text} |`;
			},
		});
		// Parts the webapp hides from people (icons, screen-reader duplicates).
		service.addRule("hidden", {
			filter: (node) => node.hidden || node.getAttribute?.("aria-hidden") === "true",
			replacement: () => "",
		});
		return service;
	}

	// Links and images made absolute on a copy, so the page stays untouched.
	function absolute(element) {
		const copy = element.cloneNode(true);
		const base = element.ownerDocument.baseURI;
		for (const a of copy.querySelectorAll("a[href]")) {
			const href = a.getAttribute("href");
			if (href.startsWith("javascript:")) a.removeAttribute("href");
			else a.setAttribute("href", new URL(href, base).href);
		}
		for (const img of copy.querySelectorAll("img[src]"))
			img.setAttribute("src", new URL(img.getAttribute("src"), base).href);
		return copy;
	}

	function markdown(element) {
		return turndown()
			.turndown(absolute(element))
			.replace(/\n{3,}/g, "\n\n")
			.trim();
	}

	// ---- the unified format -----------------------------------------------

	function turn(role, element, extra = {}) {
		if (!ROLES.includes(role)) throw new Error(`unknown role: ${role}`);
		const text = typeof element === "string" ? element.trim() : markdown(element);
		return { role, text, ...extra };
	}

	function conversation(reader, read, url, now = new Date()) {
		const turns = (read.turns || []).filter((t) => t?.text);
		return {
			format: FORMAT,
			source: { reader: reader.id, service: reader.service, url: String(url) },
			title: (read.title || "").trim() || "Untitled conversation",
			savedAt: now.toISOString(),
			turns,
		};
	}

	function validate(c) {
		const problems = [];
		if (c?.format !== FORMAT) problems.push(`format is not ${FORMAT}`);
		if (!c?.source?.reader) problems.push("source.reader is missing");
		if (!Array.isArray(c?.turns)) problems.push("turns is not a list");
		else
			c.turns.forEach((t, i) => {
				if (!ROLES.includes(t.role)) problems.push(`turns[${i}].role is ${t.role}`);
				if (typeof t.text !== "string") problems.push(`turns[${i}].text is not text`);
			});
		return problems;
	}

	// ---- readers ------------------------------------------------------------

	const readers = new Map();

	function reader(def) {
		for (const key of ["id", "name", "detect", "read"]) if (!def[key]) throw new Error(`reader without ${key}`);
		readers.set(def.id, def);
		return def;
	}

	// What a content script answers when the popup asks it to read the page.
	function readPage(doc = root.document, url = root.location?.href) {
		for (const r of readers.values()) {
			if (!r.detect(doc, url)) continue;
			return conversation(r, r.read(doc, url), url);
		}
		return null;
	}

	function present(doc = root.document, url = root.location?.href) {
		for (const r of readers.values()) if (r.detect(doc, url)) return { id: r.id, name: r.name };
		return null;
	}

	root.SaveMyChat = {
		...(root.SaveMyChat || {}),
		kit: true,
		FORMAT,
		ROLES,
		markdown,
		turn,
		conversation,
		validate,
		reader,
		readers,
		readPage,
		present,
	};

	// In a web page (not the background, popup or options, which have a
	// document too), answer the questions the background sends to the tab.
	const inWebPage = root.document && !/^(moz|chrome)-extension:$/.test(root.location?.protocol);
	if (inWebPage && root.browser?.runtime?.onMessage && !root.SaveMyChat.listening) {
		root.SaveMyChat.listening = true;
		root.browser.runtime.onMessage.addListener((msg) => {
			if (msg?.type === "save-my-chat:present") return Promise.resolve(present());
			if (msg?.type === "save-my-chat:read") return Promise.resolve(readPage());
		});
	}
})();
