<!-- The library (PP1): what was saved, searched, saved again, forgotten; the background keeps it. -->
<script setup>
import { onActivated, onMounted, ref } from "vue";
import { backup } from "./backup.js";
import { shown } from "./shown.js";

const query = ref("");
const entries = ref(null);
const ask = (msg) => browser.runtime.sendMessage(msg);

async function list() {
	entries.value = await ask({ type: "save-my-chat:library", query: query.value });
}
const again = (e, as) => ask({ type: "save-my-chat:library-save", key: e.key, as });
async function forget(e) {
	await ask({ type: "save-my-chat:library-forget", key: e.key });
	await list();
}
async function read(e) {
	shown.chat = await ask({ type: "save-my-chat:library-chat", key: e.key });
	location.hash = "#viewer";
}
const when = (iso) => new Date(iso).toLocaleString();

// the whole library as one .zip into the downloads (backup.js)
const packing = ref("");
async function pack() {
	packing.value = "Packing...";
	try {
		const SMC = globalThis.SaveMyChat;
		const n = await backup(ask, { markdown: SMC.toMarkdown, slug: SMC.slug });
		packing.value = `${n} ${n === 1 ? "chat" : "chats"} packed into your downloads.`;
	} catch (error) {
		packing.value = `Not packed: ${error.message}`;
	}
}

onMounted(list);
onActivated(list); // shown again (the tabs are kept alive): what Gather added since is listed
</script>

<template>
	<section>
		<p class="content">
			A copy of each chat you save is kept here, in Firefox's storage for this extension, so you can find it, save it
			again, and see in the popup when it grew since. It never leaves your machine; Forget removes it.
		</p>
		<div class="field has-addons">
			<div class="control is-expanded">
				<input v-model="query" type="search" class="input" placeholder="search titles and messages" @input="list" />
			</div>
			<div class="control">
				<button type="button" class="button pack" :disabled="!entries?.length || query !== ''" @click="pack">
					Back up all as .zip
				</button>
			</div>
		</div>
		<p v-if="packing" role="status" class="is-size-7 mb-3 pack-status">{{ packing }}</p>
		<p v-if="entries" role="status" class="is-size-7 mb-3 library-status">
			{{
				entries.length
					? `${entries.length} saved.`
					: query
						? "Nothing saved matches that."
						: "Nothing saved yet: the chats you save appear here."
			}}
		</p>
		<div v-for="e in entries" :key="e.key" class="box entry py-3">
			<a :href="e.url" target="_blank" rel="noreferrer" class="has-text-weight-semibold">{{ e.title }}</a>
			<p class="is-size-7 has-text-grey about">
				{{ e.service }}, {{ e.turns }} messages, saved {{ when(e.savedAt) }}{{ e.saves > 1 ? ` (${e.saves} times)` : "" }}
			</p>
			<div class="buttons are-small mt-2">
				<button type="button" class="button is-link is-light read" @click="read(e)">Read</button>
				<button type="button" class="button" @click="again(e, 'md')">Markdown</button>
				<button type="button" class="button" @click="again(e, 'json')">JSON</button>
				<button type="button" class="button is-danger is-light" @click="forget(e)">Forget</button>
			</div>
		</div>
	</section>
</template>
