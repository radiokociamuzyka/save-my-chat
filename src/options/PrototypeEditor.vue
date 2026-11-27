<!-- One prototype: where it runs, its code, on or off; saved only when it may run there
     and registers a reader. -->
<script setup>
import { ref } from "vue";
import { originOf, patternsOf, registers } from "./prototypes.js";

const props = defineProps({ proto: { type: Object, required: true } });
const emit = defineEmits(["deleted"]);
const enabled = ref(props.proto.enabled);
const matches = ref(props.proto.matches.join("\n"));
const code = ref(props.proto.code);
const status = ref("");
const invalid = ref(false);

const stored = async () => (await browser.storage.local.get("prototypes")).prototypes || {};
const keep = (now) => browser.storage.local.set({ prototypes: now });

// a pattern the extension may run on: of a site in its host permissions
async function reachable(pattern) {
	const origin = originOf(pattern);
	return origin ? browser.permissions.contains({ origins: [origin] }) : false;
}

function say(text, bad = false) {
	status.value = text;
	invalid.value = bad;
}

async function save() {
	const patterns = patternsOf(matches.value);
	const bad = [];
	for (const p of patterns) if (!(await reachable(p))) bad.push(p);
	if (!patterns.length) return say("It needs at least one pattern.", true);
	if (bad.length) return say(`Not a site this extension may read: ${bad.join(", ")}`, true);
	if (!registers(code.value)) return say("The code registers no reader: it needs SaveMyChat.reader({...}).", true);
	const now = await stored();
	now[props.proto.id] = { ...props.proto, matches: patterns, code: code.value, enabled: enabled.value };
	await keep(now);
	say("Saved. Reload the chat's page to run it.");
}

async function turn(on) {
	enabled.value = on;
	const now = await stored();
	if (!now[props.proto.id]) return;
	now[props.proto.id].enabled = on;
	await keep(now);
	say(on ? "On: reload the chat's page." : "Off: the default runs again.");
}

async function drop() {
	const now = await stored();
	delete now[props.proto.id];
	await keep(now);
	emit("deleted");
}
</script>

<template>
	<fieldset class="box prototype">
		<legend class="has-text-weight-semibold">{{ proto.name }}, your prototype</legend>
		<label class="checkbox mb-2">
			<input type="checkbox" class="enabled" :checked="enabled" @change="turn($event.target.checked)" />
			runs in place of the default
		</label>
		<div class="field">
			<label class="label is-small" :for="`${proto.id}-matches`">Pages it runs on (match patterns, one per line)</label>
			<textarea :id="`${proto.id}-matches`" v-model="matches" class="textarea is-small matches" rows="2"></textarea>
		</div>
		<div class="field">
			<label class="label is-small" :for="`${proto.id}-code`">Its code: a SaveMyChat.reader({...}) like the default's</label>
			<textarea :id="`${proto.id}-code`" v-model="code" class="textarea is-small is-family-monospace code" rows="24" spellcheck="false"></textarea>
		</div>
		<div class="buttons are-small mb-1">
			<button type="button" class="button is-primary save" @click="save">Save</button>
			<button type="button" class="button is-danger is-light delete-prototype" @click="drop">Delete</button>
		</div>
		<p role="status" class="is-size-7 status" :class="{ 'has-text-danger': invalid }">{{ status }}</p>
	</fieldset>
</template>

<style scoped>
.code {
	tab-size: 4;
	white-space: pre;
}
</style>
