# When a reader misses something

Chat webapps change their pages often, and the class names a reader looks
for change with them. When that happens, a reader sees fewer messages, or
none. You can see what it saw, and often fix it yourself, without waiting
for a new release.

## What the reader saw

In the popup, open **What the reader saw**. It shows:

- the version, the reader and the site;
- `messages`: how many of each role it found;
- `order`: the roles in the order they will be saved, `U` for you, `A` for
  the assistant. A whole chat reads `U A U A …` and ends with `A`;
- for each part (`user`, `assistant`) every selector it tries and how many
  elements of the page that selector finds (`invalid` when it is not valid
  CSS, `(override)` when it is one of yours);
- `nested`: messages held inside a message of the other role, when there
  are any;
- the warnings.

It holds no text of your conversation. **Copy report** puts it on the
clipboard, ready to paste into an issue.

A part whose selectors all find `0` is the part that broke.

## Your own selectors

In the extension's options, open **Selectors** under a reader. Each part
has a field for your own CSS selectors, one per line; they are tried
before the built-in ones, which are listed below the field.

To find one: open the conversation, right-click a message of the part
that broke, choose **Inspect**, and look for a class or attribute that
every message of that kind carries. Save, then save the conversation
again: the selector is used at once. Invalid CSS is refused, and **Back to
built-in** removes yours.

When a selector is not enough, copy the reader into a
[prototype](prototypes.md) and change its code.

## Telling us

Open an issue with the
[broken reader template](https://github.com/radiokociamuzyka/save-my-chat/issues/new?template=broken_reader.md)
and paste the report. If a selector of yours fixed it, add it: it can
become a built-in one.
