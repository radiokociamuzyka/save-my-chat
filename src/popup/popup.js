// The toolbar button: says which reader sees this tab and saves through the background.
(async () => {
	const state = document.getElementById("state");
	const actions = document.getElementById("actions");
	const result = document.getElementById("result");

	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	const reader = tab ? await browser.runtime.sendMessage({ type: "save-my-chat:present", tabId: tab.id }) : null;

	if (!reader) {
		state.textContent = "No supported chat on this page.";
		return;
	}
	state.textContent = `Reader: ${reader.name}`;
	actions.hidden = false;

	actions.addEventListener("click", async (event) => {
		const as = event.target.dataset?.as;
		if (!as) return;
		result.className = "";
		result.textContent = "Saving…";
		try {
			const done = await browser.runtime.sendMessage({ type: "save-my-chat:save", tabId: tab.id, as });
			result.textContent = `Saved "${done.title}", ${done.turns} messages.`;
			for (const warning of done.warnings) {
				const line = document.createElement("span");
				line.className = "warning";
				line.textContent = warning;
				result.append(document.createElement("br"), line);
			}
		} catch (error) {
			result.className = "error";
			result.textContent = error.message;
		}
	});
})();
