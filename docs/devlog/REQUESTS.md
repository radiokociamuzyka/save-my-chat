# REQUESTS: requirement requests to the owner

The mirror of INQUIRIES: work on the owner's side that the agents need
done for the project to move, each as `## RR<n>. <title>` with *Why:* (what
waits for it) and *How:* (the steps, as short as they can be). Agents write
the requests above the line; the owner reports below it, or in the chat
(Sett, 2026-11-27: "this makes us equal toward planning and leading across
project").

Once reported, the owner's words move word for word into
`docs/changelog/phase-<n>.md` as `### RR<n>`, and the request leaves this
file. Numbers are given once and never reused. Each RR is also an issue,
labelled `request` (`task github:devlog`), closed when it leaves this file.

---

## RR9. The debug gate opened once, and the readers tried again

*Why:* the agent cannot see the live webapps; with the gate it can,
while you are there to point at what it should read. The readers'
fixes of RR8 (ChatGPT's list and rows, Claude's values) wait for the
same live look.

*How:*
1. Once: `task debug:install` (writes the native host's manifest into
   `~/.mozilla/native-messaging-hosts/` and a launcher into
   `~/.local/share/save-my-chat/`; `-- --remove` undoes it).
2. `task run` (now the debug build; since RR9's first try it runs
   Firefox on a profile kept in `dist/firefox-profile/`, so log in to
   the webapps there once), open the extension's options (the toolbar
   button's menu, **Library and settings**), tab **Debug**, **Allow
   native messaging and connect**. Firefox, a snap, may ask once whether
   it may start `save_my_chat_debug`: allow it.
3. In Claude Code in this repository, allow the `save-my-chat-debug`
   server of `.mcp.json` (`/mcp`), and tell Cleo which tab to look at.
4. With the gate or without: gather on ChatGPT again; does the list
   reach the end? Is a gathered ChatGPT or Claude chat read?
5. `resources/samples/.map.json`, your public shares, when you have
   them.
