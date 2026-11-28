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

	// Sett's way (proof of work, 2026-11-27): find every message with one query
	// over all roles' selectors, then tell each one's role by which set it
	// matches. An element inside a message of the same role is a duplicate and
	// skipped; one of the other role is its own message, cut out of the outer
	// one's text, so nothing is lost and nothing is written twice.
	// The order is where each message's own text starts, not where its element
	// opens: querySelectorAll lists an ancestor before what it holds, so an
	// answer block holding its question came out first, 1,0,3,2,5,4 (almanac:
	// ai-mode-swapped-pairs).
	const SKIPPED = "script, style, noscript, template, button, svg, [aria-hidden='true']";

	function ownStart(el, inner, doc) {
		const walker = doc.createTreeWalker(el, 4); // NodeFilter.SHOW_TEXT
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			if (!node.data.trim()) continue;
			if (inner.some((i) => i.contains(node))) continue;
			const skipped = node.parentElement?.closest(SKIPPED);
			if (skipped && el.contains(skipped)) continue;
			return node;
		}
		return el;
	}

	// hidden: selectors of what a message holds but is not its text (a heading only a
	// screen reader says, ChatGPT's "You said:"), left out of every message.
	// key(el): the page's own id of a message (Sett, 2026-11-28: a message known by its id,
	// not its text, which two alike messages share), kept on the turn as `key`, not
	// enumerable: it is for joining the windows of a long chat, not part of the format.
	function turnsBy(doc, roles, scope = doc, { hidden, key } = {}) {
		const hiddenCss = selector(hidden, doc);
		const sets = Object.entries(roles)
			.map(([role, list]) => [role, selector(list, doc)])
			.filter(([, css]) => css);
		const all = sets.map(([, css]) => css).join(", ");
		if (!all) return [];
		const found = [];
		for (const el of scope.querySelectorAll(all)) {
			const [role] = sets.find(([, css]) => el.matches(css));
			if (found.some((f) => f.role === role && f.el.contains(el))) continue;
			found.push({ role, el });
		}
		const placed = found.map((f) => {
			const inner = found.filter((g) => g.role !== f.role && f.el.contains(g.el)).map((g) => g.el);
			const others = [...sets.filter(([r]) => r !== f.role).map(([, c]) => c), ...(hiddenCss ? [hiddenCss] : [])].join(
				", ",
			);
			const t = turn(f.role, f.el, {}, others);
			const id = key?.(f.el);
			if (id) Object.defineProperty(t, "key", { value: String(id), enumerable: false });
			return { at: ownStart(f.el, inner, doc), turn: t };
		});
		// DOCUMENT_POSITION_FOLLOWING (4): b comes after a
		placed.sort((a, b) => (a.at === b.at ? 0 : a.at.compareDocumentPosition(b.at) & 4 ? -1 : 1));
		return placed.map((p) => p.turn);
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
		const found = [];
		if (answered > asked)
			found.push(`${of(answered, "answer")} but ${of(asked, "question")}: a user selector may be out of date.`);
		if (asked > answered + 1)
			found.push(`${of(asked, "question")} but ${of(answered, "answer")}: an assistant selector may be out of date.`);
		// a chat goes user, agent, user, agent... and ends with the agent (Sett, 2026-11-27)
		const talk = turns.filter((t) => t.role === "user" || t.role === "assistant");
		if (talk.length && talk[0].role !== "user") found.push("It starts with an answer: the order may be wrong.");
		if (talk.length && talk.at(-1).role !== "assistant")
			found.push("It ends with a question: its answer is missing or still being written.");
		const twice = talk.flatMap((t, i) => (i && talk[i - 1].role === t.role ? [i] : []));
		if (twice.length)
			found.push(
				`Two messages of one role in a row at ${twice.map((i) => `${i}-${i + 1}`).join(", ")}: a message of the other role may be missing.`,
			);
		return found;
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
			// messages held inside a message of the other role ("user in assistant": 3)
			const roles = ["user", "assistant"].filter((role) => selector(sets[role], doc));
			for (const inner of roles)
				for (const outer of roles) {
					if (inner === outer) continue;
					const n = [...doc.querySelectorAll(selector(sets[inner], doc))].filter((el) =>
						el.parentElement?.closest(selector(sets[outer], doc)),
					).length;
					if (!n) continue;
					seen.nested = { ...seen.nested, [`${inner} in ${outer}`]: n };
				}
			try {
				const c = conversation(r, r.read(doc, url, sets), url);
				for (const t of c.turns) seen.turns[t.role] = (seen.turns[t.role] || 0) + 1;
				seen.order = c.turns.map((t) => ({ user: "U", assistant: "A" })[t.role] || t.role).join(" ");
				seen.warnings = suspicions(c.turns);
			} catch (error) {
				seen.error = String(error?.message || error);
			}
			return seen;
		}
		return null;
	}

	// Does a URL fall under a match pattern ("https://github.com/copilot*",
	// "*://*.example.com/*")? The background picks a tab's prototype by it.
	// https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
	function matches(pattern, url) {
		if (pattern === "<all_urls>") return /^(https?|wss?|file|ftp|data):/.test(String(url));
		const m = /^(\*|https?|wss?|file|ftp|data):\/\/([^/]*)(\/.*)$/.exec(pattern);
		if (!m) return false;
		let u;
		try {
			u = new URL(url);
		} catch {
			return false;
		}
		const [, scheme, host, path] = m;
		const protocol = u.protocol.slice(0, -1);
		if (scheme === "*" ? !["http", "https", "ws", "wss"].includes(protocol) : scheme !== protocol) return false;
		if (host !== "*") {
			const bare = host.replace(/^\*\./, "");
			if (host.startsWith("*.") ? !(u.hostname === bare || u.hostname.endsWith(`.${bare}`)) : u.hostname !== host)
				return false;
		}
		const glob = new RegExp(`^${path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`);
		return glob.test(u.pathname + u.search);
	}

	// The conversations a page lists (phase 5: gathered one by one, a backup): a
	// reader's own list(doc, url) when it has one and sees the page, else every link
	// whose address falls under one of `patterns` (the chat's addresses in chats.yaml,
	// sent by the background). Each once, without its #fragment, named by its
	// longest text (a sidebar's title, not an icon's link to the same chat).
	function label(a) {
		return (a.textContent || a.getAttribute("aria-label") || a.getAttribute("title") || "").replace(/\s+/g, " ").trim();
	}

	function listed(doc = root.document, url = root.location?.href, patterns = []) {
		const own = [...readers.values()].find((r) => r.list && r.detect(doc, url));
		const found = own
			? own.list(doc, url)
			: [...doc.querySelectorAll("a[href]")].map((a) => ({ url: a.getAttribute("href"), title: label(a) }));
		const chats = new Map();
		for (const item of found || []) {
			let href;
			try {
				href = new URL(item.url, doc.baseURI);
			} catch {
				continue;
			}
			href.hash = "";
			if (!/^https?:$/.test(href.protocol)) continue;
			if (!own && !patterns.some((p) => matches(p, href.href))) continue;
			const title = String(item.title || "").trim();
			const known = chats.get(href.href);
			if (!known || title.length > known.title.length) chats.set(href.href, { url: href.href, title });
		}
		return [...chats.values()];
	}

	// ---- loading what a page draws only as it is scrolled (Sett, RR7, RR8) ------
	// A webapp's list of chats grows as its end is scrolled to (ChatGPT: 20, 31,
	// 47...), a long chat brings its older messages as its top is. Load and wait:
	// scroll the box holding the items to that end, wait, count again, until the
	// count stays the same `still` times in a row.
	// RR8: ChatGPT's list still stopped short. A webapp loads its next batch when a
	// mark at the end comes into view (an IntersectionObserver): a box already at its
	// end does not bring it into view again, and a batch slower than one wait looked
	// like the end. So each round first steps back from the end, then goes to it, and
	// the end is taken after three quiet rounds of 1.5 s, not two of 1.2 s.

	const pause = (ms) => new Promise((done) => setTimeout(done, ms));

	// the nearest ancestor that scrolls, else the page
	function scroller(el, doc) {
		for (let e = el?.parentElement; e; e = e.parentElement) {
			const overflow = doc.defaultView.getComputedStyle(e).overflowY;
			if (/auto|scroll|overlay/.test(overflow) && e.scrollHeight > e.clientHeight) return e;
		}
		return doc.scrollingElement || doc.documentElement;
	}

	//   find(): the items now on the page (elements); to: "top" | "bottom";
	//   count(): how many are known, after each round (default: those on the page)
	async function loadAll(doc, find, to, { wait = 1500, still = 3, rounds = 300, count = () => find().length } = {}) {
		let most = count();
		for (let i = 0, same = 0; i < rounds && same < still; i++) {
			const items = find();
			const edge = to === "top" ? items[0] : items.at(-1);
			const box = scroller(edge, doc);
			// a step back from the end, so the end comes into view again
			const back = Math.max(box.clientHeight / 2, 200);
			box.scrollTop = to === "top" ? box.scrollTop + back : Math.max(box.scrollTop - back, 0);
			await pause(Math.min(wait, 150));
			box.scrollTop = to === "top" ? 0 : box.scrollHeight;
			edge?.scrollIntoView?.({ block: to === "top" ? "start" : "end" });
			await pause(wait);
			const now = count();
			same = now > most ? 0 : same + 1;
			most = Math.max(most, now);
		}
		return most;
	}

	// the reader's messages as elements: every part's selectors but the title's, the
	// transcript's (what holds them all) and what is hidden in them
	const NOT_MESSAGES = ["title", "transcript", "hidden"];
	function messagesOf(sets, doc) {
		const css = selector(
			Object.entries(sets)
				.filter(([part]) => !NOT_MESSAGES.includes(part))
				.flatMap(([, list]) => list),
			doc,
		);
		return () => (css ? [...doc.querySelectorAll(css)] : []);
	}

	// a chat's older messages brought in: how many messages the page then holds
	async function loadChat(doc = root.document, url = root.location?.href, overrides, options) {
		for (const r of readers.values()) {
			if (!r.detect(doc, url)) continue;
			const sets = effective(r.selectors, overrides ?? (await overridesOf(r.id)));
			return loadAll(doc, messagesOf(sets, doc), "top", options);
		}
		return 0;
	}

	// The whole list, kept as it scrolls down to its end. A list may be virtual (AI Mode's
	// history: 215 threads, 10 in the page at a time) or grow as its end is reached
	// (ChatGPT's sidebar), so it goes down one screen at a time, every chat seen kept - a
	// jump to the end would skip a virtual list's middle. At the end, as for a long chat
	// (Sett's check): a step up and back, a pause, and more come, or the list grows? When
	// not, `still` times in a row, that is the end.
	//   The items: the reader's own listItems(doc) (elements), else the links listed.
	async function loadList(doc = root.document, url = root.location?.href, patterns = [], options = {}) {
		const { wait = 2000, step = 300, still = 3, rounds = 3000 } = options;
		const own = [...readers.values()].find((r) => r.list && r.detect(doc, url));
		const seen = new Map();
		const keep = () => {
			for (const chat of listed(doc, url, patterns)) {
				const known = seen.get(chat.url);
				if (!known || chat.title.length > known.title.length) seen.set(chat.url, chat);
			}
			return seen.size;
		};
		const items = () => {
			if (own?.listItems) return [...own.listItems(doc)];
			return [...doc.querySelectorAll("a[href]")].filter((a) => {
				try {
					const href = new URL(a.getAttribute("href"), doc.baseURI);
					href.hash = "";
					return seen.has(href.href);
				} catch {
					return false;
				}
			});
		};
		// from its top, whatever it was left at (seen live: a panel left at its end read 10 of 215)
		const start = scroller(items()[0], doc);
		start.scrollTop = 0;
		await pause(step);
		keep();
		for (let i = 0, quiet = 0; i < rounds && quiet < still; i++) {
			const box = scroller(items().at(-1), doc);
			const before = seen.size;
			const height = box.scrollHeight;
			const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
			if (atEnd) {
				const nudge = Math.min(box.clientHeight / 2, 200);
				box.scrollTop -= nudge;
				await pause(Math.min(step, 150));
				box.scrollTop += nudge;
				await pause(wait);
			} else {
				box.scrollTop += Math.max(box.clientHeight * 0.7, 100);
				await pause(step);
			}
			keep();
			if (seen.size > before || box.scrollHeight > height) quiet = 0;
			else if (atEnd) quiet++;
		}
		return [...seen.values()];
	}

	// ---- a long chat read whole, while it scrolls (phase 7) ------------------------
	// A virtualized chat (ChatGPT, DeepSeek) holds only the messages near the screen, so
	// counting elements cannot say whether more came, and one read holds the last screen
	// only (seen live, 2026-11-28). So, from the newest end, the chat's box goes up one
	// screen at a time, each window read and kept: a jump to the top would skip what lies
	// between, which exists only while it is on screen. At the top, Sett's check: pause for
	// the webapp to load, then can the box go further into the past now (it moved away from
	// its top, keeping the screen in place, or grew)? When it cannot, `still` times in a row,
	// that is the start. Each window is joined to what is kept where the two meet (a message
	// by its role and text); one meeting nothing kept is put before it, with a warning.

	// a message's identity: the page's id when the reader gives one, else its role and text
	const keyOf = (t) => (t.key ? `#${t.key}` : `${t.role}\u0000${t.text}`);

	// older: the window just read, in page order; kept: what is kept, oldest first.
	// The window meets what is kept at its first message already kept - not only at the
	// oldest kept one, which a virtualized page may no longer hold (seen live, ChatGPT: a
	// window without it read as nothing new, for 600 rounds). What comes before that
	// message, and is not kept, goes in front. Gives how many, and whether it met at all.
	function joined(kept, older) {
		if (!older.length) return { added: 0, met: true };
		if (!kept.length) {
			kept.push(...older);
			return { added: older.length, met: true };
		}
		const known = new Set(kept.map(keyOf));
		const at = older.findIndex((t) => known.has(keyOf(t)));
		const before = (at >= 0 ? older.slice(0, at) : older).filter((t) => !known.has(keyOf(t)));
		kept.unshift(...before);
		return { added: before.length, met: at >= 0 };
	}

	// The box the chat scrolls in: around its transcript when the reader names one, else
	// around all its messages - not the nearest box around the first message, which may be
	// a message of its own that scrolls (ChatGPT's long user messages; seen live).
	function chatBox(sets, doc) {
		const transcript = selector(sets.transcript, doc);
		const all = messagesOf(sets, doc)();
		let start = (transcript && doc.querySelector(transcript)) || all[0];
		while (start && all.length && !start.contains(all.at(-1))) start = start.parentElement;
		for (let e = start; e; e = e.parentElement) {
			const overflow = doc.defaultView.getComputedStyle(e).overflowY;
			if (/auto|scroll|overlay/.test(overflow) && e.scrollHeight > e.clientHeight) return e;
		}
		return doc.scrollingElement || doc.documentElement;
	}

	//   wait: the pause at the top, for the webapp to load; step: the pause after a screen up.
	//   Seen live: ChatGPT brings older messages 2 to 5 s after the top is reached, some later
	//   still; so 3 s at the top, and the start taken after three quiet pauses, about 10 s.
	//   stuck: steps up that met nothing new, after which the box goes to the top at once.
	//   Seen live: ChatGPT measures the messages above as they come into view, pushing the
	//   view down again and again, so stepping up never reached the top; what lies below is
	//   read by then, so the jump skips nothing.
	//   patience: no new message for so long, going up or waiting, is the start too.
	async function readWhole(doc = root.document, url = root.location?.href, overrides, options = {}) {
		const { wait = 3000, step = 300, still = 3, stuck = 40, patience = 60_000, rounds = 5000 } = options;
		for (const r of readers.values()) {
			if (!r.detect(doc, url)) continue;
			const sets = effective(r.selectors, overrides ?? (await overridesOf(r.id)));
			const box = chatBox(sets, doc);
			const kept = [];
			let read;
			let gap = false;
			const take = () => {
				read = r.read(doc, url, sets);
				const { added, met } = joined(kept, read.turns);
				gap ||= !met;
				return added;
			};
			box.scrollTop = box.scrollHeight; // the newest end
			await pause(step);
			take();
			// how far it is, for whoever asks the page meanwhile (the debug gate's progress)
			const progress = { started: Date.now(), round: 0, kept: kept.length, atTop: false, done: false };
			root.SaveMyChat.progress = progress;
			let idle = 0; // steps up since a new message came
			let fresh = Date.now(); // when one last came
			for (let i = 0, quiet = 0; i < rounds && quiet < still && Date.now() - fresh < patience; i++) {
				const atTop = box.scrollTop <= 1;
				const settle = atTop || idle >= stuck;
				const height = box.scrollHeight;
				if (settle) {
					if (!atTop)
						box.scrollTop = 0; // stuck: to the top at once, all below is read
					else {
						// a box already at its top asks the webapp for nothing (seen live, ChatGPT:
						// stopped at 10 of a long chat): a step down and back up by as much. By as
						// much, not to 0: older ones loaded meanwhile move the view down, and a
						// jump to 0 would skip them.
						const nudge = Math.min(box.clientHeight / 2, 200);
						box.scrollTop += nudge;
						await pause(Math.min(step, 150));
						box.scrollTop = Math.max(0, box.scrollTop - nudge);
					}
					await pause(wait);
					idle = 0;
				} else {
					box.scrollTop = Math.max(0, box.scrollTop - Math.max(box.clientHeight * 0.7, 100));
					await pause(step);
				}
				const added = take();
				if (added) fresh = Date.now();
				idle = added ? 0 : idle + 1;
				// Sett's check, after the pause: can the box go further into the past now? Told by
				// the chat grown taller: the view kept away from the top is no sign of it on a
				// page that pushes the view down as it measures (ChatGPT)
				const further = box.scrollHeight > height;
				// quiet: pauses at the top that brought nothing; a step up between them is no news
				if (added || further) quiet = 0;
				else if (settle) quiet++;
				Object.assign(progress, {
					round: i + 1,
					kept: kept.length,
					atTop,
					settle,
					idle,
					top: Math.round(box.scrollTop),
				});
			}
			progress.done = true;
			const c = conversation(r, { ...read, turns: kept }, url);
			const warnings = suspicions(c.turns);
			if (gap) warnings.push("Older messages came without meeting the newer ones: some between them may be missing.");
			return warnings.length ? { ...c, warnings } : c;
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
		readWhole,
		joined,
		inspect,
		present,
		listed,
		loadAll,
		loadChat,
		loadList,
		matches,
	};

	// In a web page (not the background, popup or options, which have a
	// document too), answer the questions the background sends to the tab.
	const inWebPage = root.document && !/^(moz|chrome)-extension:$/.test(root.location?.protocol);
	if (inWebPage && root.browser?.runtime?.onMessage && !root.SaveMyChat.listening) {
		root.SaveMyChat.listening = true;
		root.browser.runtime.onMessage.addListener((msg) => {
			if (msg?.type === "save-my-chat:present") return Promise.resolve(present());
			if (msg?.type === "save-my-chat:read") return msg.whole ? readWhole() : readPage();
			if (msg?.type === "save-my-chat:inspect") return inspect();
			if (msg?.type === "save-my-chat:list")
				return msg.load
					? loadList(undefined, undefined, msg.patterns)
					: Promise.resolve(listed(undefined, undefined, msg.patterns));
			if (msg?.type === "save-my-chat:load") return loadChat();
		});
	}
})();
