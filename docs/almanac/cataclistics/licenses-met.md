# Two licenses met: LGPL-3.0 inside an MPL-2.0 extension

- **Met:** 2026-11-27, phase 4, the explorer of the stored files (Q8);
  looked into in phase 5 at Sett's ask.
- **Topic:** [licenses](../solutions/licenses.md)

## What happened

The explorer keeps the library as files in git on ZenFS (`@zenfs/core`,
`@zenfs/dom`). ZenFS has been under the GNU LGPL 3.0 or later since its
v2.4.0 (MIT before). save-my-chat is under the Mozilla Public License
2.0, and Vite bundles ZenFS into the options page: two licenses with
different rules, met in one file that AMO ships to every user. The
question was whether they can live together, and what each asks.

Looking closer found more than ZenFS: three helpers of the same author,
`@zenfs/streams`, `utilium` and `memium`, are LGPL-3.0 too and bundled
with it; `npm ls` lists them, nothing in the build said so. Every other
package bundled is MIT, ISC, BSD, Apache-2.0 or Zlib.

## Why they fit

- **The MPL-2.0 is weak copyleft per file.** It asks that our own files
  stay MPL and their source stays available; a "Larger Work" (MPL 3.3)
  may hold code under other licenses beside them. It does not reach into
  ZenFS's files.
- **The LGPL-3.0 lets a "Combined Work" be under any terms** (its section
  4), as long as those terms do not stop the user changing the library and
  debugging such changes, and when the one who conveys it:
  - a) gives notice with each copy that the library is used and covered
    by the LGPL;
  - b) ships the LGPL and the GPL texts with it (ZenFS's `COPYING.md`
    allows links in their place, for ZenFS only);
  - c) shows the library's copyright notice beside its own, if it shows
    any while running (save-my-chat shows none);
  - d) 0) gives the library's source at the version built in, and our own
    code in a form the user can rebuild with a changed library;
  - e) gives installation information, only for a "User Product" of GPL
    section 6 (a device); not this case.
- **ZenFS's own exception for web applications does not apply:** an
  extension runs on the user's computer, not over a network. So 4(d) is
  met by the full route, not the short one.
- **Bundling is allowed.** The LGPL speaks of "linking"; a bundle that
  keeps ZenFS's code apart and unchanged, unminified, with our own source
  and build attached, lets anyone rebuild it with their own ZenFS: what
  4(d)0 asks. ZenFS's `COPYING.md` says outright that bundling is fine.

## Solution

What the extension now does for each condition:

| LGPL-3.0 asks | save-my-chat does |
| --- | --- |
| 4(a) a notice with each copy | `THIRD-PARTY.md` at the root of the extension, written by the build (`scripts/notice.mjs`, a Vite plugin): every package bundled or copied, its version, license and source; the LGPL ones named with what covers them |
| 4(b) the LGPL and GPL texts | `vendor/zenfs-core.LICENSE` (the LGPL, with `COPYING.md`), `licenses/GPL-3.0.txt` (the GPL, as published by the FSF) |
| 4(d)0 the library's source | linked in the notice at the exact version built in; `package-lock.json` pins it |
| 4(d)0 our code, rebuildable | the source archive of each release (also uploaded to AMO), "Building from source" in the README, the pages not minified |
| no terms against changing it | the MPL-2.0 restricts no one from changing ZenFS or reverse engineering it |
| LGPL section 2: changes to the library shared | ZenFS is used unchanged; a patch to it would be published under the LGPL |

The guard that keeps it so: the notice is written from what the build
holds, not by hand, and a license it does not know stops the build
(`LICENSES` in `scripts/notice.mjs`, `tests/notice.test.js`). A package
under the GPL (not the LGPL), the AGPL, or "MIT OR GPL" comes in as a
failed build and a question for Sett, not silently.

## Conclusions

- An LGPL library may be built into an MPL-2.0 (or MIT, or closed)
  program: the conditions are notice, texts, the library's source, and a
  program the user can rebuild with a changed library.
- A GPL library could not be: the GPL would cover the whole extension.
- Look at the licenses of what is **bundled**, not only of
  `package.json`'s dependencies: the LGPL helpers came in two levels deep.
- A notice written by hand goes out of date at the next dependency bump;
  one written by the build from the modules it bundled does not.
- Not legal advice: what is read here is the license texts and ZenFS's
  own `COPYING.md`. A doubt goes to the authors (ZenFS asks for it in its
  Discussions) or a lawyer.

## Recognise it again

A new dependency, or a bump, that fails the build with "licenses not yet
looked at"; a `LGPL`, `GPL`, `AGPL`, `MPL` or `EUPL` in
`npm ls --omit=dev --all` (read each `license` field); a package whose
license changed between versions, as ZenFS's did at v2.4.0.
