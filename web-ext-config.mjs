// web-ext reads this from the project root: https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
export default {
	sourceDir: "src",
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
