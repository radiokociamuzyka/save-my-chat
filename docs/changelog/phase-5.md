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


### RR8 (issue #130, word for word)

> # nope, another fails
>
> - loading of chatgpt stops, it still does not get all that chats, only loads some of them. 
> - for handling claude i extended further that drafted snippet
> - i think adding you gate for debugging in developer mode with additional webmcp in frontend and access to addon by mcp can solve our lack of hands for you to touch real-life examples
> - we will need to prepare samples of all available interfaces, so i will make share public links of mine conversations and give them to you in `resources/samples/.map.json` and each example `resources/samples/DN_example.com/` dir with sampling data garthered - this give us result we predict to gather from there in later time.

And in the chat, with the drafts: "i had done what i could in short run,
hope that i was usefull there on all places i made something. that idea
among issue's commentary about mcp and webmcp sounds for me as
promising. go ahead, your turn"

**Decision:** what each point says, and what follows:

- **ChatGPT's list stops short.** Its next batch comes when a mark at the
  list's end comes into view; a list already at its end does not bring
  it into view again, and a batch slower than one wait looked like the
  end. The load-and-wait now steps back from the end before going to it,
  each round, and takes the end after three quiet rounds of 1.5 s; every
  chat seen on the way is kept, in case the page drops the ones scrolled
  past. The popup says to keep it open while it scrolls.
- **Claude's snippet** gives the values: `human` for the user's rows,
  `assistant` for Claude's; the reader tells rows by them first.
  **ChatGPT's notes** (`drafted-snippets/chatgpt.js`): the user's
  messages carry the class `group/user-message`, all messages sit in one
  transcript; the reader reads the transcript's children as rows when
  the author attribute finds nothing.
- **The debug gate.** In the debug build only (`task run`), never in
  what goes to AMO: the extension's Debug tab connects, by Firefox's
  native messaging, to a host on the machine (`task debug:install`),
  which an agent's MCP server (`.mcp.json`) reaches. Its tools outline a
  page, find what a selector finds, try selectors on a reader without
  keeping them, draw marks over what the agent thinks should be read,
  and let the user point at elements and label them. They take
  selectors, never code (rule 5). What they read goes to the agent, and
  the Debug tab says so before connecting. WebMCP, which Firefox does
  not have, is PP3.
- **Samples.** `resources/samples/.map.json` is Sett's to write; the
  gate's `sample` tool saves a page there only when its address is in
  that map, scripts left out and e-mail addresses masked, to be looked
  over before a commit.

### Q15 (issue #129, word for word)

> I think option `a` is here required.
>
> self-hosted solutions can have every kind of url pattern so very selective declaration can only be a collar for us here. wide openness is required for proper work at that stage of development. reviewers at Mozilla that can approve it stays silent for many hours now so when they notice our existence and only once they provide an opinion on something for the first time will their voice begin to carry any weight for us. If we receive feedback indicating that they do not consent to allowing access beyond a limited list of AI-chat providers, then we will reconsider that very `Q`.
>
> add that to predicted scenario where we in order to solve that situation it is reconsidered to discuss again about that answer here.
>
> right now this extension need to be able access us tools to recognize web ui dom elements, define proper selectors, handle new changes of known pages and analize new websites - here i think that we can use webmcp and classic mcp for debug purposes and sandboxing. 
>
> make yourself comfortable suite to look at items with me in dev's debug mode.
>
> I need to has easy way to point you what we want reach and you to be able show me what you was thinking should be grabbed - results of diffrences between your assumptions and my corrections can also be a lesson for you.

**Decision:** a). A reader of a self-hosted webapp is a default file;
the user types its address in the Readers tab; `https://*/*` and
`http://*/*` are optional host permissions, and only the typed one is
asked for. It lands with the first such reader (Open WebUI, from a
sample). Predicted (VISION, *Predicted scenarios*): if AMO's reviewers
refuse access beyond a list of AI chat providers, Q15 is opened again.
The debug build declares the two already, for the gate to look at any
site the user allows. Sett's corrections of what the agent marked are
kept as picks; what was learnt from them goes to `docs/.agents/`.

### Inquiry: a delegated media container (INQUIRIES, word for word)

