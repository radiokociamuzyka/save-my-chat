// The extension's options, built by Vite from OptionsPage.vue (Q12). The kit and
// the default readers are classic scripts of the extension, loaded first: the
// readers' panel shows their built-in selectors, the prototypes copy their files.
import "bulma/css/bulma.css";
import { createApp } from "vue";
import OptionsPage from "./OptionsPage.vue";

function classic(src) {
	return new Promise((done) => {
		const script = document.createElement("script");
		script.src = src;
		script.onload = script.onerror = done;
		document.head.append(script);
	});
}

await classic("/core/kit.js");
await classic("/core/readers.js");
await Promise.all(globalThis.SaveMyChat.defaults.map((r) => classic(`/${r.file}`)));
createApp(OptionsPage).mount("#app");
