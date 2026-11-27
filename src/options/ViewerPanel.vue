<!-- The viewer: a chat of the library, or a file saved before (.md or .json), read here.
     The file is read by the page alone; nothing is kept or sent. -->
<script setup>
import { ref } from "vue";
import ChatView from "../viewer/ChatView.vue";
import { fromFile } from "../viewer/conversation.js";
import GistShare from "./GistShare.vue";
import { shown } from "./shown.js";

const said = ref("");

async function open(event) {
	const [file] = event.target.files;
	if (!file) return;
	try {
		shown.chat = fromFile(file.name, await file.text());
		said.value = "";
	} catch (error) {
		said.value = `${file.name}: ${error.message}`;
	}
	event.target.value = "";
}
</script>

<template>
	<section>
		<div class="level mb-4">
			<p class="level-left content mb-0">Read a chat of the library (its Read button), or a file you saved.</p>
			<label class="button is-small level-right">
				Open a saved file
				<input type="file" class="is-hidden open-file" accept=".md,.json,text/markdown,application/json" @change="open" />
			</label>
		</div>
		<p v-if="said" role="status" class="has-text-danger is-size-7 mb-3 viewer-status">{{ said }}</p>
		<template v-if="shown.chat">
			<ChatView :chat="shown.chat" />
			<GistShare :key="shown.chat.savedAt + shown.chat.title" :chat="shown.chat" />
		</template>
		<p v-else-if="!said" class="has-text-grey">Nothing open.</p>
	</section>
</template>
