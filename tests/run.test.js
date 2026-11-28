// `task run`'s web-ext arguments (RR9): a profile kept in the project, where a snap's
// Firefox can see it, unless the user names one.
import { describe, expect, it } from "vitest";
import { PROFILE, webExtArgs } from "../scripts/run.mjs";

describe("task run", () => {
	it("runs Firefox on the profile kept in dist/, made if missing", () => {
		expect(PROFILE).toMatch(/\/dist\/firefox-profile$/);
		expect(webExtArgs(["--verbose"])).toEqual([
			"run",
			"--firefox-profile",
			PROFILE,
			"--profile-create-if-missing",
			"--keep-profile-changes",
			"--verbose",
		]);
	});

	it("uses the profile the user names instead", () => {
		expect(webExtArgs(["-p", "dev"])).toEqual(["run", "-p", "dev"]);
		expect(webExtArgs(["--firefox-profile=/x"])).toEqual(["run", "--firefox-profile=/x"]);
	});
});
