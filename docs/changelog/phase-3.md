# Phase 3: prototypes

Append-only. The owner's words are kept word for word.

## 2026-11-27, the owner after v0.3.11 (the chat, word for word)

> okidoki, that was fun! check these issues there... not all was solved but at least partially success - concept of that RRs will be adopted into whole BOS i think. proceede further actions there

**Decision:** the three reports below, written on the RR issues, are
answered one by one; the RRs not yet done stay in REQUESTS.md, rewritten
by what the reports taught. That RRs go to the whole of BOS is noted for
the BOS repository (`~/__WORKSHOP/forge/NOTES-for-repositories.md`).

### RR1 (issue #79, word for word, not done yet)

> huh, that was too hard for me until now each time i had notifications about that ruleset stuff...
>
> ### RR1... wait... not done
>
> there is no app "GitHub Actions" there when i want to add it in bypass list.
>
> all other things added, but disabled because of that for now

**Decision:** GitHub offers no "GitHub Actions" to the bypass list of a
ruleset in this repository, so the release no longer needs one: when a
version was released already, `release.sh` tags a hotfix bump on top of
`master` without pushing `master`, and the release's merge back into
`development` takes the tag. RR1 is rewritten without the bypass: the
ruleset can be turned on as it is.

### RR2 (issue #80, word for word, not done yet)

> ### error at step 2
> - unable to save it. 
> - that results with message `The code registers no reader: it needs SaveMyChat.reader({...}).` aside that save and delete buttons under scripts.
> - codes even when remains unchanged prototype boilerplates results with that
> - no devlog notes in console related with it _(yes, i mean inspection for addons version of devtools that also is used to debug standard webapps)_

**Decision:** a bug of the options page: saving looked for
`SaveMyChat.reader(`, but the default readers call it as `SMC.reader(`
(`const SMC = globalThis.SaveMyChat`), so even an unchanged copy was
refused; the test had stubbed the file with the very text the check
wanted. The check now looks for `.reader(`, and the test copies the real
reader files. RR2 waits for the next release.

### RR3 (issue #82, word for word)

> > wait, no way...
> >
> > huh, than okay!
>
> # Cleo, file it please
> ### thx a lot!

**Decision:** Cleo files the issue on mozilla/addons-linter with `gh`,
after looking for one already open, and links it from the almanac case.

## 2026-11-27, the owner after v0.3.18 (the chat, word for word)

> yay! all done there, proceede next moves amigo

**Decision:** both RRs left are reported done (below): phase 2 and
phase 3 are closed, and phase 4 (the frontend) begins at `0.4.x`. The
feed's run after v0.3.18 failed on the edit of an answer: the feed no
longer edits anything it posted (almanac: feed-edit-refused, its second
time).

### RR1, done (issue #79, word for word)

> understood, ruleset was reactivated then

**Decision:** checked through the API: the ruleset `master` is active,
with no bypass, requiring a pull request and the check `verify`, and
refusing deletion and force pushes. Phase 2's last item is ticked.

### RR2, done (issue #80, word for word)

> all went well, no errors, without problems
>
> > console output of devlog inspect (f12):
> ```log
> save-my-chat: prototype loaded, reader github-copilot
> ```
>
> we can mark it as done

**Decision:** prototypes work in a real Firefox: the permission, the
copy saved, the prototype loaded in the chat's page. Phase 3's last
item is ticked.
