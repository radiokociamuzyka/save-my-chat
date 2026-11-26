# Writing a reader

A reader turns one webapp's page into a conversation of the
[unified format](format.md). It is one classic script in `src/readers/`,
loaded after `src/core/kit.js` into the page, sharing `globalThis.SaveMyChat`.

```js
(() => {
	const SMC = globalThis.SaveMyChat;
	SMC.reader({
		id: "example-chat",               // unique, also the folder of saved files
		name: "Example Chat",             // shown in the popup and options
		service: "chat.example.com",
		detect: (doc, url) => new URL(url).pathname.startsWith("/c/"),
		read(doc, url) {
			const turns = [...doc.querySelectorAll(".message")].map((el) =>
				SMC.turn(el.matches(".from-user") ? "user" : "assistant", el.querySelector(".content")),
			);
			return { title: doc.title, turns };
		},
	});
})();
```

- `SMC.turn(role, elementOrText, extra)` makes one turn; an element is
  turned into Markdown (paragraphs, lists, code with its language, tables,
  links made absolute; buttons, scripts and `aria-hidden` parts dropped).
- `detect` must be cheap and false on pages without a conversation: the
  popup asks every reader in turn.
- Keep every selector in one `SELECTORS` object at the top. Webapps change
  markup; that is the one place to fix.

## Listing it

1. Add `{ id, name, matches, file }` to `src/core/readers.js`.
2. Make sure `host_permissions` in `src/manifest.json` covers `matches`.
3. `task run`, open a conversation, click the toolbar button.

## Testing it

- Save a real conversation page (Firefox: *Save Page As…*, "Web Page, HTML
  only"), strip personal content, and put it in `tests/fixtures/<id>.html`.
- Add a case to `tests/readers.test.js` loading it with
  `load(["core/kit.js", "readers/<id>.js"], { html: fixture("<id>.html"), url })`.
- A reader not yet checked against the live webapp starts with
  `// NOTE: unverified` and is listed in `docs/.agents/things-to-check.md`.

## Prototypes (phase 2)

A prototype is the user's own copy of a reader, edited in the options page
and stored in `storage.local`. It runs through Firefox's `userScripts` API
in its own world, with the same kit loaded before it, and replaces the
default reader with the same matches while it is on.
