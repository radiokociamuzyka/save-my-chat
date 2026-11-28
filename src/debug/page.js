// The debug gate's hands in a page (debug build only, Sett RR8 and Q15: "make yourself
// comfortable suite to look at items with me in dev's debug mode"). Injected by
// debug/background.js into the tab an agent asks about, in the extension's isolated
// world, beside the kit. It looks: an outline of the page, what a selector finds, one
// element; it shows: marks drawn over what the agent thinks should be read; and it
// lets the user point: a click on an element, labelled, goes back as a pick.
// Selectors are data given to querySelectorAll; nothing here evaluates code it is sent
// (rule 5). The marks and the pointing bar live in a shadow root of their own, so the
// page's styles and the extension's stay apart.
(() => {
	if (globalThis.SaveMyChatDebug) return;

	const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "LINK", "META", "PATH", "DEFS", "SYMBOL"]);
	const KEPT_ATTRS = /^(id|role|aria-label|name|href|type|title|data-[\w-]+)$/;
	const COLORS = { user: "#3e8ed0", assistant: "#48c78e", title: "#ff9f43", list: "#b86bff", other: "#f14668" };
	const LABELS = ["user", "assistant", "title", "list", "other"];

	const short = (text, n) => {
		const t = String(text ?? "")
			.replace(/\s+/g, " ")
			.trim();
		return t.length > n ? `${t.slice(0, n - 1)}…` : t;
	};

	// ---- what an element is --------------------------------------------------

	function about(el) {
		const attrs = {};
		for (const a of el.attributes) if (KEPT_ATTRS.test(a.name) && a.name !== "id") attrs[a.name] = short(a.value, 80);
		return {
			tag: el.tagName.toLowerCase(),
			id: el.id || undefined,
			classes: [...el.classList].slice(0, 8),
			attrs,
		};
	}

	const cssEscape = (s) => (globalThis.CSS?.escape ? CSS.escape(s) : String(s).replace(/[^\w-]/g, "\\$&"));

	// one line for an element: tag#id.class[attr=value]
	function signature(el) {
		const d = about(el);
		const attrs = Object.entries(d.attrs)
			.filter(([k]) => k !== "href" && k !== "title")
			.map(([k, v]) => `[${k}${v ? `="${short(v, 40)}"` : ""}]`)
			.join("");
		return `${d.tag}${d.id ? `#${d.id}` : ""}${d.classes.map((c) => `.${c}`).join("")}${attrs}`;
	}

	// a CSS path from <body>, by :nth-of-type, stopping at an id
	function pathOf(el) {
		const parts = [];
		for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
			if (e.id && document.querySelectorAll(`#${cssEscape(e.id)}`).length === 1) {
				parts.unshift(`#${cssEscape(e.id)}`);
				break;
			}
			const tag = e.tagName.toLowerCase();
			const same = e.parentElement ? [...e.parentElement.children].filter((s) => s.tagName === e.tagName) : [];
			parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(e) + 1})` : tag);
		}
		return parts.join(" > ");
	}

	const count = (css) => {
		try {
			return document.querySelectorAll(css).length;
		} catch {
			return null;
		}
	};

	// Selectors that would find this element, the steadiest first: the attributes a
	// webapp keeps for its own scripts and tests, then its classes, with how many
	// elements each finds on the page now.
	function suggest(el) {
		const tag = el.tagName.toLowerCase();
		const out = [];
		const add = (css) => {
			if (out.some((s) => s.css === css)) return;
			const found = count(css);
			if (found) out.push({ css, found });
		};
		for (const a of el.attributes) {
			if (!/^(data-[\w-]+|role|aria-label)$/.test(a.name)) continue;
			if (a.value && a.value.length <= 40 && !/\d{4,}|[0-9a-f]{8}-/.test(a.value))
				add(`[${a.name}="${a.value.replace(/"/g, '\\"')}"]`);
			add(`[${a.name}]`);
		}
		for (const c of el.classList) if (!/\d{3,}/.test(c)) add(`${tag}[class~="${c.replace(/"/g, '\\"')}"]`);
		add(tag);
		return out.slice(0, 8);
	}

	// ---- looking ---------------------------------------------------------------

	function rootOf(selector) {
		if (!selector) return document.body;
		const el = document.querySelector(selector);
		if (!el) throw new Error(`nothing matches ${selector}`);
		return el;
	}

	// The page as indented lines, an element a line with the start of its own text;
	// a run of siblings alike is one line with its count (×12).
	function outline({ selector, depth = 4, limit = 300, text = 60 } = {}) {
		const lines = [];
		const walk = (el, level) => {
			if (lines.length >= limit || SKIP.has(el.tagName) || el.id === HOST_ID) return;
			const own = [...el.childNodes]
				.filter((n) => n.nodeType === 3)
				.map((n) => n.data)
				.join(" ");
			const kids = [...el.children].filter((c) => !SKIP.has(c.tagName));
			lines.push(
				`${"  ".repeat(level)}${signature(el)}${kids.length ? ` (${kids.length})` : ""}${short(own, text) ? ` "${short(own, text)}"` : ""}`,
			);
			if (level >= depth) {
				if (kids.length) lines.push(`${"  ".repeat(level + 1)}… "${short(el.textContent, text)}"`);
				return;
			}
			for (let i = 0; i < kids.length; i++) {
				let run = 1;
				while (i + run < kids.length && signature(kids[i + run]) === signature(kids[i])) run++;
				walk(kids[i], level + 1);
				if (run > 1) {
					lines.push(`${"  ".repeat(level + 1)}×${run - 1} more ${signature(kids[i])}`);
					i += run - 1;
				}
			}
		};
		walk(rootOf(selector), 0);
		if (lines.length >= limit) lines.push(`… cut at ${limit} lines: ask with a selector, or less depth`);
		return { url: location.href, title: document.title, outline: lines.join("\n") };
	}

	function query({ selector, limit = 20, text = 200 } = {}) {
		const all = [...document.querySelectorAll(selector)];
		return {
			found: all.length,
			items: all.slice(0, limit).map((el) => ({
				path: pathOf(el),
				...about(el),
				children: el.children.length,
				text: short(el.textContent, text),
			})),
		};
	}

	function element({ selector, index = 0, html = 4000 } = {}) {
		const el = document.querySelectorAll(selector)[index];
		if (!el) throw new Error(`no element ${index} for ${selector}`);
		return {
			path: pathOf(el),
			...about(el),
			suggest: suggest(el),
			text: short(el.textContent, 2000),
			html: el.outerHTML.length > html ? `${el.outerHTML.slice(0, html)}…` : el.outerHTML,
		};
	}

	// The page as it is, for a sample (resources/samples/): its scripts' and styles'
	// insides left out, which are the webapp's and heavy, not what is read.
	function snapshot() {
		const copy = document.documentElement.cloneNode(true);
		for (const el of copy.querySelectorAll(`script, style, noscript, link[rel="stylesheet"], #${HOST_ID}`)) el.remove();
		for (const el of copy.querySelectorAll("svg")) el.replaceChildren();
		return { url: location.href, title: document.title, html: `<!doctype html>\n${copy.outerHTML}` };
	}

	// ---- showing: marks over the page, the pointing bar ------------------------

	const HOST_ID = "save-my-chat-debug";
	let shadow = null;
	let layer = null;
	let marks = [];

	function host() {
		if (shadow && document.getElementById(HOST_ID)) return shadow;
		const el = document.createElement("div");
		el.id = HOST_ID;
		el.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;";
		document.documentElement.append(el);
		shadow = el.attachShadow({ mode: "open" });
		const style = document.createElement("style");
		style.textContent = `
			.box { position: absolute; pointer-events: none; border: 2px solid; border-radius: 3px; box-sizing: border-box; }
			.tag { position: absolute; top: -1.4em; left: -2px; font: 11px/1.3 monospace; color: #fff; padding: 0 4px;
				border-radius: 3px 3px 0 0; white-space: nowrap; }
			.bar { position: fixed; left: 1rem; right: 1rem; bottom: 1rem; pointer-events: auto; background: #1e1e2e;
				color: #eee; font: 13px/1.4 system-ui, sans-serif; padding: .6rem .8rem; border-radius: 6px;
				box-shadow: 0 2px 12px #0008; display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
			.bar code { color: #9cdcfe; }
			.bar button { font: inherit; cursor: pointer; border: 0; border-radius: 4px; padding: .2rem .6rem; color: #fff; }
			.bar input { font: inherit; flex: 1; min-width: 10rem; }
			.what { flex-basis: 100%; }
		`;
		layer = document.createElement("div");
		shadow.append(style, layer);
		return shadow;
	}

	function box(el, color, label) {
		const r = el.getBoundingClientRect();
		const b = document.createElement("div");
		b.className = "box";
		b.style.cssText = `left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px;border-color:${color};`;
		if (label) {
			const t = document.createElement("span");
			t.className = "tag";
			t.style.background = color;
			t.textContent = label;
			b.append(t);
		}
		return b;
	}

	function draw() {
		host();
		layer.replaceChildren();
		for (const m of marks) {
			let found = [];
			try {
				found = [...document.querySelectorAll(m.selector)];
			} catch {
				m.found = null;
				continue;
			}
			m.found = found.length;
			found.forEach((el, i) => {
				layer.append(box(el, m.color, `${m.label}${found.length > 1 ? ` ${i + 1}` : ""}`));
			});
		}
	}

	let redraw = 0;
	const later = () => {
		cancelAnimationFrame(redraw);
		redraw = requestAnimationFrame(draw);
	};

	// marks: [{ selector, label, color? }], drawn until cleared; they follow the page
	function highlight({ marks: wanted = [], scroll = true } = {}) {
		marks = wanted.map((m) => ({
			...m,
			label: m.label || m.selector,
			color: m.color || COLORS[m.label] || COLORS.other,
		}));
		draw();
		addEventListener("scroll", later, true);
		addEventListener("resize", later);
		if (scroll) {
			for (const m of marks) {
				const first = m.found && document.querySelector(m.selector);
				if (first) {
					first.scrollIntoView?.({ block: "center" });
					break;
				}
			}
			draw();
		}
		return marks.map(({ selector, label, found }) => ({ selector, label, found }));
	}

	function clear() {
		marks = [];
		removeEventListener("scroll", later, true);
		removeEventListener("resize", later);
		layer?.replaceChildren();
		return { cleared: true };
	}

	// ---- pointing: the user clicks what should be read, says what it is -------

	let pointing = false;
	let hovered = null;
	let bar = null;
	const ours = (event) => event.composedPath().includes(document.getElementById(HOST_ID));

	function hover(event) {
		if (ours(event)) return;
		hovered = event.target;
		draw();
		layer.append(box(hovered, "#f14668", signature(hovered).slice(0, 80)));
	}

	function chosen(event) {
		if (ours(event)) return;
		event.preventDefault();
		event.stopPropagation();
		offer(event.target);
	}

	function key(event) {
		if (event.key === "Escape") point({ on: false });
	}

	function button(text, color, onclick) {
		const b = document.createElement("button");
		b.type = "button";
		b.textContent = text;
		b.style.background = color;
		b.addEventListener("click", onclick);
		return b;
	}

	// the bar: what was clicked, and what it is to the user
	function offer(el) {
		bar?.remove();
		bar = document.createElement("div");
		bar.className = "bar";
		const what = document.createElement("div");
		what.className = "what";
		const code = document.createElement("code");
		code.textContent = signature(el).slice(0, 160);
		what.append("Picked ", code, ` "${short(el.textContent, 80)}"`);
		const note = document.createElement("input");
		note.placeholder = "a note for the agent (optional)";
		bar.append(what);
		for (const label of LABELS)
			bar.append(
				button(label, COLORS[label], async () => {
					await send(el, label, note.value);
					what.replaceChildren(`Sent as ${label}. Point at the next one, or stop.`);
				}),
			);
		bar.append(
			note,
			button("parent", "#555", () => el.parentElement && offer(el.parentElement)),
			button("stop pointing", "#555", () => point({ on: false })),
		);
		host().append(bar);
	}

	const picks = [];
	async function send(el, label, note) {
		const pick = {
			at: new Date().toISOString(),
			url: location.href,
			label,
			note: note || undefined,
			path: pathOf(el),
			...about(el),
			suggest: suggest(el),
			text: short(el.textContent, 300),
		};
		picks.push(pick);
		await browser.runtime.sendMessage({ type: "save-my-chat:debug-pick", pick }).catch(() => {});
		return pick;
	}

	function point({ on = true } = {}) {
		if (on === pointing) return { pointing };
		pointing = on;
		const how = on ? addEventListener : removeEventListener;
		how("mouseover", hover, true);
		how("click", chosen, true);
		how("keydown", key, true);
		if (on) {
			host();
			offer(document.body);
			bar.firstChild.replaceChildren("Point at an element of the page and click it, then say what it is. Esc stops.");
		} else {
			bar?.remove();
			bar = null;
			draw();
		}
		return { pointing };
	}

	// ---- scrolling: watching a webapp load (phase 7) ------------------------------
	// Sett: "after scrolling as far as possible now checking if our position after pause to
	// let loading be done we are yet able to scroll into further past". The box an element
	// sits in (or the element, when it scrolls), moved to its top or bottom or by some
	// pixels; where it was, where the move left it, and where it is after the wait.

	function scrolls(el) {
		const overflow = getComputedStyle(el).overflowY;
		return /auto|scroll|overlay/.test(overflow) && el.scrollHeight > el.clientHeight;
	}

	function boxOf(selector) {
		const el = rootOf(selector);
		for (let e = el; e; e = e.parentElement) if (scrolls(e)) return e;
		return document.scrollingElement || document.documentElement;
	}

	const where = (box) => ({
		scrollTop: Math.round(box.scrollTop),
		scrollHeight: box.scrollHeight,
		clientHeight: box.clientHeight,
		atTop: box.scrollTop <= 1,
		atBottom: box.scrollTop + box.clientHeight >= box.scrollHeight - 2,
	});

	async function scroll({ selector, to = "bottom", by, wait = 1500, count } = {}) {
		const box = boxOf(selector);
		const counted = () => (count ? document.querySelectorAll(count).length : undefined);
		const before = { ...where(box), count: counted() };
		if (by) box.scrollTop += by;
		else box.scrollTop = to === "top" ? 0 : box.scrollHeight;
		const moved = where(box);
		await new Promise((done) => setTimeout(done, Math.min(Number(wait) || 0, 30_000)));
		return { box: signature(box), before, moved, after: { ...where(box), count: counted() } };
	}

	// how far a whole read is (kit readWhole), without touching the page
	const progress = () => globalThis.SaveMyChat?.progress ?? null;

	const TOOLS = { outline, query, element, snapshot, highlight, clear, point, scroll, progress, picks: () => picks };

	globalThis.SaveMyChatDebug = {
		// what debug/background.js calls through scripting.executeScript: a name and its arguments
		async run(name, args) {
			try {
				if (!Object.hasOwn(TOOLS, name)) throw new Error(`no page tool ${name}`);
				return { result: await TOOLS[name](args ?? {}) };
			} catch (error) {
				return { error: String(error?.message || error) };
			}
		},
		signature,
		pathOf,
		suggest,
	};
})();
