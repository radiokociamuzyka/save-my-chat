// Gathering (phase 5, Sett 2026-11-27: "listing of available chats and gathering them
// all one by one"): the chats a webapp's page lists, each opened in a background tab of
// that webapp, read by its reader into the library, the tab closed, one at a time.
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

// Firefox's side, as the options page reaches it: tabs, and the background's reader
export function firefox(browser = globalThis.browser, { ready = READY, poll = POLL, pause = PAUSE } = {}) {
	const ask = (msg) => browser.runtime.sendMessage(msg);

	// a background tab, resolved when it has loaded
	async function open(url) {
		const tab = await browser.tabs.create({ url, active: false });
		await new Promise((done, fail) => {
			const timer = setTimeout(() => {
				browser.tabs.onUpdated.removeListener(heard);
				fail(new Error("the page did not load"));
			}, ready);
			function heard(id, change) {
				if (id !== tab.id || change.status !== "complete") return;
				clearTimeout(timer);
				browser.tabs.onUpdated.removeListener(heard);
				done();
			}
			browser.tabs.onUpdated.addListener(heard);
		});
		return tab.id;
	}

	// A webapp draws its chat after the page loads: asked until the reader sees the same
	// messages twice in a row, then read into the library.
	async function collect(tabId) {
		let before = 0;
		for (const end = Date.now() + ready; Date.now() < end; await sleep(poll)) {
			const now = counted(await ask({ type: "save-my-chat:inspect", tabId }));
			if (now && now === before) return ask({ type: "save-my-chat:collect", tabId });
			before = now;
		}
		throw new Error(before ? "the chat kept changing" : "the reader saw no messages");
	}

	const close = (tabId) => browser.tabs.remove(tabId).catch(() => {});
	return { open, collect, close, pause: () => sleep(pause) };
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
	return done;
}
