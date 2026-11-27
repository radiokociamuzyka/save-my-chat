// Gathering (phase 5, Sett 2026-11-27: "listing of available chats and gathering them
// all one by one"): the chats a webapp's page lists, each opened in a window of its own,
// read by its reader into the library, one at a time; the window closed at the end.
// It runs in the options page, an extension tab Firefox never suspends (the event page
// may be, between events). Nothing is sent anywhere: the webapp's own pages are loaded,
// as when the user opens them, and what is read stays in the library.
//
// What the popup hands over, in storage.local "gathering":
//   { reader, name, from, chats: [{ url, title, savedAt }] }

export const KEY = "gathering";
const READY = 30_000; // a page that is not loaded and read by then is given up
const POLL = 1500;
const PAUSE = 1000; // between two chats: one page at a time, not a burst

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// how many messages the reader sees in a tab, by "inspect" (counts, no text)
const counted = (seen) => Object.values(seen?.turns ?? {}).reduce((a, b) => a + b, 0);

// Firefox's side, as the options page reaches it: a window, and the background's reader.
// The chats open in a window of their own, one tab reused: a tab in the background of
// the user's window is never shown, and a webapp may not draw its chat there (RR7: no
// messages read on ChatGPT, Claude, Gemini); the one tab of a window is.
export function firefox(browser = globalThis.browser, { ready = READY, poll = POLL, pause = PAUSE } = {}) {
	const ask = (msg) => browser.runtime.sendMessage(msg);
	let win = null;
	const loaded = new Set(); // tabs heard "complete" since they were last sent somewhere

	function heard(id, change) {
		if (change.status === "complete") loaded.add(id);
	}

	// resolved when the tab has loaded, or rejected after `ready`
	async function until(tabId) {
		for (const end = Date.now() + ready; Date.now() < end; await sleep(100)) if (loaded.has(tabId)) return;
		throw new Error("the page did not load");
	}

	async function open(url) {
		if (!browser.tabs.onUpdated.hasListener?.(heard)) browser.tabs.onUpdated.addListener(heard);
		let tabId = win?.tabs[0].id;
		if (win) {
			loaded.delete(tabId);
			// the window closed by the user meanwhile: a new one
			if (!(await browser.tabs.update(tabId, { url }).catch(() => null))) win = null;
		}
		if (!win) {
			win = await browser.windows.create({ url, focused: false });
			tabId = win.tabs[0].id;
		}
		await until(tabId);
		return tabId;
	}

	// A webapp draws its chat after the page loads, and a long one brings its older
	// messages as it is scrolled up (RR7): the page is scrolled to the top until no more
	// come, then asked until the reader sees the same messages twice, then read.
	async function collect(tabId) {
		let before = 0;
		let scrolled = false;
		for (let end = Date.now() + ready; Date.now() < end; await sleep(poll)) {
			const now = counted(await ask({ type: "save-my-chat:inspect", tabId }));
			if (now && !scrolled) {
				await ask({ type: "save-my-chat:load", tabId }); // as long as the chat takes
				scrolled = true;
				end = Date.now() + ready;
				continue;
			}
			if (now && now === before) return ask({ type: "save-my-chat:collect", tabId });
			before = now;
		}
		throw new Error(before ? "the chat kept changing" : "the reader saw no messages");
	}

	const close = async () => {}; // the tab is reused for the next chat
	async function finish() {
		browser.tabs.onUpdated.removeListener(heard);
		if (win) await browser.windows.remove(win.id).catch(() => {});
		win = null;
	}
	return { open, collect, close, finish, pause: () => sleep(pause) };
}

// Each chat in turn; on(chat, state, detail) says how it went:
//   "reading" | "done" (what collect gave) | "failed" (why) | "stopped"
// stopped() is asked before each one.
export async function gather(chats, io, on = () => {}, stopped = () => false) {
	const done = [];
	for (const [i, chat] of chats.entries()) {
		if (stopped()) {
			for (const left of chats.slice(i)) on(left, "stopped");
			break;
		}
		on(chat, "reading");
		let tabId = null;
		try {
			tabId = await io.open(chat.url);
			const got = await io.collect(tabId);
			done.push(got);
			on(chat, "done", got);
		} catch (error) {
			on(chat, "failed", String(error?.message || error));
		} finally {
			if (tabId !== null) await io.close(tabId);
		}
		if (i < chats.length - 1) await io.pause();
	}
	await io.finish?.();
	return done;
}
