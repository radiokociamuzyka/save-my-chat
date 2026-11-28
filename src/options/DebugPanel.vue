<!-- The debug gate (debug build only, src/debug/background.js): the agent connected to this
     Firefox through its MCP server, the user pointing at what should be read, the picks. -->
<script setup>
import { onActivated, onMounted, ref } from "vue";

const ask = (msg) => browser.runtime.sendMessage(msg);
const state = ref({ connected: false, error: "" });
const allowed = ref(false);
const tabs = ref([]);
const picks = ref([]);
const sites = ref({}); // origin -> granted
const said = ref("");

const originOf = (url) => {
	try {
		const u = new URL(url);
		return /^https?:$/.test(u.protocol) ? `${u.origin}/*` : null;
	} catch {
		return null;
	}
};

async function refresh() {
	allowed.value = await browser.permissions.contains({ permissions: ["nativeMessaging"] });
	state.value = (await ask({ type: "save-my-chat:debug-state" })) ?? state.value;
	tabs.value = (await browser.tabs.query({})).filter((t) => originOf(t.url));
	for (const t of tabs.value) {
		const origin = originOf(t.url);
		sites.value[origin] = await browser.permissions.contains({ origins: [origin] });
	}
	picks.value = ((await browser.storage.local.get("debugPicks")).debugPicks ?? []).slice(-20).reverse();
}
onMounted(refresh);
onActivated(refresh);

async function connect() {
	said.value = "";
	// asked here, from the click: Firefox grants a permission only on a user's action
	if (!allowed.value && !(await browser.permissions.request({ permissions: ["nativeMessaging"] }))) return;
	state.value = await ask({ type: "save-my-chat:debug-connect" });
	await refresh();
}

async function disconnect() {
	state.value = await ask({ type: "save-my-chat:debug-disconnect" });
}

async function allowSite(t) {
	const origin = originOf(t.url);
	sites.value[origin] = await browser.permissions.request({ origins: [origin] });
}

async function point(t) {
	try {
		await ask({ type: "save-my-chat:debug-point", tabId: t.id });
	} catch (error) {
		said.value = `Could not point there: ${error.message}`;
	}
}

async function forget() {
	await browser.storage.local.set({ debugPicks: [] });
	picks.value = [];
}
</script>

<template>
	<section>
		<p class="content">
			The <strong>debug gate</strong> lets an agent (Claude Code, or any MCP client) look at the pages open here: outline
			a page, try selectors, mark on the page what it thinks should be read, and read what you point at. It takes
			selectors, never code. <strong>What it reads of a page goes to the agent, and from there to its model:</strong>
			connect only while you want that, on pages you are fine sharing so.
		</p>
		<p class="content is-size-7">
			Once per machine: <code>task debug:install</code> (the native host). Then the agent starts the server of
			<code>.mcp.json</code>, <code>save-my-chat-debug</code>. This tab is only in the debug build (<code>task run</code>).
		</p>
		<div class="buttons">
			<button v-if="!state.connected" type="button" class="button is-primary connect" @click="connect">
				{{ allowed ? "Connect" : "Allow native messaging and connect" }}
			</button>
			<button v-else type="button" class="button disconnect" @click="disconnect">Disconnect</button>
			<button type="button" class="button refresh" @click="refresh">Refresh</button>
		</div>
		<p class="is-size-7 debug-state" role="status">
			{{ state.connected ? "Connected: the agent's tools reach this Firefox." : "Not connected." }}
			<span v-if="state.error" class="has-text-danger">{{ state.error }}</span>
		</p>

		<h2 class="title is-6 mt-4">Point at what should be read</h2>
		<p class="is-size-7 mb-2">
			Brings the tab to the front: click an element there, say what it is (user, assistant, title, list, other), and the
			agent reads it with the <code>picks</code> tool.
		</p>
		<ul class="mb-3 debug-tabs">
			<li v-for="t in tabs" :key="t.id" class="is-size-7">
				<button v-if="sites[originOf(t.url)]" type="button" class="button is-small point" @click="point(t)">
					Point here
				</button>
				<button v-else type="button" class="button is-small allow-site" @click="allowSite(t)">Allow this site</button>
				{{ t.title || t.url }}
			</li>
		</ul>

		<h2 class="title is-6">Your picks</h2>
		<p v-if="!picks.length" class="is-size-7 has-text-grey">None yet.</p>
		<ul v-else class="mb-2 debug-picks">
			<li v-for="p in picks" :key="p.at" class="is-size-7">
				<strong>{{ p.label }}</strong> <code>{{ p.suggest?.[0]?.css ?? p.path }}</code> "{{ p.text?.slice(0, 80) }}"
				<span v-if="p.note" class="has-text-grey">- {{ p.note }}</span>
			</li>
		</ul>
		<button v-if="picks.length" type="button" class="button is-small forget" @click="forget">Forget the picks</button>
		<p v-if="said" role="status" class="is-size-7 has-text-danger">{{ said }}</p>
	</section>
</template>

<style scoped>
.debug-tabs,
.debug-picks {
	max-height: 18rem;
	overflow: auto;
}
</style>
