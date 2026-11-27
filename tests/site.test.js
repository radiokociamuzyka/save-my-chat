// What the public site (Q13) says of the webapps, from resources/data/chats.yaml.
import { describe, expect, it } from "vitest";
import { chats, planned, shipped, version } from "../site/src/chats.js";

const LIST = [
	{ name: "A & B", status: "default", chats: ["https://a.example/c/*"], verified: true },
	{ name: "C", status: "default", chats: ["https://c.example/*"], verified: false },
	{ name: "D", status: "planned" },
	{ name: "E", status: "planned" },
];

describe("the site: the webapps", () => {
	it("lists each reader shipped with its addresses and state, and the planned ones", () => {
		expect(shipped(LIST)).toEqual([
			{ name: "A & B", addresses: ["https://a.example/c/…"], state: "checked on live chats" },
			{ name: "C", addresses: ["https://c.example/…"], state: "not yet checked on a live chat" },
		]);
		expect(planned(LIST)).toBe("D, E");
	});

	it("reads chats.yaml and the version as built in", () => {
		expect(shipped(chats()).length).toBeGreaterThan(0);
		expect(version()).toMatch(/^\d+\.\d+\.\d+$/);
	});
});
