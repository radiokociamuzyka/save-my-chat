<!-- Gathering (phase 5): the chats a webapp's page listed, handed over by the popup, read
     one by one into the library (gather.js), then the whole library packed into a zip. -->
<script setup>
import { computed, onMounted, ref } from "vue";
import { backup } from "./backup.js";
import { firefox, gather, KEY } from "./gather.js";

const props = defineProps({ io: { type: Object, default: null } }); // tests hand in their own
const SMC = globalThis.SaveMyChat;
const ask = (msg) => browser.runtime.sendMessage(msg);
const when = (iso) => new Date(iso).toLocaleString();

const list = ref(null); // what the popup handed over
const picked = ref({}); // url -> gather it
const states = ref({}); // url -> { state, text }
const running = ref(false);
const said = ref("");
let stop = false;
const halt = () => {
	stop = true;
};

const chosen = computed(() => (list.value?.chats ?? []).filter((c) => picked.value[c.url]));

onMounted(async () => {
	list.value = (await browser.storage.local.get(KEY))[KEY] ?? null;
	// what was never saved is picked; what was, is offered
	for (const c of list.value?.chats ?? []) picked.value[c.url] = !c.savedAt;
});

const pickAll = (on) => {
	for (const c of list.value.chats) picked.value[c.url] = on;
};

function heard(chat, state, detail) {
	const text = {
		reading: "reading...",
		done: () => `gathered, ${detail.turns} ${detail.turns === 1 ? "message" : "messages"}`,
		failed: () => `not gathered: ${detail}`,
		stopped: "stopped",
	}[state];
	states.value[chat.url] = { state, text: typeof text === "function" ? text() : text };
}

async function start() {
	running.value = true;
	stop = false;
	said.value = "";
	const todo = chosen.value;
	const done = await gather(todo, props.io ?? firefox(), heard, () => stop);
	running.value = false;
	const failed = todo.filter((c) => states.value[c.url]?.state === "failed").length;
	said.value = `${done.length} of ${todo.length} gathered into the library${failed ? `, ${failed} not` : ""}.`;
}

async function pack() {
	const n = await backup(ask, { markdown: SMC.toMarkdown, slug: SMC.slug });
	said.value = `${n} ${n === 1 ? "chat" : "chats"} packed into your downloads.`;
}
</script>

<template>
	<section>
		<p class="content">
			A page of a chat webapp lists your conversations, in its sidebar for example. From the toolbar button on such a
			page, <strong>Gather</strong> brings that list here: each chat is opened in a window of its own, scrolled up
			until its older messages are in, and read into the library, one at a time; the window closes at the end.
			Nothing is sent anywhere; the webapp's pages are loaded as when you open them.
		</p>
		<p v-if="list === null" class="gather-status">
			Nothing to gather yet: open a chat webapp, click the toolbar button, then <strong>Gather</strong>.
		</p>
		<template v-else>
			<p class="mb-2 gather-from">
				<strong>{{ list.name }}</strong>: {{ list.chats.length }} {{ list.chats.length === 1 ? "chat" : "chats" }}
				listed on <a :href="list.from" target="_blank" rel="noreferrer">{{ list.from }}</a>
			</p>
			<div class="buttons are-small mb-2">
				<button type="button" class="button" :disabled="running" @click="pickAll(true)">Pick all</button>
				<button type="button" class="button" :disabled="running" @click="pickAll(false)">Pick none</button>
			</div>
			<ul class="mb-3 gather-list">
				<li v-for="c in list.chats" :key="c.url" class="is-size-7">
					<label class="checkbox">
						<input v-model="picked[c.url]" type="checkbox" :disabled="running" />
						{{ c.title || c.url }}
					</label>
					<span class="has-text-grey"> {{ c.savedAt ? `- saved ${when(c.savedAt)}` : "" }}</span>
					<span v-if="states[c.url]" class="state" :class="`is-${states[c.url].state}`"> - {{ states[c.url].text }}</span>
				</li>
			</ul>
			<div class="buttons">
				<button v-if="!running" type="button" class="button is-primary start" :disabled="!chosen.length" @click="start">
					Gather {{ chosen.length }} {{ chosen.length === 1 ? "chat" : "chats" }}
				</button>
				<button v-else type="button" class="button is-warning stop" @click="halt">Stop after this one</button>
				<button type="button" class="button pack" :disabled="running" @click="pack">Back up all as .zip</button>
			</div>
		</template>
		<p v-if="said" role="status" class="is-size-7 gather-said">{{ said }}</p>
	</section>
</template>

<style scoped>
.gather-list {
	max-height: 24rem;
	overflow: auto;
}
.is-failed {
	color: var(--bulma-danger);
}
.is-done {
	color: var(--bulma-success-dark);
}
</style>
