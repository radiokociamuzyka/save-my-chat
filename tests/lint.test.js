import { describe, expect, it } from "vitest";
import { KNOWN, sort } from "../scripts/lint.mjs";

const known = { _type: "warning", code: KNOWN[0].code, file: KNOWN[0].file, message: KNOWN[0].message };

describe("lint: known false positives", () => {
	it("excuses a known finding once, exactly as listed", () => {
		expect(sort([known])).toMatchObject({ failing: [], gone: [] });
		expect(sort([known, known]).failing).toEqual([known]);
		const elsewhere = { ...known, file: "options/prototypes.js" };
		expect(sort([known, elsewhere]).failing).toEqual([elsewhere]);
		const other = { ...known, message: '"userScripts.execute" has been removed' };
		expect(sort([known, other]).failing).toEqual([other]);
	});

	it("fails anything else, and a known one the linter no longer says", () => {
		const error = { _type: "error", code: "JS_SYNTAX_ERROR", file: "x.js", message: "x" };
		expect(sort([known, error]).failing).toEqual([error]);
		expect(sort([]).gone.map((k) => k.code)).toEqual(["UNSUPPORTED_API"]);
	});
});
