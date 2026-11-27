# Your own reader: prototypes

A prototype is your own copy of a reader. You change its code, and it
runs in place of the default reader on the pages you name, until you turn
it off or delete it. It is the way to fix a reader yourself when your own
selectors are not enough, or to try a new idea before it becomes a
default.

Prototypes run through Firefox's *user scripts*, which Firefox asks you to
allow once. Nothing about them leaves your machine.

## Making one

1. Open the extension's options (`about:addons`, save-my-chat,
   **Preferences**) and find **Prototypes**.
2. Click **Allow user scripts** and accept Firefox's question. Until you
   do, the defaults run and your prototypes wait.
3. Click **Make a prototype of …** under the reader you want to change. Its
   code is copied into an editor, with the pages it runs on.
4. Change the code, click **Save**, and **reload the chat's page**: a
   prototype starts with the page, so a page open from before does not
   have it yet (the popup says so).

The popup names a prototype's reader **(your prototype)**, and the
report under **What the reader saw** works the same.

## What you can change

- **The pages it runs on**: match patterns, one per line, such as
  `https://github.com/copilot*`. Only sites the extension may already read
  are accepted.
- **The code**: a `SaveMyChat.reader({ ... })` like the default's. How a
  reader is written is in [the readers guide](../guides/readers.md). Your
  own selectors from **Selectors** do not apply to a prototype: change the
  selectors in its code instead.

A mistake in the code shows in the page's web console (F12), and the
popup then says it found no conversation. Turn the prototype off and the
default runs again.

## Off, deleted, kept

- The checkbox turns a prototype off: the default runs again from the
  next page load.
- **Delete** removes it.
- **Export prototypes** saves them all into one JSON file;
  **Import prototypes** reads such a file back. Imported prototypes arrive
  turned off, so you can read their code before running it: run only code
  you trust, since a prototype reads the chat pages it runs on.
