# A domain is not an add-on id

- **Met:** 2026-11-26, Q2 answered with `save-my-chat.radiokociamuzyka.pl`;
  corrected by the owner on 2026-11-27.
- **Topic:** [manifest](../solutions/manifest.md)

## What happened

The owner chose the domain `save-my-chat.radiokociamuzyka.pl` as the
add-on's id, thinking of it like an Android application id. Firefox
validates `browser_specific_settings.gecko.id` against
`^[a-zA-Z0-9-._]*@[a-zA-Z0-9-._]+$` (or a GUID in braces), so a plain
domain would fail `web-ext lint` and AMO's upload.

The first fix kept the owner's string whole and put `@` in front of it:
`@save-my-chat.radiokociamuzyka.pl`. It passes the check, but it is not
what an id of this form means: the part after `@` is a domain the author
holds, the part before it names the add-on in that domain. Looking at the
ids of other extensions in his browser, the owner saw that and corrected
it.

## Solution

`save-my-chat@radiokociamuzyka.pl`: the add-on's name, `@`, the owner's
domain. `web-ext lint` passes with it. Firefox treats a changed id as
another add-on, so the temporary add-on is loaded again and its
`storage.local` starts empty; AMO had never seen the old id.

## Recognise it again

An id without `@` and not in braces; or a whole domain glued behind a
leading `@` where a name and a domain were meant. Ask which domain is
held and what the add-on is called in it. AMO binds the id on the first
signing for good, so settle it before signing (phase 6).
