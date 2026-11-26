// Readers on and off. The background re-registers them when "disabled" changes.
(async () => {
	const list = document.getElementById("readers");
	const defaults = await browser.runtime.sendMessage({ type: "save-my-chat:defaults" });
	const { disabled = [] } = await browser.storage.local.get("disabled");

	for (const r of defaults) {
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
		label.append(box, ` ${r.name} `);
		const where = document.createElement("code");
		where.textContent = r.matches.join(", ");
		label.append(where);
		li.append(label);
		list.append(li);
	}
})();
