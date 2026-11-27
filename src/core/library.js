// The library (PP1, phase 4): what was saved, kept in storage.local so it can be
// found, searched, saved again, and so a chat that grew since is noticed. Only in
// the background. Nothing of it leaves the machine (rule 4).
//   "library"     { <key>: entry }   the index, small: read whole for a list
//   "chat:<key>"  conversation       the last saved copy of each, read one at a time
// An entry: { key, title, reader, service, url, turns, firstSavedAt, savedAt, saves }.
// A chat's key is its reader and its address: saved again, the same chat is one entry.
(() => {
	const SMC = globalThis.SaveMyChat;

	const keyOf = (c) => `${c.source.reader} ${c.source.url}`;

	function library(storage = globalThis.browser?.storage.local) {
		const index = async () => (await storage.get("library")).library || {};

		// a conversation just saved: its entry made or brought up to date, its copy kept
		async function record(c) {
			const key = keyOf(c);
			const all = await index();
			const old = all[key];
			all[key] = {
				key,
				title: c.title,
				reader: c.source.reader,
				service: c.source.service,
				url: c.source.url,
				turns: c.turns.length,
				firstSavedAt: old?.firstSavedAt ?? c.savedAt,
				savedAt: c.savedAt,
				saves: (old?.saves ?? 0) + 1,
			};
			await storage.set({ library: all, [`chat:${key}`]: c });
			return all[key];
		}

		// newest first; a query keeps the entries whose title, service or text holds every word of it
		async function list(query = "") {
			const all = Object.values(await index()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
			const words = query.toLowerCase().split(/\s+/).filter(Boolean);
			if (!words.length) return all;
			const found = [];
			for (const entry of all) {
				const c = await chat(entry.key);
				const text = [entry.title, entry.service, ...(c?.turns || []).map((t) => t.text)].join("\n").toLowerCase();
				if (words.every((w) => text.includes(w))) found.push(entry);
			}
			return found;
		}

		async function chat(key) {
			const name = `chat:${key}`;
			return (await storage.get(name))[name] ?? null;
		}

		// what the page holds now against the last copy saved: null when never saved
		async function since(reader, url, turns) {
			const entry = (await index())[`${reader} ${url}`];
			if (!entry) return null;
			return { savedAt: entry.savedAt, saved: entry.turns, now: turns, grew: Math.max(0, turns - entry.turns) };
		}

		async function forget(key) {
			const all = await index();
			delete all[key];
			await storage.set({ library: all });
			await storage.remove(`chat:${key}`);
		}

		return { record, list, chat, since, forget };
	}

	SMC.library = library;
	SMC.libraryKey = keyOf;
})();
