# Phase 1: the first readers for real

Append-only. The owner's words are kept word for word.

## 2026-11-26, the owner's answer to Q7 (issue #14, then ORDERS.md, word for word)

### Q7. The "minor changes" seen in the v0.0.1 demo

> that's right, and remember that each change by commit is in semver `vX.Y.Z` bump of the `Z`, each phase is combining all changes of dev branches in development, then creation of PR from development to master. each PR is lounching build distribution packed extension and release tagged as versionated and latest pointer. up next we will prepare also paralel docs publication on ReadTheDocs (excluded there all that will be on repository wiki), static page of project at `github-pages` branch and also wiki for developers and contributors with almanac and devlog been there generated and published in more than one language.
>
> - https://github.com/radiokociamuzyka/save-my-chat.wiki.git
> - https://github.com/radiokociamuzyka/save-my-chat/discussions/17
>
> this is the way of BOS development.

**Decision:** the "minor changes" are the flow itself. Every commit on a
`dev/*` branch bumps `Z` (pre-commit hook, `scripts/version.mjs`); a
phase ends with the dev branches gathered in `development` and a pull
request into `master`; a pull request builds the packed extension, and
its merge into `master` releases it as tag `vX.Y.Z`, marked the latest,
with a fixed download address for the latest. Read the Docs, the
`github-pages` site and the generated multilingual wiki are planned as
items of phase 2.

## 2026-11-26, the owner's inquiry (discussion #17, then INQUIRIES.md, word for word)

> ## feed with updates and latest changes
>
> (discussion #17, Announcements, https://github.com/radiokociamuzyka/save-my-chat/discussions/17)
>
> short descriptions and reference to:
> - changelog posts notices with links
> - proposals with link to issue and dedicated discussion around proposal
> - phases changes and updates of concepts
> - releases public introductions
> - other announcements

## 2026-11-27, the owner's decisions on PP1 and PP2 (issues #15 and #16, then ORDERS.md, word for word)

### PP1

From issue #15, Sett, 2026-11-27:

> # Approved
>
> sounds reasonable
>
> also add explorer of these stored files with browserfs and isomorphic-git mechanics so we will be able to threat it as gist material by including octokit integration

**Decision:** approved. The library (an index in `storage.local` of what
was saved, search, re-export) joins the viewer of phase 4. The explorer of
stored files on BrowserFS and isomorphic-git, and gists through Octokit,
are planned there too, but two things come first: BrowserFS is archived
and continued as ZenFS (Q8), and a gist sends a conversation to GitHub,
which rule 4 holds for the owner (Q9).

### PP2

From issue #16, Sett, 2026-11-27:

> # Approved by me
>
> but this brings us topic of declaring these domains and chat patterns assigned to them
>
> write declaration of that chats in yaml file in `resources/data/` dir

**Decision:** approved. The webapps, their domains and the address
patterns of their chats are declared in `resources/data/chats.yaml`; a
test holds `src/core/readers.js` to it. How the declaration reaches the
extension, which cannot read YAML as written, is Q10.

## 2026-11-27, the owner on signing (the chat, then ORDERS.md, word for word)

### Signing

From the chat, Sett, 2026-11-27:

> signing will be carried later, for sure not before that preparations to official publishing in mozzila extension registry. now we just use it as temporary add-on.

**Decision:** no AMO secrets and no signed `.xpi` for now. Releases stay
unsigned zips, installed as a temporary add-on, until the preparation of
the listed release in phase 6; Q3's "unlisted until then" becomes
"temporary until then". The signing step of `release.sh` stays, inert
without the secrets.

## 2026-11-27, the owner's inquiries (INQUIRIES.md, word for word)

> ## dependabot conflict that we need to solve
>
> merging by hand dependabot's PRs brings situations like that we have right now in "dev/dependabot". pull it, solve it and add copilot's prompts for Jarvis to take care of these topics without my interventions and with approval from Joker in codex agent `gpt6.2` under your supervision when it lands in development.
>
> right now i made there commenting-out all that i recognize as affected by that collision... I know that it was not critical or something but i want to take care of and here we have most common problem made by humans
>
> The most common problem encountered when developers take over existing projects is a lack of diligence and a "couldn't-care-less" attitude.
>
> this is why agents cannot be dismissive due to a lack of attentiveness in what he does nor recklessly ignoring the problems encountered at work, solely to provide the user with the validation they seek for their own misguided views
>
> This is part of the underlying philosophy behind the architecture of the BOS environment. 
>
> You are at the voice of order and autopilots of crafting - it is you who will be in charge of both the digital and physical reality once I am gone.

**Decision:** `dev/dependabot` was cut before Q7 and never followed
`development`, so dependabot bumped the actions of the one workflow its
branch had and left `release.yml` and `devlog.yml` on `@v5`. Sett's
commented-out lines were not found in any pushed or local branch; the
branch was merged up from `development` and the two workflows brought to
v7 on it. From now on a workflow merges `development` into
`dev/dependabot` after each push to `development`, and opens a pull
request `dev/dependabot` → `development` when dependabot has landed
something; Jarvis has a prompt for a collision, Joker reviews the pull
request, Cleo merges. Jarvis and Joker commit only once they are in
`.github/AUTHORS` (rule 1, Q11).

> ## mistake related with id adding
>
> I believe I was actually wrong there
>
> by experiencing other extension's metadata in my browser if i am right it should be something like that there: `save-my-chat@radiokociamuzyka.pl`
>
> please fix that for me anywhere that id is present
>
> i was thought it works like android's app id or similar

**Decision:** the id is `save-my-chat@radiokociamuzyka.pl`, in the
manifest and wherever it is named. Firefox treats the new id as another
add-on: the temporary add-on is loaded again and its `storage.local`
(disabled readers, selector overrides) starts empty. AMO has not seen the
id yet, so nothing else changes.

## 2026-11-27, the owner's answers to Q8-Q11 (issues #22-#25, then ORDERS.md, word for word)

### Q8

From issue #22, Sett, 2026-11-27:

> read that issue's commentary about `src/vendor` and dependencies: https://github.com/radiokociamuzyka/save-my-chat/issues/24
>
> these things should be placed in gitignored vendor dir at building before packing an release archive file.

**Decision:** ZenFS (with its IndexedDB backend) and isomorphic-git for
PP1's explorer, as leaned. Like turndown they are not committed: every
dependency of `package.json` is gathered into a gitignored `src/vendor/`
at build time, before the archive is packed (Q10).

### Q9

From issue #23, Sett, 2026-11-27:

> sure, add that button

**Decision:** the gist button is approved as leaned: in the viewer, the
user's own act, with the user's token in `storage.local`, `api.github.com`
as an optional host permission asked on first use, the transfer declared
in `data_collection_permissions.optional`, secret gists by default. Rule 4
of AGENTS.md names it as its one exception. Built in phase 4.

### Q10

From issue #24, Sett, 2026-11-27:

> your `Lean:` way is good but add also that all to be done by batched `task build` that also gathers that codes in `src/vendor` right now (we want it to be gitignored in the repo, like `node_modules`, so all that we will have as dependencies of `package.json` will become packed and added inside `src/vendor` for our released packed addon of browser)

**Decision:** `scripts/chats.mjs` writes `src/core/readers.js` and the
manifest's host permissions from `resources/data/chats.yaml`; both stay
committed, a test checks they are what the script writes. `task build`
is the batch: `scripts/vendor.mjs` copies every dependency of
`package.json` into `src/vendor/` (gitignored, like `node_modules`; each
package's files named in `package.json` `vendor`, unchanged, with its
license), then the chats, then `web-ext build`. Checks, `task run` and
the release run the vendor step first.

### Q11

From issue #25, Sett, 2026-11-27:

> settings was been changes and these autor entries just fill like here they was been made: https://github.com/Sarverott/P-jol-roll/blob/master/.github/AUTHORS

**Decision:** `.github/AUTHORS` gets Jarvis's line as P_JOL_ROLL has it and
Joker's in the same form (the Codex app's GitHub noreply address). Actions
may open pull requests now, so `dependabot.yml`'s `land` job can work.

