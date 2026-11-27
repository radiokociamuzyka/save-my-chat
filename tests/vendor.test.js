// src/vendor/ is gathered from node_modules by scripts/vendor.mjs (Q10): every
// dependency of package.json, its files named in package.json "vendor", unchanged.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plan } from "../scripts/vendor.mjs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

describe("vendored libraries", () => {
	it("every dependency is packed, nothing else", () => {
		expect(() => plan({ dependencies: { a: "1" }, vendor: {} })).toThrow(/a: a dependency with no "vendor" entry/);
		expect(() => plan({ dependencies: {}, vendor: { b: { x: "x" } } })).toThrow(/b: a "vendor" entry/);
		const packed = new Set(plan(pkg).map((c) => c.from.split("/")[1]));
		expect([...packed].sort()).toEqual(Object.keys(pkg.dependencies).sort());
	});

	for (const { from, to } of plan(pkg)) {
		it(`${to} is ${from} unchanged`, () => {
			expect(readFileSync(to, "utf8") === readFileSync(from, "utf8")).toBe(true);
		});
	}
});
