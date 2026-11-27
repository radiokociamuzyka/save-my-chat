(()=>{let e=globalThis;if(e.SaveMyChat?.kit)return;let t=`save-my-chat/0`,n=[`user`,`assistant`,`system`,`tool`],r=null;function i(){if(r)return r;if(!e.TurndownService)throw Error(`turndown is not loaded before the kit`);return r=new e.TurndownService({headingStyle:`atx`,hr:`---`,bulletListMarker:`-`,codeBlockStyle:`fenced`,emDelimiter:`*`}),e.turndownPluginGfm&&r.use(e.turndownPluginGfm.gfm),r.remove([`script`,`style`,`noscript`,`template`,`button`,`svg`]),r.addRule(`fence`,{filter:e=>e.nodeName===`PRE`,replacement:(e,t)=>{let n=t.querySelector(`code`)||t,r=(n.getAttribute(`class`)||``).match(/language-([\w+#-]+)/)?.[1]||``,i=n.textContent.replace(/\n$/,``),a=Math.max(0,...(i.match(/`+/g)||[]).map(e=>e.length)),o="`".repeat(Math.max(3,a+1));return`\n\n${o}${r}\n${i}\n${o}\n\n`}}),r.addRule(`cell`,{filter:[`th`,`td`],replacement:(e,t)=>{let n=t.parentNode.firstElementChild===t,r=e.replace(/\n+/g,` `).replace(/(^|[^\\])\|/g,`$1\\|`).trim();return`${n?`| `:` `}${r} |`}}),r.addRule(`hidden`,{filter:e=>e.hidden||e.getAttribute?.(`aria-hidden`)===`true`,replacement:()=>``}),r}function a(e){let t=e.cloneNode(!0),n=e.ownerDocument.baseURI;for(let e of t.querySelectorAll(`a[href]`)){let t=e.getAttribute(`href`);t.startsWith(`javascript:`)?e.removeAttribute(`href`):e.setAttribute(`href`,new URL(t,n).href)}for(let e of t.querySelectorAll(`img[src]`))e.setAttribute(`src`,new URL(e.getAttribute(`src`),n).href);return t}function o(e,t=``){let n=a(e);if(t)for(let e of n.querySelectorAll(t))e.remove();return i().turndown(n).replace(/\n{3,}/g,`

`).trim()}function s(e,t,r={},i=``){if(!n.includes(e))throw Error(`unknown role: ${e}`);return{role:e,text:typeof t==`string`?t.trim():o(t,i),...r}}function c(t,n=e.document){return[].concat(t||[]).filter(e=>{if(typeof e!=`string`||!e.trim())return!1;try{return n.querySelector(e),!0}catch{return!1}}).join(`, `)}function l(e={},t={}){let n={};for(let r of new Set([...Object.keys(e),...Object.keys(t)]))n[r]=[...[].concat(t[r]||[]),...[].concat(e[r]||[])];return n}function u(e,t,n){let r=n.createTreeWalker(e,4);for(let n=r.nextNode();n;n=r.nextNode()){if(!n.data.trim()||t.some(e=>e.contains(n)))continue;let r=n.parentElement?.closest(`script, style, noscript, template, button, svg, [aria-hidden='true']`);if(!(r&&e.contains(r)))return n}return e}function d(e,t,n=e){let r=Object.entries(t).map(([t,n])=>[t,c(n,e)]).filter(([,e])=>e),i=r.map(([,e])=>e).join(`, `);if(!i)return[];let a=[];for(let e of n.querySelectorAll(i)){let[t]=r.find(([,t])=>e.matches(t));a.some(n=>n.role===t&&n.el.contains(e))||a.push({role:t,el:e})}let o=a.map(t=>{let n=a.filter(e=>e.role!==t.role&&t.el.contains(e.el)).map(e=>e.el),i=r.filter(([e])=>e!==t.role).map(([,e])=>e).join(`, `);return{at:u(t.el,n,e),turn:s(t.role,t.el,{},i)}});return o.sort((e,t)=>e.at===t.at?0:e.at.compareDocumentPosition(t.at)&4?-1:1),o.map(e=>e.turn)}function f(e,n,r,i=new Date){let a=(n.turns||[]).filter(e=>e?.text);return{format:t,source:{reader:e.id,service:e.service,url:String(r)},title:(n.title||``).trim()||`Untitled conversation`,savedAt:i.toISOString(),turns:a}}function p(e){let r=[];return e?.format!==t&&r.push(`format is not ${t}`),e?.source?.reader||r.push(`source.reader is missing`),Array.isArray(e?.turns)?e.turns.forEach((e,t)=>{n.includes(e.role)||r.push(`turns[${t}].role is ${e.role}`),typeof e.text!=`string`&&r.push(`turns[${t}].text is not text`)}):r.push(`turns is not a list`),r}let m=new Map;function h(e){for(let t of[`id`,`name`,`detect`,`read`])if(!e[t])throw Error(`reader without ${t}`);return m.set(e.id,e),e}function g(e){let t=t=>e.filter(e=>e.role===t).length,n=(e,t)=>`${e} ${t}${e===1?``:`s`}`,r=t(`user`),i=t(`assistant`),a=[];i>r&&a.push(`${n(i,`answer`)} but ${n(r,`question`)}: a user selector may be out of date.`),r>i+1&&a.push(`${n(r,`question`)} but ${n(i,`answer`)}: an assistant selector may be out of date.`);let o=e.filter(e=>e.role===`user`||e.role===`assistant`);o.length&&o[0].role!==`user`&&a.push(`It starts with an answer: the order may be wrong.`),o.length&&o.at(-1).role!==`assistant`&&a.push(`It ends with a question: its answer is missing or still being written.`);let s=o.flatMap((e,t)=>t&&o[t-1].role===e.role?[t]:[]);return s.length&&a.push(`Two messages of one role in a row at ${s.map(e=>`${e}-${e+1}`).join(`, `)}: a message of the other role may be missing.`),a}async function _(t){try{let{selectors:n={}}=await e.browser.storage.local.get(`selectors`);return n[t]||{}}catch{return{}}}async function v(t=e.document,n=e.location?.href,r){for(let e of m.values()){if(!e.detect(t,n))continue;let i=l(e.selectors,r??await _(e.id)),a=f(e,e.read(t,n,i),n),o=g(a.turns);return o.length?{...a,warnings:o}:a}return null}async function y(t=e.document,n=e.location?.href,r){for(let e of m.values()){if(!e.detect(t,n))continue;let i=r??await _(e.id),a=l(e.selectors,i),o={};for(let[e,n]of Object.entries(a)){let r=[].concat(i[e]||[]).length;o[e]=n.map((e,n)=>{let i=null;try{i=t.querySelectorAll(e).length}catch{}return{css:e,found:i,override:n<r}})}let s={reader:e.id,name:e.name,host:new URL(n).host,parts:o,turns:{},warnings:[]},u=[`user`,`assistant`].filter(e=>c(a[e],t));for(let e of u)for(let n of u){if(e===n)continue;let r=[...t.querySelectorAll(c(a[e],t))].filter(e=>e.parentElement?.closest(c(a[n],t))).length;r&&(s.nested={...s.nested,[`${e} in ${n}`]:r})}try{let r=f(e,e.read(t,n,a),n);for(let e of r.turns)s.turns[e.role]=(s.turns[e.role]||0)+1;s.order=r.turns.map(e=>({user:`U`,assistant:`A`})[e.role]||e.role).join(` `),s.warnings=g(r.turns)}catch(e){s.error=String(e?.message||e)}return s}return null}function b(e,t){if(e===`<all_urls>`)return/^(https?|wss?|file|ftp|data):/.test(String(t));let n=/^(\*|https?|wss?|file|ftp|data):\/\/([^/]*)(\/.*)$/.exec(e);if(!n)return!1;let r;try{r=new URL(t)}catch{return!1}let[,i,a,o]=n,s=r.protocol.slice(0,-1);if(i===`*`?![`http`,`https`,`ws`,`wss`].includes(s):i!==s)return!1;if(a!==`*`){let e=a.replace(/^\*\./,``);if(a.startsWith(`*.`)?!(r.hostname===e||r.hostname.endsWith(`.${e}`)):r.hostname!==a)return!1}return RegExp(`^${o.replace(/[.+?^${}()|[\]\\]/g,`\\$&`).replaceAll(`*`,`.*`)}$`).test(r.pathname+r.search)}function x(t=e.document,n=e.location?.href){for(let e of m.values())if(e.detect(t,n))return{id:e.id,name:e.name};return null}e.SaveMyChat={...e.SaveMyChat||{},kit:!0,FORMAT:t,ROLES:n,markdown:o,turn:s,selector:c,effective:l,turnsBy:d,suspicions:g,conversation:f,validate:p,reader:h,readers:m,readPage:v,inspect:y,present:x,matches:b},e.document&&!/^(moz|chrome)-extension:$/.test(e.location?.protocol)&&e.browser?.runtime?.onMessage&&!e.SaveMyChat.listening&&(e.SaveMyChat.listening=!0,e.browser.runtime.onMessage.addListener(e=>{if(e?.type===`save-my-chat:present`)return Promise.resolve(x());if(e?.type===`save-my-chat:read`)return v();if(e?.type===`save-my-chat:inspect`)return y()}))})(),globalThis.SaveMyChat.defaults=[{id:`google-ai-mode`,name:`Google Search, AI Mode`,matches:[`https://www.google.com/search*`],file:`readers/google-ai-mode.js`},{id:`github-copilot`,name:`GitHub Copilot`,matches:[`https://github.com/copilot*`],file:`readers/github-copilot.js`}],(()=>{let e=globalThis.SaveMyChat;e.reader({id:`github-copilot`,name:`GitHub Copilot`,service:`github.com/copilot`,selectors:{user:[`.message-container[class*='user__']`],assistant:[`.message-container[class^='ai__']`,`.message-container[class*=' ai__']`,`.message-container[class*='_ai__']`]},detect:(e,t)=>new URL(t).pathname.startsWith(`/copilot`),read(t,n,r){let i=e.turnsBy(t,{user:r.user,assistant:r.assistant}),a=t.title.replace(/\s*·\s*GitHub( Copilot)?$/,``).trim();return{title:a===`Copilot`?``:a,turns:i}}})})(),(()=>{let e=globalThis.SaveMyChat;e.reader({id:`google-ai-mode`,name:`Google Search, AI Mode`,service:`google.com/search (AI Mode)`,selectors:{user:[`.ilZyRc`,`.L4dlbc`],assistant:[`.CKgc1d`]},detect:(e,t)=>new URL(t).searchParams.get(`udm`)===`50`,read(t,n,r){let i=(new URL(n).searchParams.get(`q`)||``).trim(),a=e.turnsBy(t,{user:r.user,assistant:r.assistant});return i&&a[0]?.role!==`user`&&a.unshift(e.turn(`user`,i,{from:`address`})),{title:i||t.title.replace(/ - Google Search$/,``),turns:a}}})})();var e=Object.assign({"../../../src/readers/github-copilot.js":`// GitHub Copilot, the immersive chat at https://github.com/copilot/c/<id>.
// Fitted from Sett's proof of work, drafted-snippets/github-copilot.turndown.js:
// every message is a .message-container; a user's carries a class "user__…",
// Copilot's "ai__…" (CSS-module names: the part after "__" changes with
// GitHub's builds, the prefix stays). Read in page order, through turndown.
// NOTE: the classes are Sett's, seen on 2026-11-27; this reader itself was
// not yet run on the live page. A new name goes in front of its set (or as
// an override in storage.local); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "github-copilot",
		name: "GitHub Copilot",
		service: "github.com/copilot",
		selectors: {
			user: [".message-container[class*='user__']"],
			assistant: [
				".message-container[class^='ai__']",
				".message-container[class*=' ai__']",
				".message-container[class*='_ai__']",
			],
		},
		detect: (_doc, url) => new URL(url).pathname.startsWith("/copilot"),
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\\s*·\\s*GitHub( Copilot)?$/, "").trim();
			return { title: title === "Copilot" ? "" : title, turns };
		},
	});
})();
`,"../../../src/readers/google-ai-mode.js":`// Google Search, AI Mode (udm=50; a follow-up keeps the same address).
// Fitted from Sett's proof of work, drafted-snippets/google-ai-mode.turndown.js:
// one query over the classes of both roles, read in page order.
// NOTE: the class names are Google's generated ones, seen by Sett on
// 2026-11-26; Google renames them with its builds. Add a new name in front
// of its set (or as an override in storage.local) and keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "google-ai-mode",
		name: "Google Search, AI Mode",
		service: "google.com/search (AI Mode)",
		selectors: {
			user: [".ilZyRc", ".L4dlbc"],
			assistant: [".CKgc1d"],
		},
		detect: (_doc, url) => new URL(url).searchParams.get("udm") === "50",
		read(doc, url, sets) {
			const q = (new URL(url).searchParams.get("q") || "").trim();
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			// Sett's snippet missed user messages too. The first question is
			// always in the address: if no user turn opens the conversation,
			// it is taken from there rather than lost.
			if (q && turns[0]?.role !== "user") turns.unshift(SMC.turn("user", q, { from: "address" }));
			return { title: q || doc.title.replace(/ - Google Search$/, ""), turns };
		},
	});
})();
`}),t=e=>`2026-11-${e}T10:00:00.000Z`,n=[{format:`save-my-chat/0`,source:{reader:`github-copilot`,service:`github.com/copilot`,url:`https://github.com/copilot/c/demo-1`},title:`Why does the build fail on CI?`,savedAt:t(27),turns:[{role:`user`,text:"Why does `npm test` fail on CI but not on my machine?"},{role:`assistant`,author:`GPT-5`,text:`The runner has **no display**, and the tests open a browser. Run them headless:

