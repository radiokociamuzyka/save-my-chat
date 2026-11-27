// What the prototypes' panel checks, and the file they travel in (src/options/prototypes.js).
import { describe, expect, it } from "vitest";
import { FORMAT, fileOf, imported, originOf, patternsOf, registers } from "../src/options/prototypes.js";
import { load } from "./load.js";

describe("prototypes: the checks", () => {
	it("knows code that registers a reader, as every default does", () => {
		for (const file of ["readers/google-ai-mode.js", "readers/github-copilot.js"])
			expect(registers(load.source(file))).toBe(true);
		expect(registers("console.log(1)")).toBe(false);
	});

	it("reads patterns one per line, and the origin each needs", () => {
		expect(patternsOf(" a \n\n b\n")).toEqual(["a", "b"]);
		expect(originOf("https://github.com/copilot*")).toBe("https://github.com/*");
		expect(originOf("*://x.org/a")).toBe("*://x.org/*");
		expect(originOf("file:///x")).toBeNull();
	});

	it("keeps of an imported prototype only what it knows, turned off", () => {
		expect(imported({ id: "a", name: "A", matches: ["x"], code: "c", enabled: true, extra: 1 })).toEqual({
			id: "a",
			name: "A",
			from: "a",
			matches: ["x"],
			code: "c",
			enabled: false,
		});
		for (const bad of [
			null,
			{ id: "../a", name: "A", matches: [], code: "" },
			{ id: "a", name: "A", matches: [1], code: "" },
		])
			expect(imported(bad)).toBeNull();
		expect(JSON.parse(fileOf([]))).toEqual({ format: FORMAT, prototypes: [] });
	});
});
