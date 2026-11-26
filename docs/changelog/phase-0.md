# Phase 0: the skeleton

Append-only. The owner's words are kept word for word.

## 2026-11-26, the inquiry that started the project (chat with Cleo)

> hi there Cleo. here we have something that we want at the beggining initialize like it should be as BOS project. this project will be extension for firefox to read pages like AI mode of google search conversations or copilot conversations on github or other chatting webapps like that. I have that scripts we want to be injected in each of supported web chat interface and i want to create prototypes to be used or customize existing scripts provided as default ones. to provide initial ways of how this project should be handled by you and your contributions look at some of earlier ways we done work: `https://sarverott.github.io/P-jol-roll/` with related links where you can see all related suggestions based on history of work, `https://github.com/Sarverott/blacksmith-organization-system` that is the core of BOS, `https://github.com/Sarverott/amoorion` with all flows of work there is been done, `https://github.com/Sarverott/apokaliptium.online` including the background of that developement and official documentation by mozzila how to develope and web browser extension including ways it can be released in `https://addons.mozilla.org`. we can beggin i think. proceede

The repository's description on GitHub, written by Sett:

> extension for firefox to export your AI chat history out of webapps and save them on your local machine in clear unified formatting

## What was done

Cleo laid out the skeleton (TODO phase 0): the BOS anatomy, this devlog,
the reader contract, the unified format with Markdown and JSON output, the
background, popup and options pages, two draft readers, and the checks.
Questions Q1-Q6 asked in BRAINSTORM.md. Nothing committed (Q4).

## 2026-11-26, the owner's answers to Q1-Q6 (ORDERS.md, word for word)

### Q1. License

> MPL-2.0

**Decision:** MPL-2.0; `LICENSE` holds its full text, `package.json` names it.

### Q2. The add-on's id

> save-my-chat.radiokociamuzyka.pl

**Decision:** `@save-my-chat.radiokociamuzyka.pl`. Firefox accepts only a
GUID or an email-like id (`^[a-zA-Z0-9-._]*@[a-zA-Z0-9-._]+$`), so the
plain domain fails validation; with a leading `@` it is valid and is the
form Mozilla itself recommends (`@name.dev`). The almanac keeps the case
(`docs/almanac/cataclistics/gecko-id-format.md`).

### Q3. AMO: listed, or self-distributed

> now unlisted, after phase 3 listed

**Decision:** unlisted signing now. "Phase 3" meant the phase of more
webapps when asked; the plan renumbered after the inquiries below, and
that phase is now phase 5. Listed after it.

### Q4. Who commits here

> you need to commit after each step you been made for sure if step is more troubling (e.g. you made something, it broth some issues, solving gives change of view on topic, initial idea of step had to be adjusted, almanac stuff and Qs are broth in here as conclusions and/or reflections - i see here at least 5 commits, but this i leave to you).
> we need full set of development branch, per contributor dev branch, branch for Jarvis and Joker, also separed dependabot branch etc.
> when you commit you should sign yourself as co-author of it - be proud and show your work Cleo

**Decision:** Cleo is confirmed and listed in `.github/AUTHORS`; it commits
each step on `dev/Cleo`, splitting a troubled step into its conclusions.
Branches: `development`, `dev/Sarverott`, `dev/Cleo`, `dev/Jarvis`,
`dev/Joker`, `dev/dependabot`.

### Q5. Where the existing scripts are

> as you mentioned in `*Lean:*` but change path: `src/readers/drafted-snippets/`

**Decision:** snippets land in `src/readers/drafted-snippets/`, outside the
packaged readers; Cleo fits each into a reader and keeps the snippet.

### Q6. A build step

> for now no boundler or building from typescript.
>
> maybe when we will bring astro, vue and bulma here later on.

**Decision:** no build step for the extension now; revisited with the
frontend phase (Astro, Vue, Bulma).

## 2026-11-26, the owner's inquiries (INQUIRIES.md, word for word)

> ## every Q and PP becomes issue
>
> i want it to be fully integrated with github
>
> ## github integration of more
>
> milestones and phases in milestones and project planning on github
>
> discussion should bring announcements and almanac debates around known cases and solutions as Q&A topic
>
> workflow of standard ways of developement and husky here should automate standard things we do
>
> biome and playwright will be useful too
>
> vue will keep frontend componenting
>
> bulma will give us standarized stylization
>
> astro will allow us to preview more advanced things build-in like settings page of extension and manuals to it. by the way viewer of our grabbed conversations will help too.
>
> ## be inspired by my code that gives me proof of work
>
> this is how i saved these conversations until now:
> ```js
>
> var head = document.getElementsByTagName('head').item(0);
>     var script = document.createElement('script');
>     script.setAttribute('type', 'text/javascript');
>     script.setAttribute('src', 'https://unpkg.com/turndown/dist/turndown.js');
>     head.appendChild(script);
>     window.onload = function() {
>         var turndownService = new TurndownService()
>
> Array.from(document.querySelectorAll(".ilZyRc, .L4dlbc, .CKgc1d")).map((x)=>[(x.className!="CKgc1d")?"\n\n\t--- USER ---\n\n":"\n\n\t--- AGENT ---\n\n", turndownService.turndown(x.innerHTML)].join("\n---\n")).forEach((x)=>console.log(x))
>     };
>
>
> ```
> currently not all of them are exported correctly - missing for example user messages.
> this code of mine works fine to me and you can rebuild it to fit what is needed here.

## 2026-11-26, in the chat with Cleo (word for word)

> well, almost works. still some data is lost by your current code. i had used turndown and this code i wrote in live devtools of firefox: `Array.from(document.querySelectorAll(".ilZyRc, .L4dlbc, .CKgc1d")).map((x)=>[(x.className!="CKgc1d")?"\n\n\t--- USER ---\n\n":"\n\n\t--- AGENT ---\n\n", turndownService.turndown(x.innerHTML)].join("\n---\n")).forEach((x)=>console.log(x))` - it works well to be proof of work that you can change to fit more universal adaptation of grabber. remember that each time google is recompiling their build of webapp classes are regenerated as i suppose so these has to be sets of variables there on selectors. i just tested your demo of `v0.0.1` extension - great work there, some minor changes are required and later on we will add more functions and gui stuff there. Qs was answered, inquiries added. as usual follow the drill of BOS standard flow of dev work
