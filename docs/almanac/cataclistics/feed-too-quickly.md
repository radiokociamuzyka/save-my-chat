# The feed was submitted too quickly

- **Met:** 2026-11-27, the first run of `feed.yml` after v0.2.4.
- **Topic:** [flow](../solutions/flow.md)

## What happened

The first run wrote the whole history at once: 34 discussions, and a
comment plus an answer mark for each almanac case, about fifty writes in
a minute. GitHub refused the next one with `was submitted too quickly`
and the run failed with the last almanac case missing. GitHub limits
creating content beyond the plain API rate limit (its "secondary rate
limits": no more than about 80 content-creating requests a minute, and a
second between writes is asked for).

## Solution

`discussions.py` pauses two seconds after every write, and when GitHub
answers "too quickly" (or names a secondary rate limit) it waits 60,
120, 240, 480 seconds and tries again. Its markers made the rerun safe:
what exists is found and left alone.

## Recognise it again

A script that writes many issues, discussions or comments in one run
fails part way with "too quickly" or "secondary rate limit". Writes need
a pace, and a rerun must find what the failed run already made.
