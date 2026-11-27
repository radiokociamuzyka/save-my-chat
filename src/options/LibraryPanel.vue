<!-- The library (PP1): what was saved, searched, saved again, forgotten; the background keeps it. -->
<script setup>
import { onMounted, ref } from "vue";

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
const when = (iso) => new Date(iso).toLocaleString();

onMounted(list);
</script>

<template>
	<section>
		<p class="content">
			A copy of each chat you save is kept here, in Firefox's storage for this extension, so you can find it, save it
			again, and see in the popup when it grew since. It never leaves your machine; Forget removes it.
		</p>
		<div class="field">
			<input v-model="query" type="search" class="input" placeholder="search titles and messages" @input="list" />
		</div>
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
				<button type="button" class="button" @click="again(e, 'md')">Markdown</button>
				<button type="button" class="button" @click="again(e, 'json')">JSON</button>
				<button type="button" class="button is-danger is-light" @click="forget(e)">Forget</button>
			</div>
		</div>
	</section>
</template>
