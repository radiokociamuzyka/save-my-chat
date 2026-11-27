<!-- The viewer's chat sent to GitHub as a secret gist of the user's account (Q9), only
     on this click. GitHub's API and the data it gets are asked for on the first one. -->
<script setup>
import { onMounted, ref } from "vue";
import { API, DATA, share, TOKEN_PAGE } from "./gist.js";

const props = defineProps({ chat: { type: Object, required: true } });
const SMC = globalThis.SaveMyChat;
const token = ref("");
const typed = ref("");
const url = ref("");
const said = ref("");
const busy = ref(false);

onMounted(async () => {
	token.value = (await browser.storage.local.get("githubToken")).githubToken || "";
});

async function keep() {
	token.value = typed.value.trim();
	typed.value = "";
	await browser.storage.local.set({ githubToken: token.value });
}

async function forget() {
	token.value = "";
	await browser.storage.local.remove("githubToken");
}

async function send() {
	// the request comes first in the click, as Firefox wants it
	const granted = await browser.permissions.request({ origins: [API], data_collection: DATA });
	if (!granted) {
		said.value = "Not sent: GitHub was not allowed.";
		return;
	}
	busy.value = true;
	said.value = "";
	try {
		url.value = await share(props.chat, token.value, { markdown: SMC.toMarkdown, fileName: SMC.fileName });
	} catch (error) {
		said.value = `Not sent: ${error.message}`;
	} finally {
		busy.value = false;
	}
}
</script>

<template>
	<details class="box gist mt-5">
		<summary class="has-text-weight-semibold">Share as a secret gist</summary>
		<p class="is-size-7 mt-2">
			This sends the chat to GitHub, as a secret gist of your account: not listed anywhere, but anyone with its link can
			read it. It is the only thing save-my-chat ever sends, and only when you click here.
		</p>
		<template v-if="!token">
			<p class="is-size-7 mt-2">
				It needs a token of yours with the <code>gist</code> scope:
				<a :href="TOKEN_PAGE" target="_blank" rel="noreferrer">make one on GitHub</a>. It is kept in this extension's
				storage, and sent to GitHub alone.
			</p>
			<div class="field has-addons mt-2">
				<div class="control is-expanded">
					<input v-model="typed" type="password" class="input is-small token" placeholder="GitHub token" aria-label="GitHub token" />
				</div>
				<div class="control">
					<button type="button" class="button is-small keep" :disabled="!typed.trim()" @click="keep">Keep the token</button>
				</div>
			</div>
		</template>
		<div v-else class="buttons are-small mt-2">
			<button type="button" class="button is-link send" :class="{ 'is-loading': busy }" @click="send">
				Make a secret gist
			</button>
			<button type="button" class="button forget-token" @click="forget">Forget the token</button>
		</div>
		<p v-if="url" class="is-size-7 made">
			Made: <a :href="url" target="_blank" rel="noreferrer">{{ url }}</a>
		</p>
		<p v-if="said" role="status" class="is-size-7 has-text-danger gist-status">{{ said }}</p>
	</details>
</template>
