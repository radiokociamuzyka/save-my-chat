# The debug gate: an agent looking at the live pages

A reader is fitted to a webapp's page, and only a live page shows what
the webapp draws today. The debug gate lets an agent (Claude Code, or
any MCP client) look at the pages open in your Firefox while you are
there: outline a page, see what a selector finds, try selectors on a
reader without keeping them, mark on the page what it thinks should be
read, and read what you point at.

It is in the **debug build** only (`task run`), never in what is packed
for AMO (`task build`).

## How it connects

```
Claude Code ──stdio──> scripts/debug/server.mjs   (the MCP server, .mcp.json)
                          │ a socket only you can open
                          v
                       scripts/debug/host.mjs     (the native host, started by Firefox)
                          │ native messaging
                          v
                       src/debug/background.js    (the extension's debug build)
                          │ scripting.executeScript
                          v
                       src/debug/page.js          (in the tab: look, mark, point)
```

1. Once per machine: `task debug:install`. It writes the native host's
   manifest (`~/.mozilla/native-messaging-hosts/save_my_chat_debug.json`,
   only this extension may start it) and a launcher running `host.mjs`
   with your Node. `task debug:install -- --remove` undoes it.
2. `task run`: Firefox with the debug build. Its options have a
   **Debug** tab: **Allow native messaging and connect**.
3. In Claude Code in this repository, allow the `save-my-chat-debug`
   server (`/mcp`).

On a site no reader covers, the Debug tab's **Allow this site** grants
the extension that one site (the debug build may ask for any).

## The tools

| Tool | What it does |
| --- | --- |
| `tabs` | the open tabs: id, address, title, the reader whose pages it is on |
| `open` | an address opened in a new tab |
| `outline` | the page as indented lines, `tag#id.class[data-*]`, alike siblings folded (`×N`) |
| `query` | what a selector finds: how many, their paths, attributes, text |
| `element` | one element: its HTML, text, and selectors that find it, with their counts |
| `highlight` / `clear` | marks drawn over the page, labelled (user, assistant, title, list), until cleared |
| `point` / `picks` | you click elements on the page and label them; the agent reads your picks |
| `read` / `inspect` | what the tab's reader reads now; what it sees, without the text |
| `try` | what the reader would read with given selectors in front of its own, not kept |
| `list` | the chats the page lists (`load: true` scrolls the list to its end) |
| `sample` | the page and what is read from it saved into `resources/samples/`, for a share listed in `.map.json` only |

The tools take data, never code: selectors go to `querySelectorAll`,
nothing is evaluated (rule 5).

## What leaves the page

What a tool reads of a page goes to the agent, and from it to its model.
Connect while you want that, on pages you are fine sharing so; the
Debug tab says the same before you connect. The extension itself still
sends nothing anywhere: native messaging talks to a program on your
machine.

## Pointing

**Point here** in the Debug tab (or the agent's `point`) brings the tab
to the front. Hover shows the element under the pointer; a click picks
it, and a bar at the bottom asks what it is: *user*, *assistant*,
*title*, *list*, *other*, with a note if you like; *parent* takes the
element around it. Esc or *stop pointing* ends it. Each pick keeps the
element's path, attributes, text and the selectors that would find it.
What the agent marked against what you picked is the lesson: the agent
keeps it in `docs/.agents/`.
