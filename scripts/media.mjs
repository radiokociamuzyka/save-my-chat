// `task media`: the project's images from Sett's media container (resources/media/.index.json,
// a Hugging Face bucket), sized for where they are used (Sett, phase 6, issue #7).
//   1. each file the index names, fetched into resources/media/ when it is not there;
//   2. each size of DERIVED made by ffmpeg into resources/media/derived/ when it is not there
//      (made once, kept: the next run skips it);
//   3. the small ones copied where the builds take them: the extension's icons, the Read the
//      Docs favicon and logo, the site's favicon, header and social image. Those copies are
//      committed, so a build (CI, AMO's reviewers building from source) needs neither the
//      bucket nor ffmpeg; resources/media/ itself keeps only its index and README in git.
//   node scripts/media.mjs [--force]   (--force: make the sizes again)
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const MEDIA = join(ROOT, "resources/media");
const DERIVED = join(MEDIA, "derived");

// what is made of which original: [file in derived/, original, ffmpeg -vf, extra ffmpeg args]
const square = (n) => `scale=${n}:${n}:flags=lanczos`;
export const DERIVED_FILES = [
	...[16, 32, 48, 96, 128].map((n) => [`icon-${n}.png`, "save-my-chat_logo.png", square(n)]),
	["logo-256.png", "save-my-chat_logo.png", square(256)],
	["banner-1280.webp", "save-my-chat_banner.png", "scale=1280:-2:flags=lanczos", ["-quality", "82"]],
	// the social card: 1200 x 630, the banner (2:1) scaled to its width and centred
	[
		"social-1200x630.jpg",
		"save-my-chat_banner.png",
		"scale=1200:-2:flags=lanczos,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black",
		["-q:v", "3"],
	],
	["poster-800.webp", "save-my-chat_poster.png", "scale=800:-2:flags=lanczos", ["-quality", "82"]],
];

// where the builds take them from (committed copies)
export const PLACED = [
	...[16, 32, 48, 96, 128].map((n) => [`icon-${n}.png`, `src/icons/icon-${n}.png`]),
	["icon-32.png", "docs/assets/favicon.png"],
	["logo-256.png", "docs/assets/logo.png"],
	["icon-32.png", "site/public/favicon.png"],
	["banner-1280.webp", "site/public/media/banner.webp"],
	["social-1200x630.jpg", "site/public/media/social.jpg"],
];

export function originals(index) {
	return index.use.flatMap((u) => u.path).map((path) => ({ path, url: `${index.url}/resolve/${path}` }));
}

async function fetchMissing(index) {
	for (const { path, url } of originals(index)) {
		const file = join(MEDIA, path);
		if (existsSync(file)) continue;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${url}: ${response.status}`);
		writeFileSync(file, Buffer.from(await response.arrayBuffer()));
		console.log(`fetched ${path}`);
	}
}

function derive(force) {
	mkdirSync(DERIVED, { recursive: true });
	for (const [name, from, filter, extra = []] of DERIVED_FILES) {
		const out = join(DERIVED, name);
		if (existsSync(out) && !force) continue;
		execFileSync("ffmpeg", ["-v", "error", "-y", "-i", join(MEDIA, from), "-vf", filter, ...extra, out]);
		console.log(`made derived/${name}`);
	}
}

function place() {
	for (const [name, to] of PLACED) {
		const target = join(ROOT, to);
		mkdirSync(dirname(target), { recursive: true });
		copyFileSync(join(DERIVED, name), target);
	}
	console.log(`placed ${PLACED.length} files`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const index = JSON.parse(readFileSync(join(MEDIA, ".index.json"), "utf8"));
	await fetchMissing(index);
	derive(process.argv.includes("--force"));
	place();
}
