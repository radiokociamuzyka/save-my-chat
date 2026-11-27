<!-- A conversation of the unified format, shown: its title, where it came from, each message. -->
<script setup>
import { roleName } from "./conversation.js";
import MarkdownText from "./MarkdownText.vue";

defineProps({ chat: { type: Object, required: true } });
const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");
const TAG = { user: "is-link", assistant: "is-success", system: "is-warning", tool: "is-dark" };
</script>

<template>
	<article class="chat-view">
		<h2 class="title is-5 mb-1">{{ chat.title }}</h2>
		<p class="is-size-7 has-text-grey mb-4 source">
			{{ chat.source.service }}, read by {{ chat.source.reader }}, saved {{ when(chat.savedAt) }}
			<template v-if="/^https?:/.test(chat.source.url || '')">
				· <a :href="chat.source.url" target="_blank" rel="noreferrer">the page</a>
			</template>
		</p>
		<section v-for="(turn, i) in chat.turns" :key="i" class="turn mb-4" :class="turn.role">
			<p class="mb-1">
				<span class="tag is-light" :class="TAG[turn.role]">{{ roleName(turn.role) }}</span>
				<span v-if="turn.author" class="is-size-7 has-text-grey ml-2">{{ turn.author }}</span>
			</p>
			<MarkdownText :text="turn.text" />
		</section>
	</article>
</template>

<style scoped>
.turn {
	border-left: 3px solid var(--bulma-border);
	padding-left: 0.75rem;
}
.turn.user {
	border-left-color: var(--bulma-link);
}
.turn.assistant {
	border-left-color: var(--bulma-success);
}
</style>
