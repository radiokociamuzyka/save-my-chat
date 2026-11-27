# The public site's folder was ignored as MkDocs' output

- **Met:** 2026-11-27, phase 4, the public site moved to Astro (Q13).
- **Topic:** [flow](../solutions/flow.md)

## What happened

The Astro site went into `site/`, built and tested well, yet `git status`
listed only the stylesheet moved there. `.gitignore` held `site/`, MkDocs'
default output folder, added with Read the Docs; and `site/` already held
an old build of the manual. Committed as it was, the site would have
been left out without a word: its sources never reaching the repository,
the pages workflow failing on the runner.

## Solution

MkDocs builds into `dist/docs` (`site_dir` in `mkdocs.yml`; Read the
Docs sets its own folder anyway), the `site/` line left `.gitignore`, and
the old build was removed. `git check-ignore -v <file>` names the line
that hides a file.

## Recognise it again

New files that `git status` does not list; a folder name some tool uses
by default for its output (`site/`, `build/`, `public/`, `out/`).
