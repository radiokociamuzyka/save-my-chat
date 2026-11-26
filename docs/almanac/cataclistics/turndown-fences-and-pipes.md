# Turndown closes fences early and splits table cells

- **Met:** 2026-11-26, phase 1, moving the kit onto turndown 7.2.5 and
  turndown-plugin-gfm 1.0.2.
- **Topic:** [markdown](../solutions/markdown.md)

## What happened

The tests of the old hand-written converter were run against turndown.
Two failed in ways that lose data in a saved chat:

- `<pre><code>const a = "```";</code></pre>` became a three-backtick
  fence around a line containing three backticks, so the block ends in
  the middle of the code and the rest of the answer turns into code.
  AI answers about Markdown itself hit this often.
- `<td>2|3</td>` in a GFM table stayed `2|3`, so the row gets one more
  column than the header.

## Solution

Two rules added with `addRule` after `use(gfm)` (turndown checks rules
added later first): `fence` writes a fence one backtick longer than the
longest run inside the code, keeping `language-*`; `cell` escapes
unescaped pipes and folds newlines inside a cell. `src/core/kit.js`.

## Recognise it again

A saved code block that swallows the text after it, or a table whose rows
are wider than its header. The tests in `tests/kit.test.js` ("fences code
blocks…", "writes tables") guard both. Check them again when turndown or
its plugin is updated (`task vendor`).