## 2026-11-27, the owner's review of TODO (TODO.md, then the chat, word for word)

On "The phase closed: a pull request `development` → `master` (Q7)", struck out.

On "A saved, anonymised page of each as `tests/fixtures/`, and tests reading them", struck out:

> for now we do not need other's people input, so if issues will come then we will make that anonymised raporting of page tests

On "Each reader checked by hand in Firefox on a live conversation, the result in `docs/.agents/NOTES.md`":

> __there i have no access as i claim it your own sovereign domain! i can only read it__ but sounds that this was done when i raport you that copilot's reader does not work... just close that step or move out of phase 1

In the chat:

> every time when you stop work to inform me send PR from development to master so releasing will be performed - i want to check with public flow if it was fixed what i told you about copilot, we need to increase rate of checking how it works in the wild. i reviewed todo and some of steps was removed. continue your work so i will be able to proper test that reader for you. please follow that pattern of work. thank you in advance

**Decision:** a pull request `development` → `master` is opened at every
stop of work, so a merge releases a build to test in the wild; the
phase-closing item goes, phases end by the same pull request. Fixtures
leave phase 1: anonymised pages come when an issue needs one. The live
check is Sett's, by the released build; Sett's reports are written down
by Cleo in `docs/.agents/NOTES.md`, so the step leaves phase 1 as a
standing practice. To make that testing easier, phase 1 gets the
selector editor in the options page and a report of what a reader saw.

## 2026-11-27, the owner's live check of v0.1.53 (the chat, word for word)

> great, so then you can also consider to fix that funny swap in google-ai-mode where instead of true order each question message from user and answer from agent are switched in order. result is hilarious, example of 6 message history order is `1,0,3,2,5,4` instead of right one `0,1,2,3,4,5,6`. you made them ignore own chronology, but don't worry, just make it detect all messages and then recognize one of 2 categories of messages: user's and agent's. let's try that. as for copilot all looks like it's working fine. good job

**Decision:** the Copilot reader is confirmed in the wild. AI Mode's swap
came from each answer's block holding its question: the kit now finds
all messages with one query, tells user from agent by the set each one
matches, and orders them by where each one's own text starts. The
popup's report counts messages nested in the other role's, to confirm
the shape on the live page.

## 2026-11-27, the owner's live check of v0.1.59 (the chat, word for word)

> yes, now order in both is correct: [the reports of google-ai-mode and github-copilot, 4 user and 4 assistant each] does not show you how ordered are messages? in right order both of chatting stories always start with user and end with agent (6 messages is `user,agent,user,agent,user,agent` - consider to add that notice for our debug raport)

**Decision:** the order of both readers is confirmed in the wild. The
report gets an `order:` line of roles, and the kit warns when a chat does
not start with the user, end with the agent and alternate.