> ### delegated mediacontainer where images are
>
> logo for icon and other images including more massive files will be thrown there and loaded to be prepared for each release's graphics.
>
> also that stuff can be added in `manifest.json` of page and into documentation we produce to throw onto readthedocs.

**Decision:** the index Sett wrote, `resources/media/.index.json`, is
kept (a trailing comma taken out, so it parses). Fetching its files for
a release - the icon into the manifest's sizes, the poster and banner
into the site and the Read the Docs pages - is a TODO of phase 6, where
icons and the store listing are; it fetches at build time only, never
from the extension.

### RR9, the first try (issue #133, word for word)

> attempts brings errors at step 2 
>
> if firefox were closed dialog windows pops up and tells that profile does not exist
>
> if other window were open it makes error message in shell. 
>
> this is fill output of `task run` in second case:

(The output that followed: `npm run extension`'s build stopped by
"Error: Found another Vite build process for this project (PID
1626923). Pass --bypass-lock to bypass this check.", then
`task: Failed to run task "run": exit status 1`.)

> any ideas?

And in the chat: "ready. check that issues there"

**Decision:** two troubles, both of `task run` (almanac:
snap-private-tmp-run, npx-orphan-watch). Firefox on Sett's Ubuntu is a
snap, whose `/tmp` is its own: web-ext's temporary profile there did not
exist for it. Firefox now runs on `dist/firefox-profile/`, kept, which
keeps the webapps' logins too. The lock was a `vite build --watch` left
running by the first try, `npx` killed and its child not; Cleo stopped
it, and `run.mjs` now starts Vite and web-ext as node processes in groups
of their own and stops both groups. RR9 stays open for the steps after.

### PP3 (issue #132, word for word)

> sure, if it works then the choice is yours
>
> # you have my approval
>
> this should be more choice of digital entity than humanoid, so targeted main clients _(AI)_ know better what they prefer here than producer _(Human)_ IMO at least.

**Decision:** approved, the choice left to the agent. Cleo's: WebMCP
comes when it can work - when Firefox has `navigator.modelContext` - as
one more way into the same tools; the classic MCP serves until then.

### RR9, the gate opened (in the chat, word for word)

> i think we are ready to use our mcp. can you controll that firefox there?

> alright, now we are logged in. look at how it looks inside there in a live ui

> in opened tabs there you can find more than one chat app. look at them all and bring your notes into scrapnotes in dir devlog so your knowledge will be not lost. consider also check that scrolling down of sidebar where listed are conversation inside `chatgpt.com`. reading of long chats requires inspecting if loading of more content is performed or after scrolling as far as possible now checking if our position after pause to let loading be done we are yet able to scroll into further past. besides that all we need to export somehow artifacts and linked them inside where across all that conversations their where born. as someone said once: small steps method. all undone in phase 5 and before that waits for us pull from where they are now and with all other resulting steps from this all we now discuss should be placed in phase 7 and further ones if you think to split them more. and yes - marks maches! at least that `assistant` and `user` ones there.

**Decision:** the gate works end to end on Sett's snap Firefox (the
native host started through the desktop portal). Cleo looked at
ChatGPT, Claude, AI Mode, DeepSeek, Grok and Grok on X; the notes are
seven scrapnotes in `docs/devlog/` (structure only, no text of the
conversations). What they found:

- **ChatGPT** reads one message in four: its messages are found by
  `data-chatgpt-search-unit-key` ending in `:user` / `:assistant`
  (Sett: the marks match), a hidden heading to leave out; its chats are
  virtualized. Its sidebar loads 31 chats in a background tab and 47 in
  front: lists load only while shown.
- **Claude** reads right; one listed address carries `?artifact=`.
- **AI Mode's history** is buttons with thread ids (215), not links.
- **DeepSeek**: `.ds-message`, virtualized, a Cloudflare check over it.
- **Grok**: a chat open is needed on both.
- **Long chats** are read while they scroll, each turn kept by its key,
  until the page, after a pause, cannot go further into the past (Sett's
  words); counting elements cannot tell it in a virtualized chat.
- **Artifacts** saved beside their chats and linked where they were born.

Phase 5's undone items and these steps go to phases 7 (the readers on
the live pages), 8 (artifacts) and 9 (more webapps), in small steps;
whether the release for everyone (phase 6) waits for them is Q16. RR9
leaves REQUESTS.

