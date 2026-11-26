import { describe, expect, it } from "vitest";
import { higher, matches, next } from "../scripts/version.mjs";

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
});
