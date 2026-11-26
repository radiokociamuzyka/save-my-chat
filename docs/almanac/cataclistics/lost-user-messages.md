# AI Mode saved without the user's messages

- **Met:** 2026-11-26, Sett testing v0.0.1 on real AI Mode conversations.
- **Topic:** [readers](../solutions/readers.md)

## What happened

The first AI Mode reader was written without the live page. It guessed a
structure of exchange blocks holding a question heading and an answer, and
fell back to the main column as one answer. AI Mode has no such
structure, so the questions were never found and the saved files held
answers only. Nothing said so: the file looked complete.

Sett's own devtools snippet, written before the extension, found the
messages by Google's class names (`.ilZyRc`, `.L4dlbc` for the user,
`.CKgc1d` for the agent) in one `querySelectorAll`, and still missed
some user messages: Google renames these generated classes with its builds,
and one conversation can carry more than one name for the same role.

## Solution

- Selectors are **sets of candidates** per role, newest first, with the
  user's overrides from `storage.local` in front (`src/core/kit.js`,
  `effective`, `selector`).
- Turns are collected **in page order across all roles** at once
  (`turnsBy`), as the snippet did; nested turns of another role are kept
  apart, duplicates skipped.
- The first question is **taken from the address** (`q=`) when no user
  turn opens the conversation, marked `from: "address"`.
- A **warning** in the popup when questions and answers do not pair up
  (`suspicions`), so an outdated selector is noticed at once.

## Recognise it again

The popup says "N answers but M questions". Open the page's inspector on a
missing message, take its class, and put it in front of the reader's set
(`docs/guides/readers.md`, "Fixing a reader without a release"); then
add it to the reader itself in a commit.

A reader is never trusted until it has been checked on the live page.
