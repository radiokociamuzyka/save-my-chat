# AI Mode saved every pair swapped

- **Met:** 2026-11-27, Sett testing v0.1.53 on a live AI Mode chat.
- **Topic:** [readers](../solutions/readers.md)

## What happened

A conversation of six messages was saved in the order 1,0,3,2,5,4: each
answer before its question. The kit read all roles with one
`querySelectorAll` "in page order", but that order is where each element
*opens*, and an ancestor opens before what it holds. AI Mode's answer
block (`.CKgc1d`) holds its question (`.L4dlbc`), so every answer came
first, its question cut out of it and saved after it. The first message
being an answer also made the address fallback add the first question a
second time.

## Solution

As Sett put it: find every message, then tell user from agent. Messages
are ordered by where their *own* text starts, the first visible text in
the element that is not inside a held message of the other role. A flat
page keeps its order. The popup's report says `nested: 3 user in
assistant` when the shape is there.

## Recognise it again

Pairs swapped, or a question saved twice at the start. Elements of
different roles nested in each other: document order of elements is not
the order a reader sees.
