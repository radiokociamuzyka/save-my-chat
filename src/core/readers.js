// Written by scripts/chats.mjs from resources/data/chats.yaml (Q10): edit the YAML,
// then `npm run chats` (or `task build`). The default readers shipped with the
// extension; the background registers each enabled one as a content script,
// core/kit.js first, then its file. Their hosts are the manifest's host_permissions.
(() => {
	globalThis.SaveMyChat.defaults = [
		{
			id: "google-ai-mode",
			name: "Google Search, AI Mode",
			matches: ["https://www.google.com/search*"],
			file: "readers/google-ai-mode.js",
		},
		{
			id: "github-copilot",
			name: "GitHub Copilot",
			matches: ["https://github.com/copilot*"],
			file: "readers/github-copilot.js",
		},
	];
})();
