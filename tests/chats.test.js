// resources/data/chats.yaml declares the chat webapps (PP2); the extension's
// list of default readers and its host permissions must follow it.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { outputs } from "../scripts/chats.mjs";
import { KIT, load } from "./load.js";

const { chats } = parse(readFileSync("resources/data/chats.yaml", "utf8"));
const manifest = JSON.parse(readFileSync("src/manifest.json", "utf8"));

describe("chats.yaml", () => {
	it("gives every chat an id once, a name, a status and match patterns", () => {
		const ids = chats.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const c of chats) {
			expect(c.name, c.id).toBeTruthy();
			expect(["default", "optional", "planned"], c.id).toContain(c.status);
			if (c.status !== "planned") expect(c.reader, c.id).toBe(`readers/${c.id}.js`);
			expect(c.matches.length, c.id).toBeGreaterThan(0);
			for (const m of c.matches) expect(c.domains, `${c.id}: ${m}`).toContain(new URL(m.replace("*", "")).host);
		}
	});

	it("is what src/core/readers.js ships, in the same order", () => {
		const defaults = load([...KIT, "core/readers.js"]).SaveMyChat.defaults;
		const declared = chats.filter((c) => c.status !== "planned");
		expect(defaults.map(({ id, name, matches, file, optional }) => ({ id, name, matches, file, optional }))).toEqual(
			declared.map(({ id, name, matches, reader, status }) => ({
				id,
				name,
				matches,
				file: reader,
				optional: status === "optional" || undefined,
			})),
		);
	});

	it("asks host permissions for the default readers at install, an optional one's only when turned on", () => {
		const of = (status) =>
			chats.filter((c) => c.status === status).flatMap((c) => c.domains.map((d) => `https://${d}/*`));
		expect([...manifest.host_permissions].sort()).toEqual([...new Set(of("default"))].sort());
		expect([...manifest.optional_host_permissions].sort()).toEqual(
			[...new Set(["https://api.github.com/*", ...of("optional")])].sort(),
		);
	});

	it("readers.js and the manifest are what scripts/chats.mjs writes (npm run chats)", () => {
		for (const [path, text] of Object.entries(outputs())) expect(readFileSync(path, "utf8"), path).toBe(text);
	});
});
