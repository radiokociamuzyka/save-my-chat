<!-- Readers on and off, and each one's selectors. The background registers the readers
     again when "disabled" changes; selectors are read at each save. -->
<script setup>
import { onMounted, ref } from "vue";
import SelectorEditor from "./SelectorEditor.vue";

const SMC = globalThis.SaveMyChat;
const readers = ref([]);

onMounted(async () => {
	const { disabled = [], selectors = {} } = await browser.storage.local.get(["disabled", "selectors"]);
	readers.value = SMC.defaults.map((r) => ({
		...r,
		on: !disabled.includes(r.id),
		built: SMC.readers.get(r.id)?.selectors || {},
		own: selectors[r.id] || {},
	}));
});

async function turn(r, on) {
	r.on = on;
	const { disabled: now = [] } = await browser.storage.local.get("disabled");
	const next = on ? now.filter((id) => id !== r.id) : [...new Set([...now, r.id])];
	await browser.storage.local.set({ disabled: next });
}
</script>

<template>
	<section>
		<div class="content">
			<p>Each chat webapp has its own reader. Turn off the ones you do not want injected.</p>
			<p>
				Webapps rename their classes with their builds. When a reader stops seeing messages (the popup's "What the
				reader saw" tells which part), put a CSS selector that finds them under that part, one per line: yours are
				tried before the built-in ones and take effect on the next save, no update needed.
			</p>
		</div>
		<div v-for="r in readers" :key="r.id" class="box reader">
			<label class="checkbox">
				<input type="checkbox" :checked="r.on" @change="turn(r, $event.target.checked)" />
				<strong class="ml-1">{{ r.name }}</strong>
			</label>
			<p class="is-size-7"><code>{{ r.matches.join(", ") }}</code></p>
			<SelectorEditor v-if="Object.keys(r.built).length" :id="r.id" :built="r.built" :own="r.own" />
		</div>
	</section>
</template>
