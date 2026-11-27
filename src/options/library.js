// The library (PP1) in the options page: what was saved, searched, saved again,
// forgotten. Plain DOM until the frontend's form is decided (Q12).
(async () => {
	const list = document.getElementById("library");
	const search = document.getElementById("library-search");
	const said = document.getElementById("library-status");
	const ask = (msg) => browser.runtime.sendMessage(msg);

	async function render() {
		const entries = await ask({ type: "save-my-chat:library", query: search.value });
		list.replaceChildren();
		if (!entries.length)
			said.textContent = search.value
				? "Nothing saved matches that."
				: "Nothing saved yet: the chats you save appear here.";
		else said.textContent = `${entries.length} saved.`;
		for (const e of entries) {
			const li = document.createElement("li");
			const title = document.createElement("a");
			title.href = e.url;
			title.textContent = e.title;
			title.target = "_blank";
			title.rel = "noreferrer";
			const about = document.createElement("span");
			about.className = "built-in";
			about.textContent = ` ${e.service}, ${e.turns} messages, saved ${new Date(e.savedAt).toLocaleString()}${
				e.saves > 1 ? ` (${e.saves} times)` : ""
			} `;
			const md = button("Markdown", () => ask({ type: "save-my-chat:library-save", key: e.key, as: "md" }));
			const json = button("JSON", () => ask({ type: "save-my-chat:library-save", key: e.key, as: "json" }));
			const forget = button("Forget", async () => {
				await ask({ type: "save-my-chat:library-forget", key: e.key });
				await render();
			});
			li.append(title, about, md, " ", json, " ", forget);
			list.append(li);
		}
	}

	function button(text, act) {
		const b = document.createElement("button");
		b.type = "button";
		b.textContent = text;
		b.addEventListener("click", act);
		return b;
	}

	search.addEventListener("input", render);
	await render();
})();
