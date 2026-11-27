import { describe, expect, it } from "vitest";
import { higher, matches, next, withVersion } from "../scripts/version.mjs";

describe("one version, bumped per commit", () => {
	it("bumps Z for a commit, Y for a phase, X for a flip", () => {
		expect(next("0.1.9", "patch")).toBe("0.1.10");
		expect(next("0.1.9", "minor")).toBe("0.2.0");
		expect(next("0.1.9", "major")).toBe("1.0.0");
	});

	it("keeps the higher of two branches' versions, numerically", () => {
		expect(higher("0.1.10", "0.1.9")).toBe("0.1.10");
		expect(higher("0.2.0", "0.1.30")).toBe("0.2.0");
	});

	it("bumps on dev/* branches only", () => {
		expect(matches("dev/Cleo", "dev/*")).toBe(true);
		expect(matches("development", "dev/*")).toBe(false);
		expect(matches("master", "dev/*")).toBe(false);
	});

	it("the merge driver changes the version only, never the formatting", () => {
		const manifest = '{\n\t"manifest_version": 3,\n\t"version": "0.1.9",\n\t"permissions": ["storage"]\n}\n';
		expect(withVersion(manifest, "0.1.10")).toBe(manifest.replace("0.1.9", "0.1.10"));
		const lock = JSON.stringify(
			{ version: "0.1.9", packages: { "": { version: "0.1.9" }, "node_modules/x": { version: "0.1.9" } } },
			null,
			2,
		);
		const out = JSON.parse(withVersion(lock, "0.2.0"));
		expect([out.version, out.packages[""].version, out.packages["node_modules/x"].version]).toEqual([
			"0.2.0",
			"0.2.0",
			"0.1.9",
		]);
	});
});
