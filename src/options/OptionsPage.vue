<!-- The extension's options: the library, the viewer, the files, the readers, the prototypes, one tab each
     (Q12: Vue, Bulma). The tab is kept in the address (#library), so a link opens it. -->
<script setup>
import { onMounted, ref } from "vue";
import ExplorerPanel from "./ExplorerPanel.vue";
import LibraryPanel from "./LibraryPanel.vue";
import PrototypesPanel from "./PrototypesPanel.vue";
import ReadersPanel from "./ReadersPanel.vue";
import ViewerPanel from "./ViewerPanel.vue";

const TABS = [
	{ id: "library", name: "Library", panel: LibraryPanel },
	{ id: "viewer", name: "Viewer", panel: ViewerPanel },
	{ id: "files", name: "Files", panel: ExplorerPanel },
	{ id: "readers", name: "Readers", panel: ReadersPanel },
	{ id: "prototypes", name: "Prototypes", panel: PrototypesPanel },
];
const fromHash = () => TABS.find((t) => `#${t.id}` === location.hash) ?? TABS[0];
const tab = ref(fromHash());
onMounted(() => window.addEventListener("hashchange", () => (tab.value = fromHash())));
</script>

<template>
	<main class="section py-5 options">
		<h1 class="title is-4">save-my-chat</h1>
		<div class="tabs mb-4">
			<ul>
				<li v-for="t in TABS" :key="t.id" :class="{ 'is-active': t.id === tab.id }">
					<a :href="`#${t.id}`">{{ t.name }}</a>
				</li>
			</ul>
		</div>
		<KeepAlive>
			<component :is="tab.panel" :key="tab.id" />
		</KeepAlive>
	</main>
</template>

<style scoped>
.options {
	max-width: 50rem;
}
</style>
