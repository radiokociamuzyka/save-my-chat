// The default readers shipped with the extension. The background registers
// each enabled one as a content script: core/kit.js first, then its file.
// Its matches must be covered by host_permissions in manifest.json.
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
