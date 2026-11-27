<!-- The viewer on the site: a file saved by save-my-chat read in the browser, with the
     extension's own components (src/viewer). The file is not uploaded anywhere. -->
<script setup>
import "bulma/css/bulma.css";
import { ref } from "vue";
import ChatView from "../../../src/viewer/ChatView.vue";
import { fromFile } from "../../../src/viewer/conversation.js";

const chat = ref(null);
const said = ref("");
const over = ref(false);

async function read(file) {
	if (!file) return;
	try {
		chat.value = fromFile(file.name, await file.text());
		said.value = "";
	} catch (error) {
		chat.value = null;
		said.value = `${file.name}: ${error.message}`;
	}
}
const picked = (event) => read(event.target.files[0]);
function dropped(event) {
	over.value = false;
	read(event.dataTransfer.files[0]);
}
</script>

<template>
	<div class="site-viewer">
		<section
			class="drop box has-text-centered mb-4"
			aria-label="Drop a saved file here"
			:class="{ over }"
			@dragover.prevent="over = true"
			@dragleave="over = false"
			@drop.prevent="dropped"
		>
			<p class="mb-2">Drop a <code>.md</code> or <code>.json</code> saved by save-my-chat here, or</p>
			<label class="button is-link">
				Open a saved file
				<input type="file" class="is-hidden open-file" accept=".md,.json,text/markdown,application/json" @change="picked" />
			</label>
			<p class="is-size-7 has-text-grey mt-2">Read by this page in your browser: the file is not sent anywhere.</p>
		</section>
		<p v-if="said" role="status" class="has-text-danger viewer-status">{{ said }}</p>
		<ChatView v-if="chat" :chat="chat" />
	</div>
</template>

<style scoped>
.drop {
	border: 2px dashed var(--bulma-border);
}
.drop.over {
	border-color: var(--bulma-link);
}
</style>
