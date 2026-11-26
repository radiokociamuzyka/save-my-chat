// web-ext reads this from the project root: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
export default {
	sourceDir: "src",
	artifactsDir: "dist",
	// Sett's snippets are sources of readers, not part of the extension (Q5).
	ignoreFiles: ["readers/drafted-snippets"],
	build: {
		overwriteDest: true,
	},
	run: {
		startUrl: ["about:debugging#/runtime/this-firefox"],
	},
	lint: {
		warningsAsErrors: true,
	},
};
