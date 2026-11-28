// Samples of the webapps' pages (Sett, RR8): public shares the user chose, listed in
// resources/samples/.map.json, each saved into resources/samples/DN_<host>/<name>/ with
// what the reader read from it - what we expect to gather from there later.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const SAMPLES = new URL("../../resources/samples/", import.meta.url).pathname;

// every address the map holds, whatever its shape: Sett's to choose
export function listed(map) {
	const out = new Set();
	const walk = (v) => {
		if (typeof v === "string" && /^https?:\/\//.test(v)) out.add(clean(v));
		else if (Array.isArray(v)) v.forEach(walk);
		else if (v && typeof v === "object") Object.values(v).forEach(walk);
	};
	walk(map);
	return out;
}

const clean = (url) => {
	const u = new URL(url);
	u.hash = "";
	return u.href;
};

export const masked = (text) => String(text).replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "someone@example.invalid");

export function save({ url, title, html, read }, name, dir = SAMPLES) {
	const mapFile = join(dir, ".map.json");
	if (!existsSync(mapFile)) throw new Error("no resources/samples/.map.json: the user lists the public shares there");
	if (!listed(JSON.parse(readFileSync(mapFile, "utf8"))).has(clean(url)))
		throw new Error(`${url} is not in resources/samples/.map.json: only the shares listed there are sampled`);
	if (!/^[\w.-]+$/.test(String(name))) throw new Error("name: letters, digits, . _ - only");
	const folder = join(dir, `DN_${new URL(url).host}`, name);
	mkdirSync(folder, { recursive: true });
	writeFileSync(join(folder, "page.html"), masked(html));
	const about = { url, title: masked(title), sampled: new Date().toISOString(), read: read ?? null };
	writeFileSync(join(folder, "read.json"), `${masked(JSON.stringify(about, null, "\t"))}\n`);
	return { folder: folder.slice(folder.indexOf("resources/")), files: ["page.html", "read.json"] };
}
