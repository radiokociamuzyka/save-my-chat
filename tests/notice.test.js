// THIRD-PARTY.md (scripts/notice.mjs; almanac: licenses-met): what the build holds,
// with each license; a license not looked at yet stops the build.
import { describe, expect, it } from "vitest";
import { facts, licensesOf, notice, packageOf } from "../scripts/notice.mjs";

const pkg = (name, license, version = "1.0.0") => ({ name, version, license, source: `https://github.com/x/${name}` });

describe("the third-party notice", () => {
	it("finds the innermost package of a module's path", () => {
		expect(packageOf("/r/node_modules/isomorphic-git/node_modules/@zenfs/core/dist/a.js")).toBe("@zenfs/core");
		expect(packageOf("/r/node_modules/pako/lib/zlib.js")).toBe("pako");
		expect(packageOf("/r/src/options/main.js")).toBeNull();
		expect(licensesOf("(MIT AND Zlib)")).toEqual(["MIT", "Zlib"]);
	});

	it("reads a package's version, license and source from node_modules", () => {
		const zenfs = facts("node_modules/@zenfs/core/dist/index.js");
		expect(zenfs).toMatchObject({ name: "@zenfs/core", license: "LGPL-3.0-or-later" });
		expect(zenfs.source).toBe("https://github.com/zen-fs/core");
	});

	it("lists each package once, and says what the LGPL asks only when one is in", () => {
		const plain = notice([pkg("marked", "MIT"), pkg("marked", "MIT"), pkg("pako", "(MIT AND Zlib)")]);
		expect(plain.match(/^- marked/gm)).toHaveLength(1);
		expect(plain).not.toMatch(/LGPL/);
		const lgpl = notice([pkg("marked", "MIT"), pkg("@zenfs/core", "LGPL-3.0-or-later", "2.9.0")]);
		expect(lgpl).toMatch(/@zenfs\/core is used in it and covered by the/);
		expect(lgpl).toMatch(/licenses\/GPL-3\.0\.txt/);
		expect(lgpl).toMatch(/- @zenfs\/core 2\.9\.0, LGPL-3\.0-or-later - source: .*\(version 2\.9\.0\)/);
	});

	it("stops at a license not looked at yet", () => {
		expect(() => notice([pkg("strong", "GPL-3.0-only")])).toThrow(/strong@1\.0\.0 GPL-3\.0-only/);
		expect(() => notice([pkg("either", "(MIT OR GPL-3.0)")])).toThrow(/not yet looked at/);
	});
});
