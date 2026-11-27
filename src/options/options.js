// Readers on and off, and each reader's selector overrides. The background
// re-registers readers when "disabled" changes; overrides are read from
// storage.local ("selectors": { <reader id>: { <part>: [css, ...] } }) at each
// save, so they need no re-registration.
(async () => {
	const SMC = globalThis.SaveMyChat;
	const list = document.getElementById("readers");
	const { disabled = [], selectors = {} } = await browser.storage.local.get(["disabled", "selectors"]);

	// the default readers' files, loaded here only to learn their built-in selectors
	await Promise.all(
		SMC.defaults
			.filter((r) => !SMC.readers.has(r.id))
			.map(
				(r) =>
					new Promise((done) => {
						const script = document.createElement("script");
						script.src = `../${r.file}`;
						script.onload = script.onerror = done;
						document.body.append(script);
					}),
			),
	);

	const valid = (css) => {
		try {
			document.querySelector(css);
			return true;
		} catch {
			return false;
		}
	};

	for (const r of SMC.defaults) {
		const li = document.createElement("li");
		const label = document.createElement("label");
		const box = document.createElement("input");
		box.type = "checkbox";
		box.checked = !disabled.includes(r.id);
		box.addEventListener("change", async () => {
			const { disabled: now = [] } = await browser.storage.local.get("disabled");
			const next = box.checked ? now.filter((id) => id !== r.id) : [...new Set([...now, r.id])];
			await browser.storage.local.set({ disabled: next });
		});
		const where = document.createElement("code");
		where.textContent = r.matches.join(", ");
		label.append(box, ` ${r.name} `, where);
		li.append(label);

		const built = SMC.readers.get(r.id)?.selectors || {};
		const parts = Object.keys(built);
		if (parts.length) li.append(editor(r.id, built, selectors[r.id] || {}));
		list.append(li);
	}

	function editor(id, built, own) {
		const details = document.createElement("details");
		details.open = Object.keys(own).length > 0;
		const summary = document.createElement("summary");
		summary.textContent = "Selectors";
		details.append(summary);
		const areas = {};
		for (const [part, defaults] of Object.entries(built)) {
			const set = document.createElement("fieldset");
			const legend = document.createElement("legend");
			legend.textContent = part;
			const area = document.createElement("textarea");
			area.rows = 2;
			area.placeholder = "your selectors, one per line";
			area.value = [].concat(own[part] || []).join("\n");
			const shipped = document.createElement("div");
			shipped.className = "built-in";
			shipped.textContent = `built in: ${defaults.join("  |  ")}`;
			set.append(legend, area, shipped);
			details.append(set);
			areas[part] = area;
		}
		const save = document.createElement("button");
		save.type = "button";
		save.textContent = "Save selectors";
		const reset = document.createElement("button");
		reset.type = "button";
		reset.textContent = "Back to built-in";
		const status = document.createElement("span");
		status.setAttribute("role", "status");
		details.append(save, " ", reset, " ", status);

		save.addEventListener("click", async () => {
			const mine = {};
			const bad = [];
			for (const [part, area] of Object.entries(areas)) {
				const lines = area.value
					.split("\n")
					.map((s) => s.trim())
					.filter(Boolean);
				bad.push(...lines.filter((css) => !valid(css)).map((css) => `${part}: ${css}`));
				if (lines.length) mine[part] = lines;
			}
			if (bad.length) {
				status.className = "invalid";
				status.textContent = `Not valid CSS: ${bad.join("; ")}`;
				return;
			}
			await store(id, mine);
			status.className = "";
			status.textContent = Object.keys(mine).length ? "Saved." : "Saved: built-in only.";
		});
		reset.addEventListener("click", async () => {
			for (const area of Object.values(areas)) area.value = "";
			await store(id, {});
			status.className = "";
			status.textContent = "Built-in only.";
		});
		return details;
	}

	async function store(id, mine) {
		const { selectors: now = {} } = await browser.storage.local.get("selectors");
		if (Object.keys(mine).length) now[id] = mine;
		else delete now[id];
		await browser.storage.local.set({ selectors: now });
	}
})();