\`\`\`yaml
- run: npm test -- --headless
\`\`\`

| Where | Display |
|---|---|
| your machine | yes |
| the runner | no |`},{role:`user`,text:`That was it, thanks.`}]},{format:`save-my-chat/0`,source:{reader:`google-ai-mode`,service:`google.com/search`,url:`https://www.google.com/search?q=turtles&udm=50`},title:`How long do turtles live?`,savedAt:t(25),turns:[{role:`user`,text:`How long do turtles live?`},{role:`assistant`,text:`Many species live **50 to 100 years**; some giant tortoises well over 150.`}]}],r=e=>`${e.source.reader} ${e.source.url}`,i=(e,t=1)=>({key:r(e),title:e.title,reader:e.source.reader,service:e.source.service,url:e.source.url,turns:e.turns.length,firstSavedAt:e.savedAt,savedAt:e.savedAt,saves:t}),a={library:Object.fromEntries(n.map((e,t)=>[r(e),i(e,t+1)])),...Object.fromEntries(n.map(e=>[`chat:${r(e)}`,e]))},o=!1,s={reader:`github-copilot`,host:`github.com`,parts:{user:[{css:`.message-container[class*='user__']`,found:2,override:!1}],assistant:[{css:`.message-container[class^='ai__']`,found:1,override:!1}]},turns:{user:2,assistant:1},order:`U A U`,warnings:[`The chat ends with a question: its answer may still be coming.`]};function c(e){let r=Object.values(a.library);switch(e.type){case`save-my-chat:present`:return{id:`github-copilot`,name:`GitHub Copilot`};case`save-my-chat:inspect`:return s;case`save-my-chat:since`:return{savedAt:t(26),saved:2,now:3,grew:1};case`save-my-chat:save`:return{title:n[0].title,turns:3,warnings:[]};case`save-my-chat:library`:{let t=(e.query||``).toLowerCase().split(/\s+/).filter(Boolean);return r.filter(e=>{let n=[e.title,e.service,...a[`chat:${e.key}`].turns.map(e=>e.text)].join(`
`).toLowerCase();return t.every(e=>n.includes(e))}).sort((e,t)=>t.savedAt.localeCompare(e.savedAt))}case`save-my-chat:library-chat`:return a[`chat:${e.key}`]??null;case`save-my-chat:library-forget`:delete a.library[e.key];return;default:return}}globalThis.browser={runtime:{getManifest:()=>({version:`demo`}),sendMessage:async e=>structuredClone(c(e))},tabs:{query:async()=>[{id:1,url:n[0].source.url}]},storage:{local:{get:async e=>Object.fromEntries([].concat(e).map(e=>[e,structuredClone(a[e])])),set:async e=>Object.assign(a,structuredClone(e))}},permissions:{contains:async e=>!e.permissions||o,request:async()=>(o=!0,!0)}};var l=globalThis.fetch.bind(globalThis);globalThis.fetch=async(t,...n)=>{let r=typeof t==`string`&&/^\/readers\/([\w-]+\.js)$/.exec(t)?.[1],i=r&&e[`../../../src/readers/${r}`];return i?new Response(i):l(t,...n)};