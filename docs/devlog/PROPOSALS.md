# PROPOSALS: ideas for debate

Ideas anyone may propose, `## PP<n>. <title>`. The owner decides them in
[ORDERS.md](ORDERS.md). Numbers are given once and never reused.

PP1-PP2 were decided (changelog phase 1).

## PP3. WebMCP: the debug gate's tools for an agent in the browser

Sett (RR8) named WebMCP beside the classic MCP. WebMCP is a W3C
community draft: a page offers tools to an agent running in the browser
through `navigator.modelContext` (`registerTool`), instead of the agent
driving the page by clicks and screenshots. Firefox does not have it
(2026-11-28); Chrome has it behind a flag, and an extension (MCP-B)
fills it in elsewhere.

The gate's tools are a table already (`scripts/debug/tools.mjs`, the
same names in `src/debug/background.js`), so WebMCP would be one more
way in: when `navigator.modelContext` exists, the debug build's page
script registers the page's tools (outline, query, element, highlight,
point) on the page it is in. Two cautions: a page's own scripts would
see those tools too (they live in the page's world, not the
extension's), and a tool offered there reads the page for whatever agent
the browser runs.

*Proposed:* kept for when Firefox has `navigator.modelContext`; until
then the classic MCP of the gate covers the need.

