# The feed refused an edit of its own note

- **Met:** 2026-11-27, `feed.yml` after v0.2.13.
- **Topic:** [flow](../solutions/flow.md)

## What happened

The second run created the new notes, then tried to update the note
"Phase 2 begun", whose body held a count of ticked steps and so changed
with every release. GitHub answered `Resource not accessible by
integration` to the workflow's token, and the run stopped there, with
the release note and two almanac cases still to come.

## Solution

A note in Announcements is a notice of its moment: it is written once
and never edited, and nothing that changes over time goes into it.
Discussions that follow a source (Ideas, Q&A) are still updated, and a
refusal of one post is reported at the end instead of stopping the run.

## Recognise it again

A feed or changelog post that is rewritten on every run; a batch job
that dies on its first refusal and leaves the rest undone.
