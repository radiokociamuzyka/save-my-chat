// Prototypes (phase 3): the user's own copy of a default reader, edited here,
// kept in storage.local ("prototypes": { <id>: { id, name, from, matches, code,
// enabled } }) and run by the background through the userScripts API, in place
// of the default it was copied from. The permission is optional and asked here,
// on the user's click (rule 5: the code runs as a user script, never evaluated
// by the extension itself).
(async () => {
	const SMC = globalThis.SaveMyChat;
	const FORMAT = "save-my-chat/prototypes/0";
	const allow = document.getElementById("allow");
	const allowed = document.getElementById("allowed");
	const list = document.getElementById("prototypes");
	const exporter = document.getElementById("export");
	const importer = document.getElementById("import");
	const said = document.getElementById("prototypes-status");

	const stored = async () => (await browser.storage.local.get("prototypes")).prototypes || {};
	const keep = (all) => browser.storage.local.set({ prototypes: all });

	async function permission() {
		const has = await browser.permissions.contains({ permissions: ["userScripts"] });
		allow.hidden = has;
		allowed.textContent = has
			? "User scripts are allowed: your enabled prototypes run in place of their defaults."
			: "Prototypes run as user scripts, which Firefox asks you to allow once. Until then the defaults run.";
		return has;
	}

	allow.addEventListener("click", async () => {
		// the request comes first in the click, as Firefox wants it
		await browser.permissions.request({ permissions: ["userScripts"] });
		await permission();
	});

	// a pattern the extension may run on: of a site in its host permissions
	async function reachable(pattern) {
		const m = /^(\*|https?):\/\/([^/]+)\//.exec(pattern);
		if (!m) return false;
		return browser.permissions.contains({ origins: [`${m[1]}://${m[2]}/*`] });
	}

	async function render() {
		const all = await stored();
		list.replaceChildren();
		for (const r of SMC.defaults) {
			const li = document.createElement("li");
			const proto = Object.values(all).find((p) => (p.from ?? p.id) === r.id);
			if (proto) li.append(editor(proto));
			else {
				const copy = document.createElement("button");
				copy.type = "button";
				copy.textContent = `Make a prototype of ${r.name}`;
				copy.addEventListener("click", async () => {
					const code = await (await fetch(`../${r.file}`)).text();
					const now = await stored();
					now[r.id] = { id: r.id, name: r.name, from: r.id, matches: r.matches, code, enabled: true };
					await keep(now);
					await render();
				});
				li.append(copy);
			}
			list.append(li);
		}
	}

	function editor(proto) {
		const box = document.createElement("fieldset");
		const legend = document.createElement("legend");
		legend.textContent = `${proto.name}, your prototype`;
		const on = document.createElement("label");
		const enabled = document.createElement("input");
		enabled.type = "checkbox";
		enabled.checked = proto.enabled;
		on.append(enabled, " runs in place of the default");
		const where = document.createElement("label");
		where.className = "block";
		const matches = document.createElement("textarea");
		matches.rows = 2;
		matches.value = proto.matches.join("\n");
		where.append("Pages it runs on (match patterns, one per line)", matches);
		const what = document.createElement("label");
		what.className = "block";
		const code = document.createElement("textarea");
		code.className = "code";
		code.rows = 24;
		code.spellcheck = false;
		code.value = proto.code;
		what.append("Its code: a SaveMyChat.reader({...}) like the default's", code);
		const save = button("Save");
		const drop = button("Delete");
		const status = document.createElement("span");
		status.setAttribute("role", "status");
		box.append(legend, on, where, what, save, " ", drop, " ", status);

		save.addEventListener("click", async () => {
			const patterns = matches.value
				.split("\n")
				.map((s) => s.trim())
				.filter(Boolean);
			const bad = [];
			for (const p of patterns) if (!(await reachable(p))) bad.push(p);
			if (!patterns.length || bad.length) {
				status.className = "invalid";
				status.textContent = patterns.length
					? `Not a site this extension may read: ${bad.join(", ")}`
					: "It needs at least one pattern.";
				return;
			}
			if (!/SaveMyChat\.reader\s*\(/.test(code.value)) {
				status.className = "invalid";
				status.textContent = "The code registers no reader: it needs SaveMyChat.reader({...}).";
				return;
			}
			const now = await stored();
			now[proto.id] = { ...proto, matches: patterns, code: code.value, enabled: enabled.checked };
			await keep(now);
			status.className = "";
			status.textContent = "Saved. Reload the chat's page to run it.";
		});
		enabled.addEventListener("change", async () => {
			const now = await stored();
			if (!now[proto.id]) return;
			now[proto.id].enabled = enabled.checked;
			await keep(now);
			status.className = "";
			status.textContent = enabled.checked ? "On: reload the chat's page." : "Off: the default runs again.";
		});
		drop.addEventListener("click", async () => {
			const now = await stored();
			delete now[proto.id];
			await keep(now);
			await render();
		});
		return box;
	}

	function button(text) {
		const b = document.createElement("button");
		b.type = "button";
		b.textContent = text;
		return b;
	}

	// ---- export and import, as a JSON file --------------------------------

	exporter.addEventListener("click", async () => {
		const all = Object.values(await stored());
		const file = new Blob([`${JSON.stringify({ format: FORMAT, prototypes: all }, null, "\t")}\n`], {
			type: "application/json",
		});
		const a = document.createElement("a");
		a.href = URL.createObjectURL(file);
		a.download = "save-my-chat-prototypes.json";
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
		said.textContent = `${all.length} exported.`;
	});

	// a prototype as a file may hold: nothing else is kept
	function valid(p) {
		return (
			p &&
			typeof p.id === "string" &&
			/^[\w-]+$/.test(p.id) &&
			typeof p.name === "string" &&
			typeof p.code === "string" &&
			Array.isArray(p.matches) &&
			p.matches.every((m) => typeof m === "string")
		);
	}

	importer.addEventListener("change", async () => {
		const [file] = importer.files;
		if (!file) return;
		let data;
		try {
			data = JSON.parse(await file.text());
		} catch {
			data = null;
		}
		if (data?.format !== FORMAT || !Array.isArray(data.prototypes)) {
			said.textContent = `Not a file of prototypes (${FORMAT}).`;
			return;
		}
		const now = await stored();
		const taken = data.prototypes.filter(valid);
		for (const p of taken)
			now[p.id] = {
				id: p.id,
				name: p.name,
				from: typeof p.from === "string" ? p.from : p.id,
				matches: p.matches,
				code: p.code,
				enabled: false, // an imported prototype runs only once the user turns it on
			};
		await keep(now);
		said.textContent = `${taken.length} imported, turned off: look at each, then turn it on.${
			taken.length < data.prototypes.length ? ` ${data.prototypes.length - taken.length} skipped as broken.` : ""
		}`;
		importer.value = "";
		await render();
	});

	await permission();
	await render();
})();
