// Every commit message is a conventional commit: <type>(<scope>): <subject>
// One finished step of docs/devlog/TODO.md is one commit (the craft loop of BOS).
// "merge" is the type of a dev/<name> branch landing in development with --no-ff.
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			["build", "chore", "ci", "docs", "feat", "fix", "merge", "perf", "refactor", "revert", "style", "test"],
		],
		"header-max-length": [2, "always", 100],
		"body-max-line-length": [0],
		"footer-max-line-length": [0],
		"subject-case": [0],
	},
};
