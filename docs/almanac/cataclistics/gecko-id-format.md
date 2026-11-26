# A domain is not an add-on id

- **Met:** 2026-11-26, Q2 answered with `save-my-chat.radiokociamuzyka.pl`.
- **Topic:** [manifest](../solutions/manifest.md)

## What happened

The owner chose the domain `save-my-chat.radiokociamuzyka.pl` as the
add-on's id. Firefox validates `browser_specific_settings.gecko.id`
against `^[a-zA-Z0-9-._]*@[a-zA-Z0-9-._]+$` (or a GUID in braces), so a
plain domain would fail `web-ext lint` and AMO's upload.

## Solution

`@save-my-chat.radiokociamuzyka.pl`: the same string with a leading `@`.
The part before `@` may be empty, and Mozilla recommends this form
(`@name.dev`). `web-ext lint` passes with it.

## Recognise it again

An id without `@` and not in braces. AMO binds the id on the first
signing for good, so settle it before `task sign:unlisted`.
