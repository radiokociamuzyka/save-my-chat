// The kit every context shares: the unified format, DOM to markdown, and the
// registration of readers. A classic script (content scripts cannot be ES
// modules), so it lives on globalThis.SaveMyChat and is safe to load twice.
(() => {
	const root = globalThis;
	if (root.SaveMyChat?.kit) return;

	const FORMAT = "save-my-chat/0";
	const ROLES = ["user", "assistant", "system", "tool"];

	// ---- DOM to markdown -------------------------------------------------

	const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "svg", "SVG", "BUTTON"]);

	function inline(node) {
		let out = "";
		for (const child of node.childNodes) out += md(child);
		return out;
	}

	function fence(text, lang = "") {
		const longest = Math.max(2, ...(text.match(/`+/g) || []).map((s) => s.length));
		const ticks = "`".repeat(longest + 1);
		return `\n\n${ticks}${lang}\n${text.replace(/\n$/, "")}\n${ticks}\n\n`;
	}

	function list(node, ordered) {
		let i = Number(node.getAttribute?.("start")) || 1;
		let out = "\n\n";
		for (const li of node.children) {
			if (li.tagName !== "LI") continue;
			const mark = ordered ? `${i++}. ` : "- ";
			const body = inline(li)
				.trim()
				.replace(/\n/g, `\n${" ".repeat(mark.length)}`);
			out += `${mark}${body}\n`;
		}
		return `${out}\n`;
	}

	function table(node) {
		const rows = [...node.querySelectorAll("tr")].map((tr) =>
			[...tr.children].map((cell) => inline(cell).trim().replace(/\|/g, "\\|").replace(/\n+/g, " ")),
		);
		if (!rows.length) return "";
		const width = Math.max(...rows.map((r) => r.length));
		const line = (r) => `| ${Array.from({ length: width }, (_, i) => r[i] ?? "").join(" | ")} |`;
		const head = line(rows[0]);
		const rule = `| ${Array(width).fill("---").join(" | ")} |`;
		return `\n\n${[head, rule, ...rows.slice(1).map(line)].join("\n")}\n\n`;
	}

	function md(node) {
		if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, " ");
		if (node.nodeType !== 1 || SKIP.has(node.tagName)) return "";
		if (node.hidden || node.getAttribute("aria-hidden") === "true") return "";
		const tag = node.tagName;
		switch (tag) {
			case "BR":
				return "  \n";
			case "HR":
				return "\n\n---\n\n";
			case "H1":
			case "H2":
			case "H3":
			case "H4":
			case "H5":
			case "H6":
				return `\n\n${"#".repeat(Number(tag[1]))} ${inline(node).trim()}\n\n`;
			case "P":
			case "DIV":
			case "SECTION":
			case "ARTICLE":
				return `\n\n${inline(node).trim()}\n\n`;
			case "STRONG":
			case "B": {
				const t = inline(node).trim();
				return t ? `**${t}**` : "";
			}
			case "EM":
			case "I": {
				const t = inline(node).trim();
				return t ? `*${t}*` : "";
			}
			case "DEL":
			case "S":
				return `~~${inline(node).trim()}~~`;
			case "CODE":
				if (node.parentElement?.tagName === "PRE") return node.textContent;
				return `\`${node.textContent}\``;
			case "PRE": {
				const code = node.querySelector("code");
				const lang = (code?.className.match(/language-([\w+-]+)/) || [])[1] || "";
				return fence(node.textContent, lang);
			}
			case "A": {
				const text = inline(node).trim();
				const href = node.getAttribute("href");
				if (!href || href.startsWith("javascript:")) return text;
				const url = new URL(href, node.ownerDocument.baseURI).href;
				return text ? `[${text}](${url})` : `<${url}>`;
			}
			case "IMG": {
				const src = node.getAttribute("src");
				return src ? `![${node.getAttribute("alt") || ""}](${new URL(src, node.ownerDocument.baseURI).href})` : "";
			}
			case "UL":
				return list(node, false);
			case "OL":
				return list(node, true);
			case "BLOCKQUOTE":
				return `\n\n${inline(node)
					.trim()
					.split("\n")
					.map((l) => `> ${l}`)
					.join("\n")}\n\n`;
			case "TABLE":
				return table(node);
			default:
				return inline(node);
		}
	}

	function markdown(element) {
		return md(element)
			.replace(/[ \t]+\n/g, (m) => (m.startsWith("  ") ? "  \n" : "\n"))
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
