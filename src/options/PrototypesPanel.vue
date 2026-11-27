<!-- Prototypes (phase 3): the user's own readers. The userScripts permission is optional,
     asked on the user's click; files of prototypes are exported and imported here. -->
<script setup>
import { onMounted, ref } from "vue";
import PrototypeEditor from "./PrototypeEditor.vue";
import { FORMAT, fileOf, imported } from "./prototypes.js";

const SMC = globalThis.SaveMyChat;
const allowed = ref(null);
const all = ref({});
const said = ref("");

const stored = async () => (await browser.storage.local.get("prototypes")).prototypes || {};
const keep = (now) => browser.storage.local.set({ prototypes: now });
const protoOf = (r) => Object.values(all.value).find((p) => (p.from ?? p.id) === r.id);

async function refresh() {
	allowed.value = await browser.permissions.contains({ permissions: ["userScripts"] });
	all.value = await stored();
}

async function allow() {
	// the request comes first in the click, as Firefox wants it
	await browser.permissions.request({ permissions: ["userScripts"] });
	await refresh();
}

async function copy(r) {
	const code = await (await fetch(`/${r.file}`)).text();
	const now = await stored();
	now[r.id] = { id: r.id, name: r.name, from: r.id, matches: r.matches, code, enabled: true };
	await keep(now);
	await refresh();
}

function exportAll() {
	const list = Object.values(all.value);
	const a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([fileOf(list)], { type: "application/json" }));
	a.download = "save-my-chat-prototypes.json";
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
	said.value = `${list.length} exported.`;
}

async function importFile(event) {
	const [file] = event.target.files;
	if (!file) return;
	let data;
	try {
		data = JSON.parse(await file.text());
	} catch {
		data = null;
	}
	if (data?.format !== FORMAT || !Array.isArray(data.prototypes)) {
		said.value = `Not a file of prototypes (${FORMAT}).`;
		return;
	}
	const now = await stored();
	const taken = data.prototypes.map(imported).filter(Boolean);
	for (const p of taken) now[p.id] = p;
	await keep(now);
	const skipped = data.prototypes.length - taken.length;
	said.value = `${taken.length} imported, turned off: look at each, then turn it on.${skipped ? ` ${skipped} skipped as broken.` : ""}`;
	event.target.value = "";
	await refresh();
}

onMounted(refresh);
</script>

<template>
	<section>
		<p class="content">
			A prototype is your own copy of a reader: change its code, and it runs in place of the default on the pages you
			name, until you turn it off or delete it. Nothing leaves your machine; export them to keep or share.
		</p>
		<p v-if="allowed !== null" class="mb-4 permission">
			<span class="allowed">{{
				allowed
					? "User scripts are allowed: your enabled prototypes run in place of their defaults."
					: "Prototypes run as user scripts, which Firefox asks you to allow once. Until then the defaults run."
			}}</span>
			<button v-if="!allowed" type="button" class="button is-small is-link ml-2 allow" @click="allow">
				Allow user scripts
			</button>
		</p>
		<div v-for="r in SMC.defaults" :key="r.id" class="mb-4">
			<PrototypeEditor v-if="protoOf(r)" :proto="protoOf(r)" @deleted="refresh" />
			<button v-else type="button" class="button is-small copy" @click="copy(r)">Make a prototype of {{ r.name }}</button>
		</div>
		<div class="buttons are-small">
			<button type="button" class="button export" @click="exportAll">Export prototypes</button>
			<label class="button file">
				Import prototypes
				<input type="file" class="is-hidden import" accept=".json,application/json" @change="importFile" />
			</label>
		</div>
		<p role="status" class="is-size-7 prototypes-status">{{ said }}</p>
	</section>
</template>
