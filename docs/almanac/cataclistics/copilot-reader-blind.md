# The Copilot reader saw no messages

- **Met:** 2026-11-27, Sett trying the Copilot reader on
  `https://github.com/copilot/c/*`.
- **Topic:** [readers](../solutions/readers.md)

## What happened

The first Copilot reader was written without the live page, like the
first AI Mode reader ([lost-user-messages](lost-user-messages.md)). It
guessed `[data-testid$='-message']` and `ChatMessage-module__chatMessage`
classes and took the role from words like "user" or "copilot" in them.
The page has neither, so nothing matched and the popup said no messages
were found.

## Solution

Sett's devtools snippet (`src/readers/drafted-snippets/github-copilot.turndown.js`)
showed the real shape: each message a `.message-container`, a user's with
a class `user__…`, Copilot's `ai__…`. Those are now the reader's selector
sets; the hashed tail after `__` may change with GitHub's builds, the
prefix is matched, and a new name can be added as an override without a
release.

## Recognise it again

A reader marked `// NOTE: unverified` is a guess and fails silently. A
default reader is fitted from a snippet run on the live page, or from a
saved page, before it ships.
