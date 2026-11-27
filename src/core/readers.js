// Written by scripts/chats.mjs from resources/data/chats.yaml (Q10): edit the YAML,
// then `npm run chats` (or `task build`). The default readers shipped with the
// extension; the background registers each enabled one as a content script,
// core/kit.js first, then its file. Their hosts are the manifest's host_permissions.
// chats: the addresses of one conversation, how the links a page lists are found.
(() => {
	globalThis.SaveMyChat.defaults = [
		{
			id: "google-ai-mode",
			name: "Google Search, AI Mode",
			matches: ["https://www.google.com/search*"],
			chats: ["https://www.google.com/search?q=*&udm=50*"],
			file: "readers/google-ai-mode.js",
		},
		{
			id: "github-copilot",
			name: "GitHub Copilot",
			matches: ["https://github.com/copilot*"],
			chats: ["https://github.com/copilot/c/*"],
			file: "readers/github-copilot.js",
		},
	];
})();
