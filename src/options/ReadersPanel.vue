<!-- Readers on and off, and each one's selectors. The background registers the readers
     again when "disabled" changes, or a host is granted or taken back; selectors are read
     at each save. An optional reader (phase 5) works once Firefox lets it on its webapp. -->
<script setup>
import { onMounted, ref } from "vue";
import SelectorEditor from "./SelectorEditor.vue";

const SMC = globalThis.SaveMyChat;
const readers = ref([]);

onMounted(async () => {
	const { disabled = [], selectors = {} } = await browser.storage.local.get(["disabled", "selectors"]);
	readers.value = await Promise.all(
		SMC.defaults.map(async (r) => ({
			...r,
			on: !disabled.includes(r.id),
			allowed: !r.optional || (await browser.permissions.contains({ origins: r.origins })),
			built: SMC.readers.get(r.id)?.selectors || {},
			own: selectors[r.id] || {},
		})),
	);
});

// Firefox asks the user; the background hears the grant and registers the reader
async function allow(r) {
	r.allowed = await browser.permissions.request({ origins: r.origins });
}
async function takeBack(r) {
	if (await browser.permissions.remove({ origins: r.origins })) r.allowed = false;
}
const hostsOf = (r) => r.origins.map((o) => new URL(o.replace("*", "")).host).join(", ");

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
			<p>
				Each chat webapp has its own reader. Turn off the ones you do not want injected. The readers of the
				newer webapps ask first: <strong>Allow</strong> lets save-my-chat read pages of that webapp, and Firefox
				asks you to confirm.
			</p>
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
			<p v-if="r.optional" class="is-size-7 mt-1 access">
				<template v-if="r.allowed">
					Allowed on {{ hostsOf(r) }}.
					<button type="button" class="button is-small is-text take-back" @click="takeBack(r)">Take back</button>
				</template>
				<template v-else>
					Not allowed on {{ hostsOf(r) }} yet.
					<button type="button" class="button is-small is-link is-light allow" @click="allow(r)">
						Allow on {{ hostsOf(r) }}
					</button>
				</template>
			</p>
			<SelectorEditor v-if="Object.keys(r.built).length" :id="r.id" :built="r.built" :own="r.own" />
		</div>
	</section>
</template>
