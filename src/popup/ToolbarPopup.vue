<!-- The toolbar button: which reader sees this tab, what it saw there, and saving
     through the background (Q12: built by Vite, Bulma's styles). -->
<script setup>
import { computed, onMounted, ref } from "vue";
import { reportOf, sinceLine } from "./report.js";

const state = ref("Looking for a conversation…");
const reader = ref(null);
const blocked = ref(""); // a prototype that cannot answer yet
const seen = ref(null);
const lines = ref([]); // { kind: "warning" | "note" | "grew" | "error" | "done", text }
const busy = ref(false);
const copied = ref(false);
let tab = null;

const version = browser.runtime.getManifest().version;
const report = computed(() => (seen.value ? reportOf(seen.value, version) : ""));
const ask = (msg) => browser.runtime.sendMessage(msg);

onMounted(async () => {
	[tab] = await browser.tabs.query({ active: true, currentWindow: true });
	reader.value = tab ? await ask({ type: "save-my-chat:present", tabId: tab.id }) : null;
	if (!reader.value) {
		state.value = "No supported chat on this page.";
		return;
	}
	state.value = `Reader: ${reader.value.name}${reader.value.prototype ? " (your prototype)" : ""}`;
	if (reader.value.error) {
		blocked.value = reader.value.error;
		return;
	}
	seen.value = await ask({ type: "save-my-chat:inspect", tabId: tab.id });
	if (!seen.value) return;
	const roles = Object.entries(seen.value.turns);
	state.value += roles.length ? ` - sees ${roles.map(([role, n]) => `${n} ${role}`).join(", ")}` : " - sees no messages";
	const warnings = seen.value.error ? [seen.value.error, ...seen.value.warnings] : seen.value.warnings;
	lines.value = warnings.map((text) => ({ kind: "warning", text }));
	const turns = Object.values(seen.value.turns).reduce((a, b) => a + b, 0);
	const since = sinceLine(await ask({ type: "save-my-chat:since", reader: seen.value.reader, url: tab.url, turns }));
	if (since) lines.value.push(since);
});

async function save(as) {
	busy.value = true;
	try {
		const done = await ask({ type: "save-my-chat:save", tabId: tab.id, as });
		lines.value = [
			{ kind: "done", text: `Saved "${done.title}", ${done.turns} messages.` },
			...done.warnings.map((text) => ({ kind: "warning", text })),
		];
	} catch (error) {
		lines.value = [{ kind: "error", text: error.message }];
	} finally {
		busy.value = false;
	}
}

async function copy() {
	await navigator.clipboard.writeText(report.value);
	copied.value = true;
}

const COLOR = { warning: "has-text-warning-dark", note: "has-text-grey", grew: "has-text-success has-text-weight-semibold", error: "has-text-danger", done: "" };
</script>

<template>
	<main class="popup">
		<h1 class="title is-6 mb-2">save-my-chat</h1>
		<p class="state mb-3">{{ state }}</p>
		<p v-if="blocked" class="has-text-danger">{{ blocked }}</p>
		<div v-if="reader && !blocked" class="buttons has-addons is-fullwidth mb-2">
			<button type="button" class="button is-primary is-small" :class="{ 'is-loading': busy }" @click="save('md')">
				Save as Markdown
			</button>
			<button type="button" class="button is-small" :disabled="busy" @click="save('json')">Save as JSON</button>
		</div>
		<p v-for="(line, i) in lines" :key="i" class="line is-size-7" :class="COLOR[line.kind]" role="status">
			{{ line.text }}
		</p>
		<details v-if="seen" class="mt-2">
			<summary class="is-size-7">What the reader saw</summary>
			<pre class="seen">{{ report }}</pre>
			<button type="button" class="button is-small is-fullwidth" @click="copy">
				{{ copied ? "Copied" : "Copy report" }}
			</button>
		</details>
	</main>
</template>

<style scoped>
.popup {
	width: 20rem;
	padding: 0.75rem;
}

.buttons.is-fullwidth .button {
	flex: 1;
}

.seen {
	font-size: 11px;
	white-space: pre-wrap;
	word-break: break-all;
	max-height: 14rem;
	overflow: auto;
	padding: 0.5rem;
}
</style>
