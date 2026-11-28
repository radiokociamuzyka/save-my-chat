# Samples of the webapps' pages

Sett, RR8: public shares of Sett's own conversations, one per webapp and
layout, so a reader can be checked against what is expected from it.

- `.map.json` - Sett's: the public share links sampled. Its shape is
  free; every `http(s)` address in it counts as listed.
- `DN_<host>/<name>/` - one sample, saved by the debug gate's `sample`
  tool (docs/guides/debug.md): `page.html` (the page with its scripts
  and styles left out, e-mail addresses masked) and `read.json` (the
  address, the title, when, and what the reader read then).

The gate saves only pages whose address `.map.json` lists. Look a sample
over before it is committed: a page shared publicly may still show the
account viewing it (a name, an avatar) around the conversation.
