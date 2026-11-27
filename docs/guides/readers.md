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
		// Sets of candidates per part, newest first. Generated class names
		// change with each build of a webapp; add the new one in front and
		// keep the old ones while they may still be served.
		selectors: {
			user: [".q7Xk2", ".from-user"],
			assistant: [".r9Lm0", ".from-bot"],
		},
		detect: (doc, url) => new URL(url).pathname.startsWith("/c/"),
		read(doc, url, sets) {
			// sets = selectors with the user's overrides in front
			return { title: doc.title, turns: SMC.turnsBy(doc, { user: sets.user, assistant: sets.assistant }) };
		},
	});
})();
```

- `SMC.turnsBy(doc, roles)` collects every element matching any role's set
  **in page order**, the way one `querySelectorAll` over all classes does.
  A match nested in a turn of the same role is skipped as a duplicate; one
  of another role becomes its own turn and is cut out of the outer text.
- `SMC.turn(role, elementOrText)` makes one turn by hand; an element is
  converted by turndown with its GFM plugin (`src/vendor/`), links made
  absolute, buttons, scripts, svg and `aria-hidden` parts dropped.
- `SMC.selector(list)` joins a set into one CSS selector, skipping invalid
  candidates, so a broken override does not stop the reader.
- `detect` must be cheap and false on pages without a conversation: the
  popup asks every reader in turn.
- Every selector lives in `selectors`; webapps change markup, and that is
  the one place to fix.

## Fixing a reader without a release

The user's own candidates go in front of a reader's sets from
`storage.local`:

```js
browser.storage.local.set({ selectors: { "google-ai-mode": { user: [".newClass"] } } });
```

The options page will edit them (phase 1); until then the line above works
in the extension's console (`about:debugging` → Inspect).

## Listing it

1. Declare it in `resources/data/chats.yaml` with `status: default`, its
   `reader` file, `domains`, `matches` and conversation addresses.
2. `task chats`: `src/core/readers.js` and the manifest's
   `host_permissions` are written from the YAML (never by hand; a test
   says when they are stale).
3. `task run`, open a conversation, click the toolbar button.

## Testing it

- Save a real conversation page (Firefox: *Save Page As…*, "Web Page, HTML
  only"), strip personal content, and put it in `tests/fixtures/<id>.html`.
- Add a case to `tests/readers.test.js` loading it with
  `load([...KIT, "readers/<id>.js"], { html: fixture("<id>.html"), url })`.
- A reader not yet checked against the live webapp starts with
  `// NOTE: unverified` and is listed in `docs/.agents/things-to-check.md`.

## Prototypes (phase 2)

A prototype is the user's own copy of a reader, edited in the options page
and stored in `storage.local`. It runs through Firefox's `userScripts` API
in its own world, with the same kit loaded before it, and replaces the
default reader with the same matches while it is on.
