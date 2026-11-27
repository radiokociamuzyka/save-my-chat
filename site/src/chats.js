// What the site says of the webapps, from resources/data/chats.yaml (PP2).
// Read through imports, built in by Vite: a path from import.meta.url would point into the build.
import { parse } from "yaml";
import pkg from "../../package.json";
import YAML from "../../resources/data/chats.yaml?raw";

export const REPO = "https://github.com/radiokociamuzyka/save-my-chat";
export const DOCS = "https://save-my-chat.readthedocs.io/en/latest/";
export const AMO = "https://addons.mozilla.org/firefox/addon/save-my-chat/";

export function chats(text = YAML) {
	return parse(text).chats;
}

// the readers shipped, each with its conversations' addresses (a `*` written as an ellipsis);
// an optional one works once allowed on its webapp, in the Readers tab (phase 5)
export function shipped(list) {
	return list
		.filter((c) => c.status === "default" || c.status === "optional")
		.map((c) => ({
			name: c.name,
			addresses: (c.chats ?? []).map((a) => a.replaceAll("*", "…")),
			state:
				(c.verified ? "checked on live chats" : "not yet checked on a live chat") +
				(c.status === "optional" ? "; allowed by you in the Readers tab" : ""),
		}));
}

export const planned = (list) =>
	list
		.filter((c) => c.status === "planned")
		.map((c) => c.name)
		.join(", ");

export const version = () => pkg.version;
