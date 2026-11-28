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
		{
			id: "deepseek",
			name: "DeepSeek",
			matches: ["https://chat.deepseek.com/*"],
			chats: ["https://chat.deepseek.com/a/chat/s/*"],
			optional: true,
			origins: ["https://chat.deepseek.com/*"],
			file: "readers/deepseek.js",
		},
		{
			id: "google-ai-studio",
			name: "Google AI Studio",
			matches: ["https://aistudio.google.com/*"],
			chats: ["https://aistudio.google.com/prompts/*"],
			optional: true,
			origins: ["https://aistudio.google.com/*"],
			file: "readers/google-ai-studio.js",
		},
		{
			id: "grok",
			name: "Grok",
			matches: ["https://grok.com/*"],
			chats: ["https://grok.com/c/*"],
			optional: true,
			origins: ["https://grok.com/*"],
			file: "readers/grok.js",
		},
		{
			id: "x-grok",
			name: "Grok on X",
			matches: ["https://x.com/i/grok*"],
			chats: ["https://x.com/i/grok/c/*"],
			optional: true,
			origins: ["https://x.com/*"],
			file: "readers/x-grok.js",
		},
	];
})();
