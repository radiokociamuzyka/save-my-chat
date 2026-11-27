<!-- The stored files (PP1, Q8): the library kept as a git repository in the extension's
     own storage, a Markdown and a JSON file per chat, every copy saved in its history.
     Brought up to date from the library when this tab opens. -->
<script setup>
import { onMounted, ref } from "vue";
import { files, history, sync, text } from "../explorer/repo.js";
import { fromFile } from "../viewer/conversation.js";
import { shown } from "./shown.js";

const SMC = globalThis.SaveMyChat;
const list = ref(null);
const picked = ref(null);
const past = ref([]);
const said = ref("");
const ask = (msg) => browser.runtime.sendMessage(msg);
const when = (iso) => new Date(iso).toLocaleString();

const folders = () => {
	const by = {};
	for (const path of list.value ?? []) {
		const folder = path.split("/")[0];
		by[folder] ??= [];
		by[folder].push(path);
	}
	return by;
};

async function refresh() {
	try {
		const entries = await ask({ type: "save-my-chat:library" });
		const committed = await sync(entries, {
			chat: (key) => ask({ type: "save-my-chat:library-chat", key }),
			markdown: SMC.toMarkdown,
			slug: SMC.slug,
		});
		list.value = await files();
		const n = committed.length;
		said.value = n ? `${n} ${n === 1 ? "chat" : "chats"} brought in from the library.` : "";
	} catch (error) {
		said.value = `The stored files could not be read: ${error.message}`;
	}
}

async function pick(path) {
	picked.value = path;
	past.value = await history(path);
}

async function read(path, oid) {
	shown.chat = fromFile(path, await text(path, oid));
	location.hash = "#viewer";
}

async function download(path, oid) {
	const a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([await text(path, oid)], { type: "text/plain" }));
	a.download = path.split("/").pop();
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}

onMounted(refresh);
</script>

<template>
	<section>
		<p class="content">
			Every chat of the library is also kept here as files, a Markdown and a JSON, in a git repository inside Firefox's
			storage for this extension: each copy you saved stays in its history. Nothing leaves your machine.
		</p>
		<p v-if="said" role="status" class="is-size-7 mb-3 explorer-status">{{ said }}</p>
		<p v-if="list && !list.length" class="has-text-grey">No files yet: the chats you save appear here.</p>
		<div class="columns">
			<div class="column is-half">
				<div v-for="(paths, folder) in folders()" :key="folder" class="mb-3">
					<p class="has-text-weight-semibold is-size-7 folder">{{ folder }}/</p>
					<ul>
						<li v-for="path in paths" :key="path">
							<a href="#files" class="file" :class="{ 'has-text-weight-bold': path === picked }" @click.prevent="pick(path)">
								{{ path.slice(folder.length + 1) }}
							</a>
						</li>
					</ul>
				</div>
			</div>
			<div v-if="picked" class="column is-half">
				<p class="has-text-weight-semibold mb-2 picked">{{ picked }}</p>
				<div v-for="(h, i) in past" :key="h.oid" class="box py-2 px-3 mb-2 version">
					<p class="is-size-7">{{ when(h.savedAt) }}{{ i === 0 ? " · the latest" : "" }}</p>
					<p class="is-size-7 has-text-grey">{{ h.message }}</p>
					<div class="buttons are-small mt-1">
						<button type="button" class="button is-link is-light read" @click="read(picked, h.oid)">Read</button>
						<button type="button" class="button download" @click="download(picked, h.oid)">Download</button>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
