// web-ext reads this from the project root: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
export default {
	// the build (Q12, vite.config.mjs): the pages built from Vue, the rest of src/ as it is
	sourceDir: "dist/extension",
	artifactsDir: "dist",
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
