# A long ChatGPT chat read as one window, 75 times over

- **Met:** 2026-11-28, phase 7, a long chat read whole through the debug gate.
- **Topic:** [readers](../solutions/readers.md)

## What happened

The whole read keeps each message by the page's own id (`turnsBy`'s `key`). ChatGPT's reader
used `data-chatgpt-search-unit-key`, whose value had looked like `<uuid>:<n>:<role>`. On a
long chat it is `fallback-turn-<n>:<n>:<role>`: `<n>` counts the turns loaded so far, and
each older batch loaded renumbers every turn below it. The 10 messages at the end came back
after every pull to the end, each time under new keys, so they were kept again: 750
messages, 14 of them different, after 31 minutes.

Keyed rightly, a second fault showed: ChatGPT pulls the view back to the end of the chat
when it is scrolled up, and a read stepping up from where the view was stood still, until
its patience ran out with 12 messages.

## What to do

- A key is the message's, not its place: ChatGPT's `data-chatgpt-search-message-ids`
  first; a unit key starting `fallback-` is never one (the text is the fallback then).
- `readWhole` steps up from the farthest point reached, measured from the end (older
  messages loading above move the top, not the end), never past the top. A view pulled
  back is put back once. A window meeting nothing kept is read again after a longer
  pause, without moving: stepping back down instead made the read too slow and it ended
  at 224 of 734.
- Seen: 734 messages in 17 minutes, the same twice; a fresh tab may end at once with
  the 10 loaded (ChatGPT gave nothing older at its top), a second read then reads it all.
- A test with fake pages should renumber its keys too, as the page does: a test with
  stable keys would not have caught it.
