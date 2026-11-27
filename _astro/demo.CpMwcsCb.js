(()=>{let e=globalThis;if(e.SaveMyChat?.kit)return;let t=`save-my-chat/0`,n=[`user`,`assistant`,`system`,`tool`],r=null;function i(){if(r)return r;if(!e.TurndownService)throw Error(`turndown is not loaded before the kit`);return r=new e.TurndownService({headingStyle:`atx`,hr:`---`,bulletListMarker:`-`,codeBlockStyle:`fenced`,emDelimiter:`*`}),e.turndownPluginGfm&&r.use(e.turndownPluginGfm.gfm),r.remove([`script`,`style`,`noscript`,`template`,`button`,`svg`]),r.addRule(`fence`,{filter:e=>e.nodeName===`PRE`,replacement:(e,t)=>{let n=t.querySelector(`code`)||t,r=(n.getAttribute(`class`)||``).match(/language-([\w+#-]+)/)?.[1]||``,i=n.textContent.replace(/\n$/,``),a=Math.max(0,...(i.match(/`+/g)||[]).map(e=>e.length)),o="`".repeat(Math.max(3,a+1));return`\n\n${o}${r}\n${i}\n${o}\n\n`}}),r.addRule(`cell`,{filter:[`th`,`td`],replacement:(e,t)=>{let n=t.parentNode.firstElementChild===t,r=e.replace(/\n+/g,` `).replace(/(^|[^\\])\|/g,`$1\\|`).trim();return`${n?`| `:` `}${r} |`}}),r.addRule(`hidden`,{filter:e=>e.hidden||e.getAttribute?.(`aria-hidden`)===`true`,replacement:()=>``}),r}function a(e){let t=e.cloneNode(!0),n=e.ownerDocument.baseURI;for(let e of t.querySelectorAll(`a[href]`)){let t=e.getAttribute(`href`);t.startsWith(`javascript:`)?e.removeAttribute(`href`):e.setAttribute(`href`,new URL(t,n).href)}for(let e of t.querySelectorAll(`img[src]`))e.setAttribute(`src`,new URL(e.getAttribute(`src`),n).href);return t}function o(e,t=``){let n=a(e);if(t)for(let e of n.querySelectorAll(t))e.remove();return i().turndown(n).replace(/\n{3,}/g,`

`).trim()}function s(e,t,r={},i=``){if(!n.includes(e))throw Error(`unknown role: ${e}`);return{role:e,text:typeof t==`string`?t.trim():o(t,i),...r}}function c(t,n=e.document){return[].concat(t||[]).filter(e=>{if(typeof e!=`string`||!e.trim())return!1;try{return n.querySelector(e),!0}catch{return!1}}).join(`, `)}function l(e={},t={}){let n={};for(let r of new Set([...Object.keys(e),...Object.keys(t)]))n[r]=[...[].concat(t[r]||[]),...[].concat(e[r]||[])];return n}function u(e,t,n){let r=n.createTreeWalker(e,4);for(let n=r.nextNode();n;n=r.nextNode()){if(!n.data.trim()||t.some(e=>e.contains(n)))continue;let r=n.parentElement?.closest(`script, style, noscript, template, button, svg, [aria-hidden='true']`);if(!(r&&e.contains(r)))return n}return e}function d(e,t,n=e){let r=Object.entries(t).map(([t,n])=>[t,c(n,e)]).filter(([,e])=>e),i=r.map(([,e])=>e).join(`, `);if(!i)return[];let a=[];for(let e of n.querySelectorAll(i)){let[t]=r.find(([,t])=>e.matches(t));a.some(n=>n.role===t&&n.el.contains(e))||a.push({role:t,el:e})}let o=a.map(t=>{let n=a.filter(e=>e.role!==t.role&&t.el.contains(e.el)).map(e=>e.el),i=r.filter(([e])=>e!==t.role).map(([,e])=>e).join(`, `);return{at:u(t.el,n,e),turn:s(t.role,t.el,{},i)}});return o.sort((e,t)=>e.at===t.at?0:e.at.compareDocumentPosition(t.at)&4?-1:1),o.map(e=>e.turn)}function f(e,n,r,i=new Date){let a=(n.turns||[]).filter(e=>e?.text);return{format:t,source:{reader:e.id,service:e.service,url:String(r)},title:(n.title||``).trim()||`Untitled conversation`,savedAt:i.toISOString(),turns:a}}function p(e){let r=[];return e?.format!==t&&r.push(`format is not ${t}`),e?.source?.reader||r.push(`source.reader is missing`),Array.isArray(e?.turns)?e.turns.forEach((e,t)=>{n.includes(e.role)||r.push(`turns[${t}].role is ${e.role}`),typeof e.text!=`string`&&r.push(`turns[${t}].text is not text`)}):r.push(`turns is not a list`),r}let m=new Map;function h(e){for(let t of[`id`,`name`,`detect`,`read`])if(!e[t])throw Error(`reader without ${t}`);return m.set(e.id,e),e}function g(e){let t=t=>e.filter(e=>e.role===t).length,n=(e,t)=>`${e} ${t}${e===1?``:`s`}`,r=t(`user`),i=t(`assistant`),a=[];i>r&&a.push(`${n(i,`answer`)} but ${n(r,`question`)}: a user selector may be out of date.`),r>i+1&&a.push(`${n(r,`question`)} but ${n(i,`answer`)}: an assistant selector may be out of date.`);let o=e.filter(e=>e.role===`user`||e.role===`assistant`);o.length&&o[0].role!==`user`&&a.push(`It starts with an answer: the order may be wrong.`),o.length&&o.at(-1).role!==`assistant`&&a.push(`It ends with a question: its answer is missing or still being written.`);let s=o.flatMap((e,t)=>t&&o[t-1].role===e.role?[t]:[]);return s.length&&a.push(`Two messages of one role in a row at ${s.map(e=>`${e}-${e+1}`).join(`, `)}: a message of the other role may be missing.`),a}async function _(t){try{let{selectors:n={}}=await e.browser.storage.local.get(`selectors`);return n[t]||{}}catch{return{}}}async function v(t=e.document,n=e.location?.href,r){for(let e of m.values()){if(!e.detect(t,n))continue;let i=l(e.selectors,r??await _(e.id)),a=f(e,e.read(t,n,i),n),o=g(a.turns);return o.length?{...a,warnings:o}:a}return null}async function y(t=e.document,n=e.location?.href,r){for(let e of m.values()){if(!e.detect(t,n))continue;let i=r??await _(e.id),a=l(e.selectors,i),o={};for(let[e,n]of Object.entries(a)){let r=[].concat(i[e]||[]).length;o[e]=n.map((e,n)=>{let i=null;try{i=t.querySelectorAll(e).length}catch{}return{css:e,found:i,override:n<r}})}let s={reader:e.id,name:e.name,host:new URL(n).host,parts:o,turns:{},warnings:[]},u=[`user`,`assistant`].filter(e=>c(a[e],t));for(let e of u)for(let n of u){if(e===n)continue;let r=[...t.querySelectorAll(c(a[e],t))].filter(e=>e.parentElement?.closest(c(a[n],t))).length;r&&(s.nested={...s.nested,[`${e} in ${n}`]:r})}try{let r=f(e,e.read(t,n,a),n);for(let e of r.turns)s.turns[e.role]=(s.turns[e.role]||0)+1;s.order=r.turns.map(e=>({user:`U`,assistant:`A`})[e.role]||e.role).join(` `),s.warnings=g(r.turns)}catch(e){s.error=String(e?.message||e)}return s}return null}function b(e,t){if(e===`<all_urls>`)return/^(https?|wss?|file|ftp|data):/.test(String(t));let n=/^(\*|https?|wss?|file|ftp|data):\/\/([^/]*)(\/.*)$/.exec(e);if(!n)return!1;let r;try{r=new URL(t)}catch{return!1}let[,i,a,o]=n,s=r.protocol.slice(0,-1);if(i===`*`?![`http`,`https`,`ws`,`wss`].includes(s):i!==s)return!1;if(a!==`*`){let e=a.replace(/^\*\./,``);if(a.startsWith(`*.`)?!(r.hostname===e||r.hostname.endsWith(`.${e}`)):r.hostname!==a)return!1}return RegExp(`^${o.replace(/[.+?^${}()|[\]\\]/g,`\\$&`).replaceAll(`*`,`.*`)}$`).test(r.pathname+r.search)}function x(e){return(e.textContent||e.getAttribute(`aria-label`)||e.getAttribute(`title`)||``).replace(/\s+/g,` `).trim()}function S(t=e.document,n=e.location?.href,r=[]){let i=[...m.values()].find(e=>e.list&&e.detect(t,n)),a=i?i.list(t,n):[...t.querySelectorAll(`a[href]`)].map(e=>({url:e.getAttribute(`href`),title:x(e)})),o=new Map;for(let e of a||[]){let n;try{n=new URL(e.url,t.baseURI)}catch{continue}if(n.hash=``,!/^https?:$/.test(n.protocol)||!i&&!r.some(e=>b(e,n.href)))continue;let a=String(e.title||``).trim(),s=o.get(n.href);(!s||a.length>s.title.length)&&o.set(n.href,{url:n.href,title:a})}return[...o.values()]}let C=e=>new Promise(t=>setTimeout(t,e));function w(e,t){for(let n=e?.parentElement;n;n=n.parentElement){let e=t.defaultView.getComputedStyle(n).overflowY;if(/auto|scroll|overlay/.test(e)&&n.scrollHeight>n.clientHeight)return n}return t.scrollingElement||t.documentElement}async function T(e,t,n,{wait:r=1200,still:i=2,rounds:a=300}={}){let o=t().length;for(let s=0,c=0;s<a&&c<i;s++){let i=t(),a=n===`top`?i[0]:i.at(-1),s=w(a,e);s.scrollTop=n===`top`?0:s.scrollHeight,a?.scrollIntoView?.({block:n===`top`?`start`:`end`}),await C(r);let l=t().length;c=l>o?0:c+1,o=Math.max(o,l)}return o}function E(e,t){let n=c(Object.entries(e).filter(([e])=>e!==`title`).flatMap(([,e])=>e),t);return()=>n?[...t.querySelectorAll(n)]:[]}async function D(t=e.document,n=e.location?.href,r,i){for(let e of m.values())if(e.detect(t,n))return T(t,E(l(e.selectors,r??await _(e.id)),t),`top`,i);return 0}async function O(t=e.document,n=e.location?.href,r=[],i){return await T(t,()=>{let e=new Set(S(t,n,r).map(e=>e.url));return[...t.querySelectorAll(`a[href]`)].filter(n=>{try{let r=new URL(n.getAttribute(`href`),t.baseURI);return r.hash=``,e.has(r.href)}catch{return!1}})},`bottom`,i),S(t,n,r)}function k(t=e.document,n=e.location?.href){for(let e of m.values())if(e.detect(t,n))return{id:e.id,name:e.name};return null}e.SaveMyChat={...e.SaveMyChat||{},kit:!0,FORMAT:t,ROLES:n,markdown:o,turn:s,selector:c,effective:l,turnsBy:d,suspicions:g,conversation:f,validate:p,reader:h,readers:m,readPage:v,inspect:y,present:k,listed:S,loadAll:T,loadChat:D,loadList:O,matches:b},e.document&&!/^(moz|chrome)-extension:$/.test(e.location?.protocol)&&e.browser?.runtime?.onMessage&&!e.SaveMyChat.listening&&(e.SaveMyChat.listening=!0,e.browser.runtime.onMessage.addListener(e=>{if(e?.type===`save-my-chat:present`)return Promise.resolve(k());if(e?.type===`save-my-chat:read`)return v();if(e?.type===`save-my-chat:inspect`)return y();if(e?.type===`save-my-chat:list`)return e.load?O(void 0,void 0,e.patterns):Promise.resolve(S(void 0,void 0,e.patterns));if(e?.type===`save-my-chat:load`)return D()}))})(),globalThis.SaveMyChat.defaults=[{id:`google-ai-mode`,name:`Google Search, AI Mode`,matches:[`https://www.google.com/search*`],chats:[`https://www.google.com/search?*udm=50*`],file:`readers/google-ai-mode.js`},{id:`github-copilot`,name:`GitHub Copilot`,matches:[`https://github.com/copilot*`],chats:[`https://github.com/copilot/c/*`],file:`readers/github-copilot.js`},{id:`chatgpt`,name:`ChatGPT`,matches:[`https://chatgpt.com/*`],chats:[`https://chatgpt.com/c/*`,`https://chatgpt.com/g/*/c/*`],optional:!0,origins:[`https://chatgpt.com/*`],file:`readers/chatgpt.js`},{id:`claude`,name:`Claude`,matches:[`https://claude.ai/*`],chats:[`https://claude.ai/chat/*`],optional:!0,origins:[`https://claude.ai/*`],file:`readers/claude.js`},{id:`gemini`,name:`Gemini`,matches:[`https://gemini.google.com/*`],chats:[`https://gemini.google.com/app/*`],optional:!0,origins:[`https://gemini.google.com/*`],file:`readers/gemini.js`}],(()=>{let e=globalThis.SaveMyChat;e.reader({id:`chatgpt`,name:`ChatGPT`,service:`chatgpt.com`,selectors:{user:[`[data-message-author-role='user']`],assistant:[`[data-message-author-role='assistant']`]},detect:(e,t)=>new URL(t).hostname===`chatgpt.com`,read(t,n,r){let i=e.turnsBy(t,{user:r.user,assistant:r.assistant}),a=t.title.replace(/\s*[-|]\s*ChatGPT$/,``).trim();return{title:a===`ChatGPT`?``:a,turns:i}}})})(),(()=>{let e=globalThis.SaveMyChat;function t(e,t){let n=e.getAttribute(`data-perf-row`)||``;return/user|human/i.test(n)?`user`:/assistant|claude|response|model|\bai\b/i.test(n)?`assistant`:t&&(e.matches(t)||e.querySelector(t))?`user`:`assistant`}e.reader({id:`claude`,name:`Claude`,service:`claude.ai`,selectors:{row:[`[data-perf-row]`],user:[`[data-testid='user-message']`],assistant:[`.font-claude-response`,`.font-claude-message`]},detect:(e,t)=>new URL(t).hostname===`claude.ai`,read(n,r,i){let a=e.selector(i.row,n),o=e.selector(i.user,n),s=a?[...n.querySelectorAll(a)].filter(e=>!e.parentElement?.closest(a)):[],c=s.length?s.map(n=>e.turn(t(n,o),n)):e.turnsBy(n,{user:i.user,assistant:i.assistant}),l=n.title.replace(/\s*-\s*Claude$/,``).trim();return{title:l===`Claude`?``:l,turns:c}}})})(),(()=>{let e=globalThis.SaveMyChat;e.reader({id:`gemini`,name:`Gemini`,service:`gemini.google.com`,selectors:{user:[`user-query .query-text`],assistant:[`model-response message-content`],title:[`.conversation.selected .conversation-title`,`[aria-current='page'] .conversation-title`]},detect:(e,t)=>new URL(t).hostname===`gemini.google.com`,read(t,n,r){let i=e.turnsBy(t,{user:r.user,assistant:r.assistant}),a=e.selector(r.title,t);return{title:a&&t.querySelector(a)?.textContent.trim()||i[0]?.text.split(`
`)[0].slice(0,80),turns:i}}})})(),(()=>{let e=globalThis.SaveMyChat;e.reader({id:`github-copilot`,name:`GitHub Copilot`,service:`github.com/copilot`,selectors:{user:[`.message-container[class*='user__']`],assistant:[`.message-container[class^='ai__']`,`.message-container[class*=' ai__']`,`.message-container[class*='_ai__']`]},detect:(e,t)=>new URL(t).pathname.startsWith(`/copilot`),read(t,n,r){let i=e.turnsBy(t,{user:r.user,assistant:r.assistant}),a=t.title.replace(/\s*·\s*GitHub( Copilot)?$/,``).trim();return{title:a===`Copilot`?``:a,turns:i}}})})(),(()=>{let e=globalThis.SaveMyChat;e.reader({id:`google-ai-mode`,name:`Google Search, AI Mode`,service:`google.com/search (AI Mode)`,selectors:{user:[`.ilZyRc`,`.L4dlbc`],assistant:[`.CKgc1d`]},detect:(e,t)=>new URL(t).searchParams.get(`udm`)===`50`,read(t,n,r){let i=(new URL(n).searchParams.get(`q`)||``).trim(),a=e.turnsBy(t,{user:r.user,assistant:r.assistant});return i&&a[0]?.role!==`user`&&a.unshift(e.turn(`user`,i,{from:`address`})),{title:i||t.title.replace(/ - Google Search$/,``),turns:a}}})})();var e=Object.assign({"../../../src/readers/chatgpt.js":`// ChatGPT, a conversation at https://chatgpt.com/c/<id> (or /g/<gpt>/c/<id>).
// Each message carries the role of its author in an attribute,
// data-message-author-role="user" or "assistant", which ChatGPT keeps for its
// own scripts across builds; read in page order, through turndown.
// NOTE: unverified - written from ChatGPT's known page structure, not yet run
// on the live page (docs/.agents/things-to-check.md). A new selector goes in
// front of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "chatgpt",
		name: "ChatGPT",
		service: "chatgpt.com",
		selectors: {
			user: ["[data-message-author-role='user']"],
			assistant: ["[data-message-author-role='assistant']"],
		},
		detect: (_doc, url) => new URL(url).hostname === "chatgpt.com",
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\\s*[-|]\\s*ChatGPT$/, "").trim();
			return { title: title === "ChatGPT" ? "" : title, turns };
		},
	});
})();
`,"../../../src/readers/claude.js":`// Claude, a conversation at https://claude.ai/chat/<id>.
// Fitted from Sett's snippet, drafted-snippets/claude-basic-handle.js (RR7): on the
// live page every message is an element with a data-perf-row attribute. A row's
// role is told by that attribute's value when it names one (user, human /
// assistant...), else by the user's message ([data-testid="user-message"]) inside
// it: a row without one is Claude's. The older layout, without rows (user-message
// and font-claude-response), is read when no row is found. The page's title is
// "<chat> - Claude".
// NOTE: the rows are Sett's, seen on 2026-11-27; what values data-perf-row takes
// was not seen, nor this reader run on the live page. A new selector goes in front
// of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	function roleOf(row, userCss) {
		const value = row.getAttribute("data-perf-row") || "";
		if (/user|human/i.test(value)) return "user";
		if (/assistant|claude|response|model|\\bai\\b/i.test(value)) return "assistant";
		return userCss && (row.matches(userCss) || row.querySelector(userCss)) ? "user" : "assistant";
	}

	SMC.reader({
		id: "claude",
		name: "Claude",
		service: "claude.ai",
		selectors: {
			row: ["[data-perf-row]"],
			user: ["[data-testid='user-message']"],
			assistant: [".font-claude-response", ".font-claude-message"],
		},
		detect: (_doc, url) => new URL(url).hostname === "claude.ai",
		read(doc, _url, sets) {
			const rowCss = SMC.selector(sets.row, doc);
			const userCss = SMC.selector(sets.user, doc);
			// a row inside another row is part of it, not a message of its own
			const rows = rowCss ? [...doc.querySelectorAll(rowCss)].filter((row) => !row.parentElement?.closest(rowCss)) : [];
			const turns = rows.length
				? rows.map((row) => SMC.turn(roleOf(row, userCss), row))
				: SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const title = doc.title.replace(/\\s*-\\s*Claude$/, "").trim();
			return { title: title === "Claude" ? "" : title, turns };
		},
	});
})();
`,"../../../src/readers/gemini.js":`// Gemini, a conversation at https://gemini.google.com/app/<id>.
// Gemini is built of custom elements that keep their names: a question is a
// <user-query> whose text is .query-text, an answer a <model-response> whose
// text is its <message-content>; read in page order, through turndown. The
// page's title is Gemini's own, so a chat is named by its title in the
// sidebar, else by its first question.
// NOTE: unverified - written from Gemini's known page structure, not yet run on
// the live page (docs/.agents/things-to-check.md). A new selector goes in front
// of its set (or as an override in the Readers tab); keep the old ones.
(() => {
	const SMC = globalThis.SaveMyChat;

	SMC.reader({
		id: "gemini",
		name: "Gemini",
		service: "gemini.google.com",
		selectors: {
			user: ["user-query .query-text"],
			assistant: ["model-response message-content"],
			title: [".conversation.selected .conversation-title", "[aria-current='page'] .conversation-title"],
		},
		detect: (_doc, url) => new URL(url).hostname === "gemini.google.com",
		read(doc, _url, sets) {
			const turns = SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant });
			const named = SMC.selector(sets.title, doc);
			const title =
				(named && doc.querySelector(named)?.textContent.trim()) || turns[0]?.text.split("\\n")[0].slice(0, 80);
			return { title, turns };
		},
	});
})();
`,"../../../src/readers/github-copilot.js":`// GitHub Copilot, the immersive chat at https://github.com/copilot/c/<id>.
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
| the runner | no |`},{role:`user`,text:`That was it, thanks.`}]},{format:`save-my-chat/0`,source:{reader:`google-ai-mode`,service:`google.com/search`,url:`https://www.google.com/search?q=turtles&udm=50`},title:`How long do turtles live?`,savedAt:t(25),turns:[{role:`user`,text:`How long do turtles live?`},{role:`assistant`,text:`Many species live **50 to 100 years**; some giant tortoises well over 150.`}]}],r=e=>`${e.source.reader} ${e.source.url}`,i=(e,t=1)=>({key:r(e),title:e.title,reader:e.source.reader,service:e.source.service,url:e.source.url,turns:e.turns.length,firstSavedAt:e.savedAt,savedAt:e.savedAt,saves:t}),a={library:Object.fromEntries(n.map((e,t)=>[r(e),i(e,t+1)])),...Object.fromEntries(n.map(e=>[`chat:${r(e)}`,e]))},o=!1,s=[{url:n[0].source.url,title:n[0].title},{url:`https://github.com/copilot/c/demo-2`,title:`Name this variable`},{url:`https://github.com/copilot/c/demo-3`,title:`A regex for a date`}],c=new Map,l=new Set,u=2;function d(e,t){return c.set(e,s.find(e=>e.url===t)??{url:t,title:`A chat`}),setTimeout(()=>{for(let t of l)t(e,{status:`complete`})},300),{id:e,url:t}}function f(e){let{url:t,title:n}=c.get(e),o={format:`save-my-chat/0`,source:{reader:`github-copilot`,service:`github.com/copilot`,url:t},title:n,savedAt:new Date().toISOString(),turns:[{role:`user`,text:`${n}?`},{role:`assistant`,text:`A made-up answer, gathered by the demo.`}]},s=a.library[r(o)];return a.library[r(o)]={...i(o,(s?.saves??0)+1),firstSavedAt:s?.firstSavedAt??o.savedAt},a[`chat:${r(o)}`]=o,{title:n,turns:o.turns.length,warnings:[],key:r(o)}}var p={reader:`github-copilot`,host:`github.com`,parts:{user:[{css:`.message-container[class*='user__']`,found:2,override:!1}],assistant:[{css:`.message-container[class^='ai__']`,found:1,override:!1}]},turns:{user:2,assistant:1},order:`U A U`,warnings:[`The chat ends with a question: its answer may still be coming.`]};function m(e){let r=Object.values(a.library);switch(e.type){case`save-my-chat:present`:return{id:`github-copilot`,name:`GitHub Copilot`};case`save-my-chat:inspect`:return p;case`save-my-chat:since`:return{savedAt:t(26),saved:2,now:3,grew:1};case`save-my-chat:save`:return{title:n[0].title,turns:3,warnings:[]};case`save-my-chat:library`:{let t=(e.query||``).toLowerCase().split(/\s+/).filter(Boolean);return r.filter(e=>{let n=[e.title,e.service,...a[`chat:${e.key}`].turns.map(e=>e.text)].join(`
`).toLowerCase();return t.every(e=>n.includes(e))}).sort((e,t)=>t.savedAt.localeCompare(e.savedAt))}case`save-my-chat:list`:return{reader:`github-copilot`,name:`GitHub Copilot`,chats:s.map(e=>({...e,savedAt:a.library[`github-copilot ${e.url}`]?.savedAt??null}))};case`save-my-chat:collect`:return f(e.tabId);case`save-my-chat:load`:return 2;case`save-my-chat:library-chat`:return a[`chat:${e.key}`]??null;case`save-my-chat:library-forget`:delete a.library[e.key];return;default:return}}globalThis.browser={runtime:{getManifest:()=>({version:`demo`}),getURL:e=>e,sendMessage:async e=>structuredClone(m(e))},tabs:{query:async()=>[{id:1,url:n[0].source.url}],create:async({url:e})=>(e.endsWith(`#gather`)&&(location.hash=`#gather`),{id:0}),update:async(e,{url:t})=>d(e,t),onUpdated:{addListener:e=>l.add(e),removeListener:e=>l.delete(e)}},windows:{create:async({url:e})=>({id:1,tabs:[d(u++,e)]}),remove:async()=>c.clear()},storage:{local:{get:async e=>Object.fromEntries([].concat(e).map(e=>[e,structuredClone(a[e])])),set:async e=>Object.assign(a,structuredClone(e))}},permissions:{contains:async e=>!e.permissions||o,request:async()=>(o=!0,!0)}};var h=globalThis.fetch.bind(globalThis);globalThis.fetch=async(t,...n)=>{let r=typeof t==`string`&&/^\/readers\/([\w-]+\.js)$/.exec(t)?.[1],i=r&&e[`../../../src/readers/${r}`];return i?new Response(i):h(t,...n)};