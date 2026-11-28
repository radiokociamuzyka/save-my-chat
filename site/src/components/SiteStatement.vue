<!-- A statement of docs/statements/ read as it is on master, raw from the repository (Sett,
     issue #7: one source, the site showing what master says without a new build), shown
     with the viewer's own Markdown (no innerHTML, images not loaded). -->
<script setup>
import { onMounted, ref } from "vue";
import MarkdownText from "../../../src/viewer/MarkdownText.vue";
import { RAW } from "../chats.js";

const props = defineProps({ name: { type: String, required: true } });
const text = ref("");
const said = ref("Reading it from the repository...");

onMounted(async () => {
	const at = `${RAW}docs/statements/${props.name}.md`;
	try {
		const response = await fetch(at);
		if (!response.ok) throw new Error(`${response.status}`);
		text.value = await response.text();
		said.value = "";
	} catch (error) {
		said.value = `Not read (${error.message}): it is on GitHub, ${at}`;
	}
});
</script>

<template>
	<p v-if="said" class="statement-said">{{ said }}</p>
	<MarkdownText v-else class="statement" :text="text" />
</template>
