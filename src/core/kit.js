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

	// `exclude`: a selector of parts left out, e.g. a turn of another role
	// nested inside this one, which becomes a turn of its own.
	function markdown(element, exclude = "") {
		const copy = absolute(element);
		if (exclude) for (const part of copy.querySelectorAll(exclude)) part.remove();
		return turndown()
			.turndown(copy)
			.replace(/\n{3,}/g, "\n\n")
			.trim();
	}

	// ---- the unified format -----------------------------------------------

	function turn(role, element, extra = {}, exclude = "") {
		if (!ROLES.includes(role)) throw new Error(`unknown role: ${role}`);
		const text = typeof element === "string" ? element.trim() : markdown(element, exclude);
		return { role, text, ...extra };
	}

	// ---- selector sets ------------------------------------------------------
	// Webapps built by a compiler (Google's are) rename their classes with
	// each build, so a reader names a set of candidates per part, newest
	// first, and the user can put fixes in front of them (storage.local,
	// "selectors": { <reader id>: { <part>: [...] } }) without a release.

	// The candidates that are valid CSS, joined; a broken override is skipped, not fatal.
	function selector(list, doc = root.document) {
		return []
			.concat(list || [])
			.filter((s) => {
				if (typeof s !== "string" || !s.trim()) return false;
				try {
					doc.querySelector(s);
					return true;
				} catch {
					return false;
				}
			})
			.join(", ");
	}

	// The reader's sets with the user's overrides in front.
	function effective(defaults = {}, overrides = {}) {
		const out = {};
		for (const key of new Set([...Object.keys(defaults), ...Object.keys(overrides)]))
			out[key] = [...[].concat(overrides[key] || []), ...[].concat(defaults[key] || [])];
		return out;
	}

	// Every element matching any role's set, in page order: what Sett's proof
	// of work did with one querySelectorAll. An element inside a turn of the
	// same role is a duplicate and skipped; one of another role becomes its
	// own turn and is left out of the outer turn's text, so nothing is lost
	// and nothing is written twice.
	function turnsBy(doc, roles, scope = doc) {
		const sets = Object.entries(roles)
			.map(([role, list]) => [role, selector(list, doc)])
			.filter(([, css]) => css);
		const all = sets.map(([, css]) => css).join(", ");
		if (!all) return [];
		const taken = [];
		const turns = [];
		for (const el of scope.querySelectorAll(all)) {
			const [role] = sets.find(([, css]) => el.matches(css));
			if (taken.some((t) => t.role === role && t.el.contains(el))) continue;
			taken.push({ role, el });
			const others = sets
				.filter(([r]) => r !== role)
				.map(([, c]) => c)
				.join(", ");
			turns.push(turn(role, el, {}, others));
		}
		return turns;
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

	// Signs that a selector set is out of date: in a chat every question has
	// its answer. Shown to the user by the popup, never written to the file.
	function suspicions(turns) {
		const count = (role) => turns.filter((t) => t.role === role).length;
		const of = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
		const asked = count("user");
		const answered = count("assistant");
		if (answered > asked)
			return [`${of(answered, "answer")} but ${of(asked, "question")}: a user selector may be out of date.`];
		if (asked > answered + 1)
			return [`${of(asked, "question")} but ${of(answered, "answer")}: an assistant selector may be out of date.`];
		return [];
	}

	async function overridesOf(id) {
		try {
			const { selectors = {} } = await root.browser.storage.local.get("selectors");
			return selectors[id] || {};
		} catch {
			return {}; // tests, or a page where storage is not reachable
		}
	}

	// What a content script answers when the popup asks it to read the page.
	// A reader's read() gets its selector sets, overrides in front, as a third argument.
	async function readPage(doc = root.document, url = root.location?.href, overrides) {
		for (const r of readers.values()) {
			if (!r.detect(doc, url)) continue;
			const sets = effective(r.selectors, overrides ?? (await overridesOf(r.id)));
			const c = conversation(r, r.read(doc, url, sets), url);
			const warnings = suspicions(c.turns);
			return warnings.length ? { ...c, warnings } : c;
		}
		return null;
	}

	// What the reader saw, for the popup's report and for testing in the wild:
	// each selector candidate with how many elements it finds (null: not valid
	// CSS), the messages per role, the warnings. No text of the conversation.
	async function inspect(doc = root.document, url = root.location?.href, overrides) {
		for (const r of readers.values()) {
			if (!r.detect(doc, url)) continue;
			const own = overrides ?? (await overridesOf(r.id));
			const sets = effective(r.selectors, own);
			const parts = {};
			for (const [part, list] of Object.entries(sets)) {
				const mine = [].concat(own[part] || []).length;
				parts[part] = list.map((css, i) => {
					let found = null;
					try {
						found = doc.querySelectorAll(css).length;
					} catch {
						// not valid CSS: skipped by selector(), shown as such here
					}
					return { css, found, override: i < mine };
				});
			}
			const seen = { reader: r.id, name: r.name, host: new URL(url).host, parts, turns: {}, warnings: [] };
			try {
				const c = conversation(r, r.read(doc, url, sets), url);
				for (const t of c.turns) seen.turns[t.role] = (seen.turns[t.role] || 0) + 1;
				seen.warnings = suspicions(c.turns);
			} catch (error) {
				seen.error = String(error?.message || error);
			}
			return seen;
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
		selector,
		effective,
		turnsBy,
		suspicions,
		conversation,
		validate,
		reader,
		readers,
		readPage,
		inspect,
		present,
	};

	// In a web page (not the background, popup or options, which have a
	// document too), answer the questions the background sends to the tab.
	const inWebPage = root.document && !/^(moz|chrome)-extension:$/.test(root.location?.protocol);
	if (inWebPage && root.browser?.runtime?.onMessage && !root.SaveMyChat.listening) {
		root.SaveMyChat.listening = true;
		root.browser.runtime.onMessage.addListener((msg) => {
			if (msg?.type === "save-my-chat:present") return Promise.resolve(present());
			if (msg?.type === "save-my-chat:read") return readPage();
			if (msg?.type === "save-my-chat:inspect") return inspect();
		});
	}
})();
