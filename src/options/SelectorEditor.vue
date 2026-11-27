<!-- A reader's own selectors, part by part, stored as "selectors": { <reader>: { <part>: [css] } }. -->
<script setup>
import { reactive, ref } from "vue";
import { patternsOf } from "./prototypes.js";

const props = defineProps({ id: { type: String, required: true }, built: Object, own: Object });
const text = reactive(
	Object.fromEntries(Object.keys(props.built).map((part) => [part, [].concat(props.own[part] || []).join("\n")])),
);
const status = ref("");
const invalid = ref(false);

const valid = (css) => {
	try {
		document.querySelector(css);
		return true;
	} catch {
		return false;
	}
};

async function store(mine) {
	const { selectors: now = {} } = await browser.storage.local.get("selectors");
	if (Object.keys(mine).length) now[props.id] = mine;
	else delete now[props.id];
	await browser.storage.local.set({ selectors: now });
}

async function save() {
	const mine = {};
	const bad = [];
	for (const [part, value] of Object.entries(text)) {
		const lines = patternsOf(value);
		bad.push(...lines.filter((css) => !valid(css)).map((css) => `${part}: ${css}`));
		if (lines.length) mine[part] = lines;
	}
	invalid.value = bad.length > 0;
	if (bad.length) {
		status.value = `Not valid CSS: ${bad.join("; ")}`;
		return;
	}
	await store(mine);
	status.value = Object.keys(mine).length ? "Saved." : "Saved: built-in only.";
}

async function reset() {
	for (const part of Object.keys(text)) text[part] = "";
	invalid.value = false;
	await store({});
	status.value = "Built-in only.";
}
</script>

<template>
	<details :open="Object.keys(own).length > 0" class="mt-2">
		<summary class="is-size-7">Selectors</summary>
		<div v-for="(defaults, part) in built" :key="part" class="field mt-2">
			<label class="label is-small" :for="`${id}-${part}`">{{ part }}</label>
			<textarea
				:id="`${id}-${part}`"
				v-model="text[part]"
				class="textarea is-small is-family-monospace"
				rows="2"
				placeholder="your selectors, one per line"
			></textarea>
			<p class="help built-in">built in: {{ defaults.join("  |  ") }}</p>
		</div>
		<div class="buttons mb-1">
			<button type="button" class="button is-small is-primary" @click="save">Save selectors</button>
			<button type="button" class="button is-small" @click="reset">Back to built-in</button>
		</div>
		<p role="status" class="is-size-7" :class="{ 'has-text-danger': invalid }">{{ status }}</p>
	</details>
</template>
