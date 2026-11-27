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
