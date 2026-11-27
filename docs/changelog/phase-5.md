# Phase 5: more webapps

Append-only. The owner's words are kept word for word.

## 2026-11-27, the owner opens phase 5 (the chat, word for word)

> great work there! testing shows nothing to be adnoted for me i think at this point. according to decisions there you had situation when two diffrent licenses met and had to check if there is no problem with their compatibility - add as scenario in almanac, explain case and conclusions there. all of that you can make in phase 5 that will bring us more steps upnext related to diffrent chats, upgrade of interfacing, more integrations related with listing of available chats and gathering them all one by one (because sometimes i want just to perform standard backup) and more things like for example packing it all into zip file we had gather. are we ready? if yes then proceede your duties my friend

**Decision:** phase 4 is taken as tested in the wild, with nothing to
fix. Phase 5 grows beyond new readers:

- the licenses met in phase 4 (ZenFS, LGPL-3.0, built into an MPL-2.0
  extension) become an almanac case, with what each license asks and
  how the extension meets it;
- the library packed into one `.zip`, a backup of every chat saved,
  as Markdown and JSON in the folders of the downloads;
- the conversations a webapp lists (its sidebar) found by the reader,
  and gathered one by one into the library at the user's click: each
  opened in a background tab of that webapp, read, closed. Nothing is
  sent anywhere but the webapp's own pages loaded, as when the user
  opens them, one at a time; then the zip;
- the readers of the `planned` chats, each host an optional permission
  granted from the Readers tab;
- the popup and options brought up to these actions.

The merges into `master` are asked for again (the hand-over ended with
phase 4).

### RR7 (issue #122, word for word)

> some where handled but not all were working
>
> - claude reads right way list, but gathers nothing due to wrong selectors - look at drafts
> - ai mode google search does not see any list
> - at gemini listed chats and gathers nothing - like in claude case does not see any message
> - same case of chatGPT - sees list, no mesage found at chat... also requires to scroll down list of chats there, for me at first loads around 20 of conversations, after scroll down a bit it found 31 conversations, then another scroll down loads another batch and shows 47. it has to load and wait, load and wait to get full list, same strategy at chats (some of them can contain hundrets of messages)
> - initialized also some drafts related with items that can be also supported

**Decision:** what each point says, and what follows:

- **Claude lists, reads nothing.** Its messages are not where the
  reader looked: Sett's snippet (`drafted-snippets/claude-basic-handle.js`)
  reads every `[data-perf-row]` row. The reader reads those rows, a
  row's role told by its attribute's value or by the user's message
  inside it.
- **ChatGPT and Gemini list, read nothing in a gathered chat.** Their
  selectors are the webapps' long-standing ones, so the suspect common
  to all three is the background tab: never shown, a webapp may not
  draw its chat there. Gathering now opens its chats in a window of its
  own, where the tab is the one shown. Whether the selectors hold on
  a chat in front of the user is asked in RR8.
- **Long lists and long chats load as they scroll.** Before handing the
  list over, the popup scrolls the page's list to its end, waits, and
  again, until no more chats come; before reading a gathered chat, its
  page is scrolled to the top the same way, until no older messages
  come.
- **AI Mode lists nothing.** Its history is not found as links of the
  address in `chats.yaml`, which wanted `q` before `udm=50`: any order is
  taken now, and RR8 asks what its history is made of.
- **The new drafts** (DeepSeek, Google AI Studio, a Gradio space on
  Hugging Face, Grok on grok.com and x.com, NotebookLM, Open WebUI) go
  into `chats.yaml` as `planned`; each waits for its snippet. Open WebUI
  runs at an address of its user's own, so it cannot be declared as the
  others: Q15.

