// Written by scripts/chats.mjs from resources/data/chats.yaml (Q10): edit the YAML,
// then `npm run chats` (or `task build`). The default readers shipped with the
// extension; the background registers each enabled one as a content script,
// core/kit.js first, then its file. A default's hosts are the manifest's host_permissions;
// an optional one's (origins) are asked when the user turns it on, in the Readers tab.
// chats: the addresses of one conversation, how the links a page lists are found.
(() => {
	globalThis.SaveMyChat.defaults = [
		{
			id: "google-ai-mode",
			name: "Google Search, AI Mode",
			matches: ["https://www.google.com/search*"],
			chats: ["https://www.google.com/search?*udm=50*"],
			file: "readers/google-ai-mode.js",
		},
		{
			id: "github-copilot",
			name: "GitHub Copilot",
			matches: ["https://github.com/copilot*"],
			chats: ["https://github.com/copilot/c/*"],
			file: "readers/github-copilot.js",
		},
		{
			id: "chatgpt",
			name: "ChatGPT",
			matches: ["https://chatgpt.com/*"],
			chats: ["https://chatgpt.com/c/*", "https://chatgpt.com/g/*/c/*"],
			optional: true,
			origins: ["https://chatgpt.com/*"],
			file: "readers/chatgpt.js",
		},
		{
			id: "claude",
			name: "Claude",
			matches: ["https://claude.ai/*"],
			chats: ["https://claude.ai/chat/*"],
			optional: true,
			origins: ["https://claude.ai/*"],
			file: "readers/claude.js",
		},
		{
			id: "gemini",
			name: "Gemini",
			matches: ["https://gemini.google.com/*"],
			chats: ["https://gemini.google.com/app/*"],
			optional: true,
			origins: ["https://gemini.google.com/*"],
			file: "readers/gemini.js",
		},
	];
})();
